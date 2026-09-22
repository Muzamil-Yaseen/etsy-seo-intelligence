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
  ShieldAlert,
  X,
  Sparkles,
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
import {
  verifyAdminPassword,
  setAdminAuthenticated,
  reauthorizeCurrentDevice,
  getAdminSettings,
} from "@/lib/admin-settings";
import { MasterAdminModal } from "@/components/master-admin-modal";

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

  // Admin Modal & Prompt state
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [showAdminPrompt, setShowAdminPrompt] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [adminError, setAdminError] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  const [settings, setSettings] = useState(getAdminSettings());
  const [validity, setValidity] = useState({
    secret: DEFAULT_APP_SECRET,
    formattedExpiry: "December 1, 2026",
    isExpired: false,
    daysRemaining: 70,
  });

  const checkSession = () => {
    setValidity(getSecretValidityInfo());
    setSettings(getAdminSettings());

    // 1. Check if active secret is expired
    if (isAppSecretExpired()) {
      localStorage.removeItem(STORAGE_KEY);
      setIsUnlocked(false);
      setErrorMsg("Access secret expired on 1st December 2026. Please contact Muzamil for renewed access.");
      onLockChange?.(false);
      return;
    }

    // 2. Check if this device has been explicitly revoked
    if (isCurrentDeviceRevoked()) {
      localStorage.removeItem(STORAGE_KEY);
      setIsUnlocked(false);
      setErrorMsg("This device's access was revoked. Enter admin password to reauthorize.");
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
  };

  useEffect(() => {
    checkSession();

    const handleSettingsChanged = () => {
      setSettings(getAdminSettings());
      setValidity(getSecretValidityInfo());
    };

    window.addEventListener("admin-settings-changed", handleSettingsChanged);
    return () => window.removeEventListener("admin-settings-changed", handleSettingsChanged);
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
      // Check if user entered the master admin password "muzamily"
      if (verifyAdminPassword(trimmed)) {
        reauthorizeCurrentDevice();
        registerCurrentDevice("muzamily");
        setAdminAuthenticated(true);
        setIsUnlocked(true);
        onLockChange?.(true);
        setIsAdminModalOpen(true);
        setIsSubmitting(false);
        return;
      }

      // Check standard app secret
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

        // Clear any previous revoked state
        reauthorizeCurrentDevice();
        // Register this device in authorized device registry
        registerCurrentDevice(trimmed);

        setIsUnlocked(true);
        onLockChange?.(true);
      } else {
        setErrorMsg(result.error || "Incorrect secret access key. Please verify your credentials or contact Muzamil.");
      }
      setIsSubmitting(false);
    }, 250);
  };

  const handleAdminPromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError("");

    const trimmed = adminPasswordInput.trim();
    if (verifyAdminPassword(trimmed)) {
      reauthorizeCurrentDevice();
      registerCurrentDevice("muzamily");
      setAdminAuthenticated(true);
      setShowAdminPrompt(false);
      setAdminPasswordInput("");
      setIsAdminModalOpen(true);
      setIsUnlocked(true);
      onLockChange?.(true);
    } else {
      setAdminError("Invalid admin master password.");
    }
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
              <span>{settings.branding.appName} • Private Team Access Gate</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
                <Calendar className="w-3 h-3 text-emerald-400" />
                <span>Valid till 1st Dec 2026</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAdminPrompt(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-emerald-400 hover:text-emerald-300 border border-white/15 text-xs font-bold transition cursor-pointer"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Admin Login</span>
              </button>
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
                  src={settings.branding.logoUrl || "/logo-icon.png"}
                  alt="App Logo"
                  className="w-full h-full object-contain rounded-xl"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/logo-icon.png";
                  }}
                />
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight font-heading">
                {settings.branding.appName}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {settings.branding.appSubtitle}
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
                      placeholder="••••••••••••"
                      autoFocus
                      className="w-full h-12 bg-slate-50 border border-slate-200 focus:border-black focus:bg-white focus:ring-2 focus:ring-black/10 rounded-xl pl-10 pr-11 text-sm sm:text-base font-mono text-slate-900 placeholder:text-slate-400 outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition cursor-pointer"
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

              {/* Admin Portal Prompt Access */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Laptop className="w-3.5 h-3.5 text-slate-400" />
                  <span>Managed by Muzamil</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAdminPrompt(true)}
                  className="font-bold text-slate-700 hover:text-black transition cursor-pointer flex items-center gap-1"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Admin Panel</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-white/10 bg-black px-6 py-4 text-center">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
            <span>{settings.branding.appName} • Private Internal Edition</span>
            <div className="flex items-center gap-1.5 font-semibold text-white">
              <span>{settings.branding.footerCredit}</span>
            </div>
          </div>
        </footer>

        {/* Admin Login Dialog Modal */}
        {showAdminPrompt && (
          <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-sm bg-zinc-950 text-white rounded-2xl border border-zinc-800 p-6 shadow-2xl relative space-y-4">
              <button
                type="button"
                onClick={() => {
                  setShowAdminPrompt(false);
                  setAdminError("");
                  setAdminPasswordInput("");
                }}
                className="absolute right-4 top-4 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-heading text-sm font-bold text-white">
                    Master Admin Access
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    Enter Muzamil&apos;s master admin password
                  </p>
                </div>
              </div>

              <form onSubmit={handleAdminPromptSubmit} className="space-y-3 pt-1">
                <div className="relative">
                  <input
                    type={showAdminPassword ? "text" : "password"}
                    value={adminPasswordInput}
                    onChange={(e) => {
                      setAdminPasswordInput(e.target.value);
                      setAdminError("");
                    }}
                    placeholder="Enter admin password..."
                    autoFocus
                    className="w-full h-11 bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 pr-10 text-sm font-mono text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  >
                    {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {adminError && (
                  <p className="text-xs text-rose-400 font-semibold">{adminError}</p>
                )}

                <button
                  type="submit"
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-md"
                >
                  Open Master Dashboard
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Master Admin Modal */}
        <MasterAdminModal
          isOpen={isAdminModalOpen}
          onClose={() => {
            setIsAdminModalOpen(false);
            checkSession();
          }}
        />
      </div>
    );
  }

  return (
    <>
      {children}
      <MasterAdminModal
        isOpen={isAdminModalOpen}
        onClose={() => {
          setIsAdminModalOpen(false);
          checkSession();
        }}
      />
    </>
  );
}

export function lockApp() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }
}
