"use client";

import React, { useState, useEffect } from "react";
import {
  Lock,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Calendar,
  Laptop,
} from "lucide-react";
import {
  DEFAULT_APP_SECRET,
  verifySecretPasscode,
  registerCurrentDevice,
  isCurrentDeviceRevoked,
  getSecretValidityInfo,
  getActiveAppSecret,
  isAppSecretExpired,
} from "@/lib/device-manager";

interface AccessGateProps {
  children: React.ReactNode;
  onLockChange?: (unlocked: boolean) => void;
}

const STORAGE_KEY = "verdana_access_token";
const SESSION_DURATION_MS = 60 * 24 * 60 * 60 * 1000; // 60 days

export function AccessGate({ children, onLockChange }: AccessGateProps) {
  const [isUnlocked, setIsUnlocked] = useState<boolean | null>(null);
  const [passcode, setPasscode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validity, setValidity] = useState({
    secret: DEFAULT_APP_SECRET,
    formattedExpiry: "December 1, 2026",
    isExpired: false,
    daysRemaining: 70,
  });

  useEffect(() => {
    setValidity(getSecretValidityInfo());

    // 1. Check if this device has been explicitly revoked
    if (isCurrentDeviceRevoked()) {
      localStorage.removeItem(STORAGE_KEY);
      setIsUnlocked(false);
      setErrorMsg("This device's access was revoked by administrator.");
      onLockChange?.(false);
      return;
    }

    // 2. Check if active secret is expired
    if (isAppSecretExpired()) {
      localStorage.removeItem(STORAGE_KEY);
      setIsUnlocked(false);
      setErrorMsg("Access secret expired on 1st December 2026. Please contact Muzamil for renewed access.");
      onLockChange?.(false);
      return;
    }

    // 3. Check existing saved session
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const age = Date.now() - (parsed.timestamp || 0);
        const activeSecret = getActiveAppSecret();

        if (
          age < SESSION_DURATION_MS &&
          parsed.token?.toLowerCase() === activeSecret.toLowerCase()
        ) {
          // Keep device session active
          registerCurrentDevice(parsed.token);
          setIsUnlocked(true);
          onLockChange?.(true);
          return;
        }
      }
    } catch {
      // Ignore parse errors
    }

    setIsUnlocked(false);
    onLockChange?.(false);
  }, [onLockChange]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const trimmed = passcode.trim();
    if (!trimmed) {
      setErrorMsg("Please enter the secret access key.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const result = verifySecretPasscode(trimmed);

      if (result.success) {
        try {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
              token: trimmed,
              timestamp: Date.now(),
            })
          );
        } catch {}

        // Register this device in authorized device registry
        registerCurrentDevice(trimmed);

        setIsUnlocked(true);
        onLockChange?.(true);
      } else {
        setErrorMsg(result.error || `Incorrect secret key. Try ${DEFAULT_APP_SECRET} or contact Muzamil.`);
      }
      setIsSubmitting(false);
    }, 250);
  };

  // Prevent flash of lock screen while reading localStorage
  if (isUnlocked === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500/20">
        {/* Top Clinical Reassurance Bar */}
        <div className="bg-black text-white px-4 py-2.5 text-xs sm:text-sm font-medium tracking-wide border-b border-white/10">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Etsy Intelligence • Private Team Access Gate</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Calendar className="w-3 h-3 text-emerald-400" />
              <span>Valid till 1st Dec 2026</span>
            </div>
          </div>
        </div>

        {/* Lock Screen Centered Card */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-md bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
            {/* Ambient banner texture */}
            <div className="bg-black p-6 text-white text-center relative overflow-hidden border-b border-white/10">
              <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 p-2 mx-auto mb-3 shadow-md flex items-center justify-center">
                <img
                  src="/logo-icon.png"
                  alt="Etsy Intelligence Logo"
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight font-heading">
                Etsy Intelligence
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                SEO &amp; Competitor Intelligence Studio
              </p>
            </div>

            {/* Passcode Form */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="text-center space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-[0.5px] border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Valid till 1st December 2026</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 font-heading">
                  Enter Secret Access Key
                </h3>
                <p className="text-xs sm:text-sm text-slate-500">
                  Authorized access for devices and apps managed by Muzamil.
                </p>
              </div>

              <form onSubmit={handleUnlock} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-semibold text-slate-900">
                    Secret Passcode
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={passcode}
                      onChange={(e) => {
                        setPasscode(e.target.value);
                        setErrorMsg("");
                      }}
                      placeholder="e.g. MuzamilTheKing"
                      autoFocus
                      className="w-full h-12 bg-slate-50 border border-slate-200 focus:border-black focus:bg-white focus:ring-2 focus:ring-black/10 rounded-xl pl-10 pr-11 text-sm sm:text-base font-mono text-slate-900 placeholder:text-slate-400 outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {errorMsg && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 bg-black hover:bg-zinc-800 disabled:opacity-50 text-white text-sm sm:text-base font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 border border-black cursor-pointer"
                >
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span>{isSubmitting ? "Verifying..." : "Unlock Studio"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Secret Key Quick-Fill Box */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-1.5">
                <span className="text-[11px] text-slate-500 block">
                  Active Secret (Valid Till 1st Dec 2026):
                </span>
                <button
                  type="button"
                  onClick={() => setPasscode(DEFAULT_APP_SECRET)}
                  className="inline-block font-mono text-xs font-bold text-emerald-800 hover:text-emerald-950 hover:underline bg-emerald-100/70 border border-emerald-200 px-3 py-1.5 rounded-lg transition cursor-pointer"
                >
                  {DEFAULT_APP_SECRET} (Click to Fill)
                </button>
              </div>

              {/* Security info */}
              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 text-center">
                <Laptop className="w-3.5 h-3.5" />
                <span>Devices &amp; apps manageable from the main dashboard</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-white/10 bg-black px-6 py-4 text-center">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
            <span>Etsy Engine • Private Internal Edition</span>
            <div className="flex items-center gap-1.5 font-semibold text-white">
              <span>Crafted &amp; Managed</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                by Muzamil
              </span>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return <>{children}</>;
}

export function lockApp() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }
}
