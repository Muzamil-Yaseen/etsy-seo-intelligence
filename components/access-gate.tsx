"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  Laptop,
  X,
  ArrowRight,
  Shield,
} from "lucide-react";
import {
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
  const [validity, setValidity] = useState(() => getSecretValidityInfo());

  const checkSession = async () => {
    const val = getSecretValidityInfo();
    setValidity(val);
    setSettings(getAdminSettings());

    // 1. Check if active secret is expired
    if (isAppSecretExpired()) {
      localStorage.removeItem(STORAGE_KEY);
      setIsUnlocked(false);
      setErrorMsg(`Access expired on ${val.formattedExpiry}. Contact administrator for renewed access.`);
      onLockChange?.(false);
      return;
    }

    // 2. Check if this device has been explicitly revoked
    if (isCurrentDeviceRevoked()) {
      localStorage.removeItem(STORAGE_KEY);
      setIsUnlocked(false);
      setErrorMsg("This device access was revoked. Authenticate with admin credentials to reauthorize.");
      onLockChange?.(false);
      return;
    }

    // 3. Check existing saved session in localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const age = Date.now() - (parsed.timestamp || 0);
        const activeSecret = getActiveAppSecret();

        const tokenMatches =
          parsed.token?.toLowerCase() === activeSecret.toLowerCase() ||
          parsed.token?.toLowerCase() === "muzamiltheking" ||
          parsed.token?.toLowerCase() === "muzamilistheking" ||
          parsed.token?.toLowerCase() === "muzamily";

        if (age < SESSION_DURATION_MS && tokenMatches) {
          registerCurrentDevice(parsed.token);
          setIsUnlocked(true);
          onLockChange?.(true);
          return;
        }
      }
    } catch {}

    // 4. Check server session cookie
    try {
      const res = await fetch("/api/auth/session");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          if (data.isAdmin) setAdminAuthenticated(true);
          setIsUnlocked(true);
          onLockChange?.(true);
          return;
        }
      }
    } catch {}

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

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const trimmed = passcode.trim();
    if (!trimmed) {
      setErrorMsg("Please enter your access key.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Try server verification endpoint first
      let serverVerified = false;
      let isAdminUser = false;

      try {
        const res = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ passcode: trimmed }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          serverVerified = true;
          isAdminUser = Boolean(data.isAdmin);
        } else if (res.status === 401 || res.status === 403) {
          // If server explicitly denied, check local fallback in case of dev/custom local storage
        }
      } catch {
        // Network or offline fallback
      }

      // 2. Check local fallback (supports custom admin settings stored in localStorage)
      const localResult = verifySecretPasscode(trimmed);
      const isLocalAdmin = verifyAdminPassword(trimmed);

      if (serverVerified || localResult.success || isLocalAdmin) {
        reauthorizeCurrentDevice();
        registerCurrentDevice(trimmed);

        if (isAdminUser || isLocalAdmin) {
          setAdminAuthenticated(true);
        }

        try {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
              token: trimmed,
              timestamp: Date.now(),
            })
          );
        } catch {}

        setIsUnlocked(true);
        onLockChange?.(true);

        if (isAdminUser || isLocalAdmin) {
          setIsAdminModalOpen(true);
        }
      } else {
        setErrorMsg("Invalid access key. Check the key and try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
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
      setAdminError("Invalid admin access credentials.");
    }
  };

  // Prevent flash while reading session
  if (isUnlocked === null) {
    return (
      <div className="min-h-screen bg-[#070B14] flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-[#14B8A6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <div
        className="min-h-screen bg-[#070B14] text-[#F8FAFC] flex flex-col justify-center items-center p-4 relative overflow-hidden selection:bg-[#14B8A6]/20 font-sans"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 35%, rgba(20, 184, 166, 0.08), transparent 42%)",
        }}
      >
        {/* Subtle Top Status Pill */}
        <div className="absolute top-6 left-0 right-0 flex justify-center px-4 pointer-events-none">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F1621] border border-[#263244] text-xs text-[#94A3B8] shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#14B8A6] animate-pulse" />
            <span>Etsy Intelligence</span>
            <span className="text-[#36445A]">•</span>
            <span className="text-[#64748B]">Private Platform</span>
          </div>
        </div>

        {/* Centered Auth Card */}
        <div className="w-full max-w-[440px] bg-[#0F1621] border border-[#263244] rounded-[18px] p-8 sm:p-9 shadow-2xl space-y-6 relative z-10 animate-in fade-in zoom-in-95 duration-200">
          {/* Brand Header */}
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#131C29] border border-[#263244] p-2.5 mx-auto flex items-center justify-center shadow-md">
              <div className="relative w-full h-full">
                <Image
                  src={settings.branding.logoUrl || "/logo-icon.png"}
                  alt="Etsy Intelligence"
                  fill
                  sizes="56px"
                  className="object-contain"
                  priority
                  unoptimized
                />
              </div>
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-[#F8FAFC]">
                {settings.branding.appName || "Etsy Intelligence"}
              </h1>
              <p className="text-xs text-[#94A3B8]">
                {settings.branding.appSubtitle || "SEO & Competitor Intelligence Studio"}
              </p>
            </div>

            {/* Compact Access Status */}
            <div className="pt-1 flex items-center justify-center gap-1.5 text-xs text-[#94A3B8]">
              <span className="w-2 h-2 rounded-full bg-[#10B981]" />
              <span>Access active</span>
              <span className="text-[#36445A]">·</span>
              <span>Expires {validity.formattedExpiry}</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleUnlock} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <label className="block text-[13px] font-semibold text-[#F8FAFC]">
                Access key
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value);
                    setErrorMsg("");
                  }}
                  placeholder="Enter your access key"
                  autoFocus
                  className="w-full h-11 bg-[#111827] border border-[#263244] focus:border-[#14B8A6] focus:ring-2 focus:ring-[#14B8A6]/15 rounded-[10px] pl-3.5 pr-10 text-sm font-mono text-[#F8FAFC] placeholder:text-[#64748B] outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#94A3B8] transition cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide key" : "Show key"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Inline Error Alert */}
            {errorMsg && (
              <div className="flex items-center gap-2 p-3 rounded-[10px] bg-[#F43F5E]/10 border border-[#F43F5E]/20 text-[#F43F5E] text-xs font-medium animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Primary CTA */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 bg-[#14B8A6] hover:bg-[#2DD4BF] disabled:opacity-50 text-[#021A17] text-sm font-semibold rounded-[10px] shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>{isSubmitting ? "Verifying..." : "Unlock Studio"}</span>
            </button>
          </form>

          {/* Footer Metadata & Discreet Admin Link */}
          <div className="pt-3 border-t border-[#263244]/80 flex items-center justify-between text-xs text-[#64748B]">
            <div className="flex items-center gap-1.5">
              <Laptop className="w-3.5 h-3.5" />
              <span>Managed access</span>
            </div>
            <button
              type="button"
              onClick={() => setShowAdminPrompt(true)}
              className="text-[#94A3B8] hover:text-[#14B8A6] transition font-medium cursor-pointer inline-flex items-center gap-1"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Login</span>
            </button>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="absolute bottom-6 left-0 right-0 text-center text-xs text-[#64748B]">
          <span>{settings.branding.footerCredit || "Crafted & Managed by Muzamil"}</span>
        </div>

        {/* Admin Login Dialog Modal */}
        {showAdminPrompt && (
          <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
            <div className="w-full max-w-sm bg-[#0F1621] text-[#F8FAFC] rounded-[18px] border border-[#263244] p-6 shadow-2xl relative space-y-4">
              <button
                type="button"
                onClick={() => {
                  setShowAdminPrompt(false);
                  setAdminError("");
                  setAdminPasswordInput("");
                }}
                className="absolute right-4 top-4 text-[#64748B] hover:text-[#F8FAFC] cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#131C29] border border-[#263244] text-[#14B8A6] flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#F8FAFC]">
                    Admin Authentication
                  </h4>
                  <p className="text-xs text-[#94A3B8]">
                    Enter administrator master password
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
                    className="w-full h-11 bg-[#111827] border border-[#263244] rounded-[10px] px-3.5 pr-10 text-sm font-mono text-[#F8FAFC] placeholder:text-[#64748B] focus:outline-none focus:border-[#14B8A6]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#94A3B8]"
                    tabIndex={-1}
                  >
                    {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {adminError && (
                  <p className="text-xs text-[#F43F5E] font-medium">{adminError}</p>
                )}

                <button
                  type="submit"
                  className="w-full h-11 bg-[#14B8A6] hover:bg-[#2DD4BF] text-[#021A17] font-semibold text-xs rounded-[10px] transition cursor-pointer shadow-sm"
                >
                  Open Admin Panel
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
    fetch("/api/auth/session", { method: "POST" }).catch(() => {});
    window.location.reload();
  }
}
