"use client";

import React, { useState, useEffect } from "react";
import { Lock, Unlock, KeyRound, ShieldCheck, Eye, EyeOff, AlertCircle, ArrowRight } from "lucide-react";

interface AccessGateProps {
  children: React.ReactNode;
  onLockChange?: (unlocked: boolean) => void;
}

const STORAGE_KEY = "verdana_access_token";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function AccessGate({ children, onLockChange }: AccessGateProps) {
  const [isUnlocked, setIsUnlocked] = useState<boolean | null>(null);
  const [passcode, setPasscode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const EXPECTED_PASSCODE =
    process.env.NEXT_PUBLIC_APP_ACCESS_PASSCODE?.trim() || "MUZAMIL-2026";

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const age = Date.now() - (parsed.timestamp || 0);
        if (
          age < SESSION_DURATION_MS &&
          parsed.token?.toLowerCase() === EXPECTED_PASSCODE.toLowerCase()
        ) {
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
  }, [EXPECTED_PASSCODE, onLockChange]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const trimmed = passcode.trim();
    if (!trimmed) {
      setErrorMsg("Please enter your team passcode.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      if (trimmed.toLowerCase() === EXPECTED_PASSCODE.toLowerCase()) {
        try {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
              token: trimmed,
              timestamp: Date.now(),
            })
          );
        } catch {
          // LocalStorage fallback
        }
        setIsUnlocked(true);
        onLockChange?.(true);
      } else {
        setErrorMsg("Incorrect team passcode. Try MUZAMIL-2026 or contact admin.");
      }
      setIsSubmitting(false);
    }, 300);
  };

  const handleLock = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setIsUnlocked(false);
    setPasscode("");
    setErrorMsg("");
    onLockChange?.(false);
  };

  // Prevent flash of lock screen while reading localStorage
  if (isUnlocked === null) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#059669] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col justify-between selection:bg-[#059669]/20">
        {/* Top Clinical Reassurance Bar */}
        <div className="bg-[#0F172A] text-white px-4 py-2.5 text-xs sm:text-sm font-medium tracking-wide">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
              <span>Etsy Intelligence • Private Team Access Gate</span>
            </div>
            <span className="text-xs text-[#94A3B8]">Authorized Personnel Only</span>
          </div>
        </div>

        {/* Lock Screen Centered Card */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-md bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_8px_30px_rgba(15,23,42,0.08)] overflow-hidden">
            {/* Ambient banner texture */}
            <div className="bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] p-6 text-white text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-white/10 to-transparent pointer-events-none" />
              <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 p-2 mx-auto mb-3 shadow-md flex items-center justify-center">
                <img
                  src="/logo-icon.png"
                  alt="Etsy Intelligence Logo"
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight font-['Plus_Jakarta_Sans']">
                Etsy Intelligence
              </h2>
              <p className="text-xs sm:text-sm text-[#94A3B8] mt-1 font-['DM_Sans']">
                Etsy SEO &amp; Competitor Intelligence Studio
              </p>
            </div>

            {/* Passcode Form */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="text-center space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#059669]/10 text-[#059669] text-xs font-bold uppercase tracking-[0.5px]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Passcode Required</span>
                </div>
                <h3 className="text-lg font-bold text-[#0F172A] font-['Plus_Jakarta_Sans']">
                  Enter Team Access Key
                </h3>
                <p className="text-xs sm:text-sm text-[#64748B]">
                  Please enter the authorized team passcode to unlock all studio features.
                </p>
              </div>

              <form onSubmit={handleUnlock} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-semibold text-[#0F172A]">
                    Passcode
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={passcode}
                      onChange={(e) => {
                        setPasscode(e.target.value);
                        setErrorMsg("");
                      }}
                      placeholder="e.g. MUZAMIL-2026"
                      autoFocus
                      className="w-full h-12 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#0F172A] focus:bg-white focus:ring-2 focus:ring-[#0F172A]/10 rounded-xl pl-10 pr-11 text-sm sm:text-base font-mono text-[#0F172A] placeholder:text-[#94A3B8] outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0F172A] transition"
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
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#DC2626] text-xs font-semibold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 bg-[#0F172A] hover:bg-[#020617] disabled:opacity-50 text-white text-sm sm:text-base font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4 text-[#22C55E]" />
                  <span>{isSubmitting ? "Verifying..." : "Unlock Studio (30-Day Session)"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Helpful Hint */}
              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-center space-y-1">
                <span className="text-[11px] text-[#64748B] block">
                  Default Team Passcode:
                </span>
                <button
                  type="button"
                  onClick={() => setPasscode("MUZAMIL-2026")}
                  className="inline-block font-mono text-xs font-bold text-[#059669] hover:underline bg-[#059669]/10 px-2.5 py-1 rounded"
                >
                  MUZAMIL-2026 (Click to Fill)
                </button>
              </div>

              {/* Security info */}
              <div className="flex items-center justify-center gap-2 text-[11px] text-[#94A3B8] text-center">
                <span>30-day session saved locally in your browser</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-[#E2E8F0] bg-white px-6 py-4 text-center">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#64748B]">
            <span>Etsy Engine • Private Internal Edition</span>
            <div className="flex items-center gap-1.5 font-semibold text-[#0F172A]">
              <span>Crafted &amp; Built</span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#059669]/10 text-[#059669] font-bold">
                by Muzamil
              </span>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // Pass down handleLock function via context or cloneElement if needed
  return <>{children}</>;
}

export function lockApp() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }
}
