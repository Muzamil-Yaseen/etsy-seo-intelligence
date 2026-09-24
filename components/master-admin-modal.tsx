"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  X,
  Shield,
  Laptop,
  Smartphone,
  Tablet,
  Ban,
  Trash2,
  Key,
  Puzzle,
  Cpu,
  Palette,
  Check,
  RotateCcw,
  LogOut,
  AlertTriangle,
  LayoutDashboard,
  Calendar,
  Lock,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  AdminSettings,
  getAdminSettings,
  saveAdminSettings,
  resetAdminSettings,
  remoteDeleteExtensionBridge,
  remoteDeleteEtsyApiKey,
  remoteDeleteGroqApiKey,
  remoteWipeAllSessions,
  reauthorizeCurrentDevice,
} from "@/lib/admin-settings";
import {
  getRegisteredDevices,
  getCurrentDeviceId,
  revokeDevice,
  deleteDevice,
  DeviceSession,
  revokeAllOtherDevices,
} from "@/lib/device-manager";
import { lockApp } from "@/components/access-gate";
import { ThemeToggle } from "@/components/theme-toggle";

interface MasterAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AdminTab = "overview" | "sessions" | "apikeys" | "ai" | "branding" | "security";

export function MasterAdminModal({ isOpen, onClose }: MasterAdminModalProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [settings, setSettings] = useState<AdminSettings>(getAdminSettings());
  const [devices, setDevices] = useState<DeviceSession[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Form states
  const [appSecretInput, setAppSecretInput] = useState("");
  const [expiryInput, setExpiryInput] = useState("2026-12-01");
  const [negativeKwInput, setNegativeKwInput] = useState("");

  // Dialog states
  const [showReplaceSecretDialog, setShowReplaceSecretDialog] = useState(false);
  const [newSecretValue, setNewSecretValue] = useState("");
  const [showSecretInDialog, setShowSecretInDialog] = useState(false);
  const [showConfirmLockDialog, setShowConfirmLockDialog] = useState(false);
  const [showConfirmWipeDialog, setShowConfirmWipeDialog] = useState(false);

  const refreshState = () => {
    const s = getAdminSettings();
    setSettings(s);
    setAppSecretInput(s.appSecret);
    const datePart = s.appSecretExpiry.split("T")[0] || "2026-12-01";
    setExpiryInput(datePart);
    setDevices(getRegisteredDevices());
  };

  useEffect(() => {
    if (isOpen) {
      refreshState();
    }
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        if (showReplaceSecretDialog) setShowReplaceSecretDialog(false);
        else if (showConfirmLockDialog) setShowConfirmLockDialog(false);
        else if (showConfirmWipeDialog) setShowConfirmWipeDialog(false);
        else onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, showReplaceSecretDialog, showConfirmLockDialog, showConfirmWipeDialog, onClose]);

  const notify = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleSaveAll = (updated: Partial<AdminSettings>) => {
    const s = saveAdminSettings(updated);
    setSettings(s);
    notify("Settings saved successfully.");
  };

  // Remote Actions
  const handleRemoteDeleteExtension = () => {
    remoteDeleteExtensionBridge();
    refreshState();
    notify("Chrome Extension bridge token revoked.");
  };

  const handleRemoteDeleteEtsyKey = () => {
    remoteDeleteEtsyApiKey();
    refreshState();
    notify("Etsy API key cleared.");
  };

  const handleRemoteDeleteGroqKey = () => {
    remoteDeleteGroqApiKey();
    refreshState();
    notify("Custom Groq API key cleared.");
  };

  const handleExecuteWipeSessions = () => {
    remoteWipeAllSessions();
    setDevices([]);
    setShowConfirmWipeDialog(false);
    notify("All active sessions wiped.");
    setTimeout(() => lockApp(), 600);
  };

  const handleRevokeDevice = (deviceId: string) => {
    const updated = revokeDevice(deviceId);
    setDevices(updated);
    notify("Session revoked.");
  };

  const handleDeleteDevice = (deviceId: string) => {
    const updated = deleteDevice(deviceId);
    setDevices(updated);
    notify("Session record removed.");
  };

  const handleRevokeAllOther = () => {
    const updated = revokeAllOtherDevices();
    setDevices(updated);
    notify("All other sessions revoked.");
  };

  const handleAddNegativeKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = negativeKwInput.trim().toLowerCase();
    if (!clean) return;
    if (settings.aiRules.negativeKeywords.includes(clean)) return;
    const updatedKw = [...settings.aiRules.negativeKeywords, clean];
    handleSaveAll({
      aiRules: {
        ...settings.aiRules,
        negativeKeywords: updatedKw,
      },
    });
    setNegativeKwInput("");
  };

  const handleRemoveNegativeKeyword = (kwToRemove: string) => {
    const updatedKw = settings.aiRules.negativeKeywords.filter((k) => k !== kwToRemove);
    handleSaveAll({
      aiRules: {
        ...settings.aiRules,
        negativeKeywords: updatedKw,
      },
    });
  };

  const handleSaveSecretAndExpiry = (e: React.FormEvent) => {
    e.preventDefault();
    const newSecret = appSecretInput.trim() || settings.appSecret;
    const expiryTimestamp = `${expiryInput}T23:59:59.999Z`;

    handleSaveAll({
      appSecret: newSecret,
      appSecretExpiry: expiryTimestamp,
    });
    reauthorizeCurrentDevice();
    notify("Access configuration saved.");
  };

  const handleApplyNewSecret = () => {
    const trimmed = newSecretValue.trim();
    if (!trimmed) return;
    setAppSecretInput(trimmed);
    handleSaveAll({
      appSecret: trimmed,
    });
    reauthorizeCurrentDevice();
    setShowReplaceSecretDialog(false);
    setNewSecretValue("");
    notify("Access secret updated.");
  };

  if (!isOpen) return null;

  const currentId = getCurrentDeviceId();
  const humanExpiry = new Date(settings.appSecretExpiry).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

  const navItems: { id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "sessions", label: "Sessions", icon: Laptop },
    { id: "apikeys", label: "API & Extension", icon: Key },
    { id: "ai", label: "AI Guardrails", icon: Cpu },
    { id: "branding", label: "Branding", icon: Palette },
    { id: "security", label: "Access & Security", icon: Shield },
  ];

  return (
    <div className="fixed inset-0 z-[99999] bg-[#F8FAFC] dark:bg-[#070B14] text-slate-900 dark:text-[#F8FAFC] flex flex-col h-screen w-screen overflow-hidden font-sans select-none animate-in fade-in duration-150 transition-colors duration-200">
      <div className="relative w-full h-full flex flex-col overflow-hidden">
        {/* Full-Width Header Bar */}
        <div className="h-16 px-4 sm:px-6 border-b border-slate-200 dark:border-[#263244] flex items-center justify-between bg-white dark:bg-[#0F1621] shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/20 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
              <Image
                src={settings.branding.logoUrl || "/logo-icon.png"}
                alt="Etsy Intelligence"
                width={30}
                height={30}
                className="object-contain"
                priority
                unoptimized
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#F8FAFC] tracking-tight">
                  {settings.branding.appName || "Etsy Intelligence"} Master Control
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 uppercase tracking-wider">
                  Owner
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] hidden sm:block">
                Full-spectrum application governance, real-time sessions &amp; platform settings
              </p>
            </div>
          </div>

          {/* Center Prominent Badge */}
          <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
            <span>Admin Logged In • Muzamil (Owner) • Full Control Active</span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Dark / Light Mode Switch */}
            <ThemeToggle />

            <button
              type="button"
              onClick={onClose}
              className="h-9 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#131C29] dark:hover:bg-[#172231] border border-slate-200 dark:border-[#263244] text-xs font-semibold text-slate-800 dark:text-[#F8FAFC] flex items-center gap-1.5 transition cursor-pointer"
              title="Return to user workspace"
            >
              <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Switch to Studio View</span>
              <span className="sm:hidden">Studio View</span>
            </button>

            <button
              type="button"
              onClick={() => lockApp()}
              className="h-9 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Lock application session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lock</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:text-[#64748B] dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#131C29] border border-transparent hover:border-slate-200 dark:hover:border-[#263244] transition cursor-pointer"
              aria-label="Close Admin"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Notification Bar */}
        {toastMsg && (
          <div className="mx-6 mt-3 p-2.5 bg-emerald-50 dark:bg-[#10B981]/10 border border-emerald-200 dark:border-[#10B981]/30 rounded-[10px] text-xs text-emerald-800 dark:text-[#10B981] flex items-center gap-2 animate-in fade-in shrink-0">
            <Check className="w-4 h-4 shrink-0 text-emerald-600 dark:text-[#10B981]" />
            <span className="font-medium">{toastMsg}</span>
          </div>
        )}

        {/* Two-Column Layout: Left Sidebar + Right Content */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Left Settings Navigation Sidebar (230px) */}
          <aside className="w-[230px] border-r border-slate-200 dark:border-[#263244] bg-white dark:bg-[#0F1621] p-3 flex flex-col justify-between shrink-0 overflow-y-auto">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full h-11 px-3.5 rounded-[10px] text-[13px] font-medium flex items-center gap-3 transition cursor-pointer text-left relative ${
                      isActive
                        ? "bg-emerald-50 dark:bg-[#14B8A6]/10 text-emerald-900 dark:text-[#F8FAFC] font-semibold border-l-2 border-emerald-600 dark:border-[#14B8A6]"
                        : "text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC] hover:bg-slate-50 dark:hover:bg-white/[0.04]"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-emerald-600 dark:text-[#2DD4BF]" : "text-slate-400 dark:text-[#64748B]"}`} />
                    <span>{item.label}</span>
                    {item.id === "sessions" && (
                      <span className="ml-auto text-[11px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-[#131C29] text-slate-600 dark:text-[#94A3B8]">
                        {devices.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="pt-3 border-t border-slate-200 dark:border-[#263244] text-[11px] text-slate-500 dark:text-[#64748B] flex items-center justify-between px-1">
              <span>Platform v1.2</span>
              <span className="text-emerald-600 dark:text-[#10B981] flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-[#10B981]" />
                Online
              </span>
            </div>
          </aside>

          {/* Right Content Area */}
          <main className="flex-1 p-6 overflow-y-auto space-y-6">
            {/* ========================================================================= */}
            {/* TAB 1: OVERVIEW                                                           */}
            {/* ========================================================================= */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-[#F8FAFC]">System Overview</h3>
                  <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
                    Real-time status of application security, AI engines, and external integrations.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-white dark:bg-[#0F1621] border border-slate-200 dark:border-[#263244] rounded-[14px] shadow-xs space-y-1">
                    <span className="text-xs text-slate-500 dark:text-[#94A3B8]">Application Access</span>
                    <div className="text-lg font-bold text-slate-900 dark:text-[#F8FAFC] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-[#10B981]" />
                      <span>Active</span>
                    </div>
                    <span className="text-[11px] text-slate-400 dark:text-[#64748B] block">
                      Expires {humanExpiry}
                    </span>
                  </div>

                  <div className="p-4 bg-white dark:bg-[#0F1621] border border-slate-200 dark:border-[#263244] rounded-[14px] shadow-xs space-y-1">
                    <span className="text-xs text-slate-500 dark:text-[#94A3B8]">Authorized Sessions</span>
                    <div className="text-lg font-bold text-slate-900 dark:text-[#F8FAFC]">
                      {devices.length} Device{devices.length === 1 ? "" : "s"}
                    </div>
                    <span className="text-[11px] text-slate-400 dark:text-[#64748B] block">
                      {devices.filter((d) => d.status === "active").length} Active now
                    </span>
                  </div>

                  <div className="p-4 bg-white dark:bg-[#0F1621] border border-slate-200 dark:border-[#263244] rounded-[14px] shadow-xs space-y-1">
                    <span className="text-xs text-slate-500 dark:text-[#94A3B8]">AI Intelligence Engine</span>
                    <div className="text-lg font-bold text-slate-900 dark:text-[#F8FAFC] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-teal-500 dark:bg-[#14B8A6]" />
                      <span>Groq Llama-3</span>
                    </div>
                    <span className="text-[11px] text-slate-400 dark:text-[#64748B] block truncate">
                      {settings.aiRules.model}
                    </span>
                  </div>

                  <div className="p-4 bg-white dark:bg-[#0F1621] border border-slate-200 dark:border-[#263244] rounded-[14px] shadow-xs space-y-1">
                    <span className="text-xs text-slate-500 dark:text-[#94A3B8]">Chrome Extension</span>
                    <div className="text-lg font-bold text-slate-900 dark:text-[#F8FAFC] flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${settings.extensionEnabled ? "bg-emerald-500 dark:bg-[#10B981]" : "bg-rose-500 dark:bg-[#F43F5E]"}`} />
                      <span>{settings.extensionEnabled ? "Connected" : "Disabled"}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 dark:text-[#64748B] block">
                      Bridge ready
                    </span>
                  </div>
                </div>

                {/* Quick Shortcuts */}
                <div className="p-5 bg-white dark:bg-[#0F1621] border border-slate-200 dark:border-[#263244] rounded-[14px] shadow-xs space-y-3">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-[#F8FAFC]">Quick Governance Actions</h4>
                  <div className="flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      onClick={() => setActiveTab("security")}
                      className="px-3.5 py-2 rounded-[10px] bg-slate-50 hover:bg-slate-100 dark:bg-[#172231] dark:hover:bg-[#1E293B] border border-slate-200 dark:border-[#263244] text-xs font-medium text-slate-700 dark:text-[#E2E8F0] transition cursor-pointer"
                    >
                      Update Access Expiration
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("sessions")}
                      className="px-3.5 py-2 rounded-[10px] bg-slate-50 hover:bg-slate-100 dark:bg-[#172231] dark:hover:bg-[#1E293B] border border-slate-200 dark:border-[#263244] text-xs font-medium text-slate-700 dark:text-[#E2E8F0] transition cursor-pointer"
                    >
                      Manage Active Sessions
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("ai")}
                      className="px-3.5 py-2 rounded-[10px] bg-slate-50 hover:bg-slate-100 dark:bg-[#172231] dark:hover:bg-[#1E293B] border border-slate-200 dark:border-[#263244] text-xs font-medium text-slate-700 dark:text-[#E2E8F0] transition cursor-pointer"
                    >
                      Configure AI Model &amp; Guardrails
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("branding")}
                      className="px-3.5 py-2 rounded-[10px] bg-slate-50 hover:bg-slate-100 dark:bg-[#172231] dark:hover:bg-[#1E293B] border border-slate-200 dark:border-[#263244] text-xs font-medium text-slate-700 dark:text-[#E2E8F0] transition cursor-pointer"
                    >
                      Update App Title &amp; Branding
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: SESSIONS & DEVICES                                                 */}
            {/* ========================================================================= */}
            {activeTab === "sessions" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-[#F8FAFC]">Active Sessions</h3>
                    <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
                      Authorized devices and browsers permitted to use Etsy Intelligence.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRevokeAllOther}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-[#172231] dark:hover:bg-[#1E293B] dark:text-[#E2E8F0] border border-slate-200 dark:border-[#263244] rounded-[10px] text-xs font-medium transition cursor-pointer"
                    >
                      Revoke All Other Sessions
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowConfirmWipeDialog(true)}
                      className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-[#F43F5E]/10 dark:hover:bg-[#F43F5E]/20 dark:text-[#F43F5E] border border-rose-200 dark:border-[#F43F5E]/30 rounded-[10px] text-xs font-medium transition cursor-pointer"
                    >
                      Remote Wipe All
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {devices.map((d) => {
                    const isCur = d.id === currentId;
                    const isRev = d.status === "revoked";
                    const Icon = d.type === "mobile" ? Smartphone : d.type === "tablet" ? Tablet : Laptop;

                    return (
                      <div
                        key={d.id}
                        className={`p-4 rounded-[14px] border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                          isRev
                            ? "bg-slate-50/50 dark:bg-[#0F1621]/40 border-slate-200/50 dark:border-[#263244]/40 opacity-50"
                            : isCur
                            ? "bg-white dark:bg-[#0F1621] border-emerald-500/40 dark:border-[#14B8A6]/40 shadow-xs"
                            : "bg-white dark:bg-[#0F1621] border-slate-200 dark:border-[#263244] shadow-xs"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 ${
                              isRev
                                ? "bg-slate-100 dark:bg-[#111827] text-slate-400 dark:text-[#64748B]"
                                : isCur
                                ? "bg-emerald-50 dark:bg-[#14B8A6]/10 text-emerald-600 dark:text-[#2DD4BF] border border-emerald-200 dark:border-[#14B8A6]/20"
                                : "bg-slate-100 dark:bg-[#131C29] text-slate-600 dark:text-[#94A3B8]"
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-slate-900 dark:text-[#F8FAFC]">{d.name}</span>
                              {isCur && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-[#14B8A6]/10 text-emerald-700 dark:text-[#2DD4BF] border border-emerald-200 dark:border-[#14B8A6]/20">
                                  This Browser
                                </span>
                              )}
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  isRev
                                    ? "bg-rose-50 dark:bg-[#F43F5E]/10 text-rose-700 dark:text-[#F43F5E] border border-rose-200 dark:border-[#F43F5E]/20"
                                    : "bg-emerald-50 dark:bg-[#10B981]/10 text-emerald-700 dark:text-[#10B981] border border-emerald-200 dark:border-[#10B981]/20"
                                }`}
                              >
                                {isRev ? "Revoked" : "Active"}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 dark:text-[#64748B] flex items-center gap-2 flex-wrap">
                              <span className="font-mono">ID: {d.id}</span>
                              <span>·</span>
                              <span>Authorized {new Date(d.firstAuthorized).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {!isRev ? (
                            <button
                              type="button"
                              onClick={() => handleRevokeDevice(d.id)}
                              className="px-2.5 py-1.5 rounded-[8px] bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-[#F43F5E]/10 dark:hover:bg-[#F43F5E]/20 dark:text-[#F43F5E] border border-rose-200 dark:border-[#F43F5E]/30 text-xs font-medium inline-flex items-center gap-1 transition cursor-pointer"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>Revoke</span>
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 dark:text-[#64748B] italic">Revoked</span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteDevice(d.id)}
                            className="w-8 h-8 rounded-[8px] text-slate-400 hover:text-slate-700 dark:text-[#64748B] dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#131C29] flex items-center justify-center transition cursor-pointer"
                            title="Remove session record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: API & EXTENSION                                                    */}
            {/* ========================================================================= */}
            {activeTab === "apikeys" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-[#F8FAFC]">API &amp; Extension Configuration</h3>
                  <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
                    Configure and manage external marketplace and AI model connections.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Groq Cloud */}
                  <div className="p-5 bg-white dark:bg-[#0F1621] border border-slate-200 dark:border-[#263244] rounded-[14px] shadow-xs space-y-3 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-[10px] bg-emerald-50 dark:bg-[#14B8A6]/10 text-emerald-600 dark:text-[#14B8A6] flex items-center justify-center">
                          <Cpu className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-[#F8FAFC]">Groq Llama-3 AI Engine</h4>
                          <p className="text-xs text-slate-500 dark:text-[#94A3B8]">Model: {settings.aiRules.model}</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-[#10B981]/10 text-emerald-700 dark:text-[#10B981] border border-emerald-200 dark:border-[#10B981]/20">
                        Connected
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-[#64748B] leading-relaxed">
                      Powers title optimization, deterministic 13-tag extraction, and listing gap diagnostics.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleRemoteDeleteGroqKey}
                        className="px-3 py-1.5 rounded-[10px] bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-[#F43F5E]/10 dark:hover:bg-[#F43F5E]/20 dark:text-[#F43F5E] text-xs font-medium border border-rose-200 dark:border-[#F43F5E]/30 cursor-pointer"
                      >
                        Clear Custom Groq Key
                      </button>
                    </div>
                  </div>

                  {/* Chrome Extension */}
                  <div className="p-5 bg-white dark:bg-[#0F1621] border border-slate-200 dark:border-[#263244] rounded-[14px] shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Puzzle className="w-4 h-4 text-emerald-600 dark:text-[#14B8A6]" />
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-[#F8FAFC]">Chrome Extension Bridge</h4>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          settings.extensionEnabled
                            ? "bg-emerald-50 dark:bg-[#10B981]/10 text-emerald-700 dark:text-[#10B981] border border-emerald-200 dark:border-[#10B981]/20"
                            : "bg-rose-50 dark:bg-[#F43F5E]/10 text-rose-700 dark:text-[#F43F5E] border border-rose-200 dark:border-[#F43F5E]/20"
                        }`}
                      >
                        {settings.extensionEnabled ? "Active" : "Disabled"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-[#64748B]">
                      Bridge Token: <code className="font-mono bg-slate-100 dark:bg-[#111827] text-slate-800 dark:text-[#E2E8F0] px-1.5 py-0.5 rounded border border-slate-200 dark:border-[#263244]">{settings.extensionBridgeToken}</code>
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          handleSaveAll({
                            extensionEnabled: !settings.extensionEnabled,
                          })
                        }
                        className="px-3 py-1.5 rounded-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-[#172231] dark:hover:bg-[#1E293B] dark:text-[#E2E8F0] text-xs font-medium border border-slate-200 dark:border-[#263244] cursor-pointer"
                      >
                        {settings.extensionEnabled ? "Disable Bridge" : "Enable Bridge"}
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoteDeleteExtension}
                        className="px-3 py-1.5 rounded-[10px] bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-[#F43F5E]/10 dark:hover:bg-[#F43F5E]/20 dark:text-[#F43F5E] text-xs font-medium border border-rose-200 dark:border-[#F43F5E]/30 cursor-pointer"
                      >
                        Revoke Bridge
                      </button>
                    </div>
                  </div>

                  {/* Etsy Developer API */}
                  <div className="p-5 bg-white dark:bg-[#0F1621] border border-slate-200 dark:border-[#263244] rounded-[14px] shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-emerald-600 dark:text-[#14B8A6]" />
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-[#F8FAFC]">Etsy Open API v3</h4>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-[#94A3B8]">Configured</span>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-[#64748B]">
                      Official API integration for high-throughput server-side metadata fetching.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleRemoteDeleteEtsyKey}
                        className="px-3 py-1.5 rounded-[10px] bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-[#F43F5E]/10 dark:hover:bg-[#F43F5E]/20 dark:text-[#F43F5E] text-xs font-medium border border-rose-200 dark:border-[#F43F5E]/30 cursor-pointer"
                      >
                        Clear Etsy Key
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 4: AI GUARDRAILS                                                      */}
            {/* ========================================================================= */}
            {activeTab === "ai" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-[#F8FAFC]">AI Rules &amp; Guardrails</h3>
                  <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
                    Control model reasoning parameters, system prompt guidance, and keyword negative lists.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-800 dark:text-[#F8FAFC] block">
                    System Prompt Guidelines
                  </label>
                  <textarea
                    value={settings.aiRules.systemPromptGuidelines}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        aiRules: {
                          ...settings.aiRules,
                          systemPromptGuidelines: e.target.value,
                        },
                      })
                    }
                    rows={3}
                    className="w-full bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#263244] rounded-[10px] p-3 text-xs text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:border-emerald-500 font-mono leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-800 dark:text-[#F8FAFC] block">Reasoning Model</label>
                    <select
                      value={settings.aiRules.model}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          aiRules: {
                            ...settings.aiRules,
                            model: e.target.value,
                          },
                        })
                      }
                      className="w-full h-10 bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#263244] rounded-[10px] px-3 text-xs text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:border-emerald-500"
                    >
                      <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile (Recommended)</option>
                      <option value="llama-3.1-8b-instant">llama-3.1-8b-instant (Fast)</option>
                      <option value="mixtral-8x7b-32768">mixtral-8x7b-32768</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-800 dark:text-[#F8FAFC]">Temperature</label>
                      <span className="text-xs font-mono text-emerald-600 dark:text-[#14B8A6] font-semibold">
                        {settings.aiRules.temperature}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={settings.aiRules.temperature}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          aiRules: {
                            ...settings.aiRules,
                            temperature: parseFloat(e.target.value),
                          },
                        })
                      }
                      className="w-full accent-emerald-600 dark:accent-[#14B8A6]"
                    />
                    <div className="flex justify-between text-[11px] text-slate-400 dark:text-[#64748B]">
                      <span>Deterministic (0.0)</span>
                      <span>Creative (1.0)</span>
                    </div>
                  </div>
                </div>

                {/* Negative Keywords List */}
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-[#263244]">
                  <label className="text-xs font-semibold text-slate-800 dark:text-[#F8FAFC] block">
                    Strict Negative Keywords Filter
                  </label>
                  <form onSubmit={handleAddNegativeKeyword} className="flex gap-2">
                    <input
                      type="text"
                      value={negativeKwInput}
                      onChange={(e) => setNegativeKwInput(e.target.value)}
                      placeholder="Add excluded term (e.g. cheap, fake)..."
                      className="flex-1 h-9 bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#263244] rounded-[10px] px-3 text-xs text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="submit"
                      className="h-9 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-[#172231] dark:hover:bg-[#1E293B] dark:text-[#E2E8F0] rounded-[10px] text-xs font-medium cursor-pointer border border-slate-200 dark:border-[#263244]"
                    >
                      Add Filter
                    </button>
                  </form>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {settings.aiRules.negativeKeywords.map((kw, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-[#111827] dark:text-[#94A3B8] text-xs border border-slate-200 dark:border-[#263244] flex items-center gap-1.5"
                      >
                        <span>{kw}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveNegativeKeyword(kw)}
                          className="text-slate-400 hover:text-rose-600 dark:text-[#64748B] dark:hover:text-[#F43F5E] cursor-pointer ml-1"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleSaveAll({ aiRules: settings.aiRules })}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-[10px] transition cursor-pointer shadow-xs"
                  >
                    Save AI Rules
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 5: BRANDING                                                           */}
            {/* ========================================================================= */}
            {activeTab === "branding" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-[#F8FAFC]">Brand Identity</h3>
                  <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
                    Customize application name, subtitle, and announcement banner.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-800 dark:text-[#F8FAFC] block">App Name</label>
                    <input
                      type="text"
                      value={settings.branding.appName}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          branding: { ...settings.branding, appName: e.target.value },
                        })
                      }
                      className="w-full h-10 bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#263244] rounded-[10px] px-3 text-xs text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-800 dark:text-[#F8FAFC] block">Header Subtitle</label>
                    <input
                      type="text"
                      value={settings.branding.headerBadgeText}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          branding: { ...settings.branding, headerBadgeText: e.target.value },
                        })
                      }
                      className="w-full h-10 bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#263244] rounded-[10px] px-3 text-xs text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-800 dark:text-[#F8FAFC] block">Logo Image URL</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={settings.branding.logoUrl}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            branding: { ...settings.branding, logoUrl: e.target.value },
                          })
                        }
                        className="flex-1 h-10 bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#263244] rounded-[10px] px-3 text-xs text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:border-emerald-500"
                      />
                      <div className="w-10 h-10 rounded-[10px] bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-[#263244] flex items-center justify-center shrink-0 p-1">
                        <img
                          src={settings.branding.logoUrl || "/logo-icon.png"}
                          alt="Preview"
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/logo-icon.png";
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-800 dark:text-[#F8FAFC] block">Footer Signature</label>
                    <input
                      type="text"
                      value={settings.branding.footerCredit}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          branding: { ...settings.branding, footerCredit: e.target.value },
                        })
                      }
                      className="w-full h-10 bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#263244] rounded-[10px] px-3 text-xs text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Announcement Banner */}
                <div className="p-4 bg-white dark:bg-[#0F1621] border border-slate-200 dark:border-[#263244] rounded-[14px] shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-900 dark:text-[#F8FAFC] block">Top Announcement Banner</span>
                      <span className="text-[11px] text-slate-500 dark:text-[#64748B]">Broadcast notices to all users</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.branding.announcementBanner.enabled}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            branding: {
                              ...settings.branding,
                              announcementBanner: {
                                ...settings.branding.announcementBanner,
                                enabled: e.target.checked,
                              },
                            },
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 dark:bg-[#263244] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600 dark:peer-checked:bg-[#14B8A6]"></div>
                    </label>
                  </div>

                  {settings.branding.announcementBanner.enabled && (
                    <input
                      type="text"
                      value={settings.branding.announcementBanner.text}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          branding: {
                            ...settings.branding,
                            announcementBanner: {
                              ...settings.branding.announcementBanner,
                              text: e.target.value,
                            },
                          },
                        })
                      }
                      placeholder="Enter announcement text..."
                      className="w-full h-10 bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#263244] rounded-[10px] px-3 text-xs text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:border-emerald-500"
                    />
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const r = resetAdminSettings();
                      setSettings(r);
                      notify("Reset to defaults.");
                    }}
                    className="px-3 py-1.5 rounded-[10px] text-xs text-slate-500 dark:text-[#64748B] hover:text-slate-800 dark:hover:text-[#94A3B8] flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Defaults</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveAll({ branding: settings.branding })}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-[10px] transition cursor-pointer shadow-xs"
                  >
                    Save Branding
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 6: ACCESS & SECURITY (Secret Key & Expiry Date)                       */}
            {/* ========================================================================= */}
            {activeTab === "security" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-[#F8FAFC]">Access &amp; Security</h3>
                  <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
                    Manage access credentials, expiration dates, and emergency authentication locks.
                  </p>
                </div>

                {/* Unified Master Access Key & Expiration Card */}
                <form onSubmit={handleSaveSecretAndExpiry} className="p-6 bg-white dark:bg-[#0F1621] border border-slate-200 dark:border-[#263244] rounded-[16px] shadow-xs space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#263244] pb-4">
                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-[#F8FAFC] flex items-center gap-2">
                        <Key className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Active Client Access Key &amp; Validity</span>
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-0.5">
                        This is the exact passkey regular users need to enter to unlock the platform.
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                      <span>Live &amp; Synchronized</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Access Secret Input */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-800 dark:text-[#F8FAFC]">
                          Application Secret Key
                        </label>
                        <span className="text-[11px] text-slate-400 dark:text-[#64748B]">Case-insensitive</span>
                      </div>
                      <div className="relative">
                        <input
                          type={showSecretInDialog ? "text" : "password"}
                          value={appSecretInput}
                          onChange={(e) => setAppSecretInput(e.target.value)}
                          placeholder="e.g. MuzamilTheKing"
                          className="w-full h-11 bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#263244] focus:border-emerald-500 rounded-[10px] pl-3.5 pr-10 text-sm font-mono text-slate-900 dark:text-[#F8FAFC] placeholder:text-slate-400 dark:placeholder:text-[#64748B] outline-none transition"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowSecretInDialog(!showSecretInDialog)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-[#64748B] dark:hover:text-[#94A3B8] cursor-pointer"
                          title={showSecretInDialog ? "Hide secret" : "Show secret"}
                        >
                          {showSecretInDialog ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Quick Presets */}
                      <div className="flex items-center gap-2 pt-1 flex-wrap">
                        <span className="text-[11px] text-slate-500 dark:text-[#64748B]">Quick presets:</span>
                        <button
                          type="button"
                          onClick={() => setAppSecretInput("MuzamilTheKing")}
                          className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-emerald-700 dark:bg-[#172231] dark:hover:bg-[#1E293B] dark:text-[#94A3B8] dark:hover:text-emerald-400 transition cursor-pointer border border-slate-200 dark:border-transparent"
                        >
                          MuzamilTheKing
                        </button>
                        <button
                          type="button"
                          onClick={() => setAppSecretInput("MuzamilIsTheKing")}
                          className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-emerald-700 dark:bg-[#172231] dark:hover:bg-[#1E293B] dark:text-[#94A3B8] dark:hover:text-emerald-400 transition cursor-pointer border border-slate-200 dark:border-transparent"
                        >
                          MuzamilIsTheKing
                        </button>
                      </div>
                    </div>

                    {/* Expiration Date Input */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-800 dark:text-[#F8FAFC]">
                          Access Expiration Date
                        </label>
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">{humanExpiry}</span>
                      </div>
                      <input
                        type="date"
                        value={expiryInput}
                        onChange={(e) => setExpiryInput(e.target.value)}
                        className="w-full h-11 bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#263244] focus:border-emerald-500 rounded-[10px] px-3.5 text-sm font-mono text-slate-900 dark:text-[#F8FAFC] outline-none transition cursor-pointer"
                        required
                      />
                      <p className="text-[11px] text-slate-400 dark:text-[#64748B] pt-1">
                        After this date, access requires key renewal from the administrator.
                      </p>
                    </div>
                  </div>

                  {/* Clarification Callout for Muzamil */}
                  <div className="p-3.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2.5">
                    <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">Two-Tier Access Security:</span>
                      <p className="text-[11px] text-slate-600 dark:text-[#94A3B8] leading-relaxed">
                        When regular users log in using this Access Key, they are granted full access to the SEO Studio, but <strong>the Admin Panel button is hidden from them</strong>. Only you, logging in with your Master Admin Password (<code className="text-emerald-800 dark:text-emerald-300 font-mono bg-emerald-100/60 dark:bg-emerald-950/60 px-1 py-0.5 rounded">muzamily</code>), have access to this full-screen Master Control Center.
                      </p>
                    </div>
                  </div>

                  {/* Save CTA */}
                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-[#64748B]">
                      Server synchronization: <strong className="text-emerald-600 dark:text-emerald-400">Immediate</strong>
                    </span>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Save &amp; Deploy Access Key Immediately</span>
                    </button>
                  </div>
                </form>

                {/* Emergency Lock Danger Panel */}
                <div className="p-5 bg-rose-50/60 dark:bg-[#F43F5E]/5 border border-rose-200 dark:border-[#F43F5E]/20 rounded-[14px] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-rose-600 dark:text-[#F43F5E] flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Lock Etsy Intelligence</span>
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-[#94A3B8] max-w-md">
                      Immediately invalidates active user sessions and requires authentication again.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowConfirmLockDialog(true)}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-[10px] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition self-start sm:self-auto"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Lock Application</span>
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>

        {/* Footer Bar */}
        <div className="h-12 px-6 border-t border-slate-200 dark:border-[#263244] bg-white dark:bg-[#0F1621] flex items-center justify-between text-xs text-slate-500 dark:text-[#64748B] shrink-0">
          <span>Session active · Administrator controls</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-[#172231] dark:hover:bg-[#1E293B] border border-slate-200 dark:border-[#263244] dark:text-[#F8FAFC] rounded-[8px] text-xs font-medium transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Replace Secret Dialog */}
      {showReplaceSecretDialog && (
        <div className="fixed inset-0 z-[100001] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-[#0F1621] border border-slate-200 dark:border-[#263244] rounded-[16px] p-6 shadow-2xl space-y-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">Set New Access Secret</h4>
            <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
              Clients will need this new phrase to authenticate into the studio.
            </p>

            <div className="relative">
              <input
                type={showSecretInDialog ? "text" : "password"}
                value={newSecretValue}
                onChange={(e) => setNewSecretValue(e.target.value)}
                placeholder="Enter new secret key..."
                autoFocus
                className="w-full h-11 bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#263244] rounded-[10px] px-3.5 pr-10 text-xs font-mono text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => setShowSecretInDialog(!showSecretInDialog)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-[#64748B] dark:hover:text-[#94A3B8]"
                tabIndex={-1}
              >
                {showSecretInDialog ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowReplaceSecretDialog(false);
                  setNewSecretValue("");
                }}
                className="px-3.5 py-2 text-xs text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyNewSecret}
                disabled={!newSecretValue.trim()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-[10px] cursor-pointer shadow-xs"
              >
                Save New Secret
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Lock Dialog */}
      {showConfirmLockDialog && (
        <div className="fixed inset-0 z-[100001] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-[#0F1621] border border-slate-200 dark:border-[#263244] rounded-[16px] p-6 shadow-2xl space-y-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-[#F43F5E]" />
              <span>Lock Application?</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
              This will clear your active browser authentication token immediately. You will be redirected to the lock screen.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmLockDialog(false)}
                className="px-3.5 py-2 text-xs text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => lockApp()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-[10px] cursor-pointer shadow-xs"
              >
                Lock Application Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Wipe Sessions Dialog */}
      {showConfirmWipeDialog && (
        <div className="fixed inset-0 z-[100001] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-[#0F1621] border border-slate-200 dark:border-[#263244] rounded-[16px] p-6 shadow-2xl space-y-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-[#F43F5E]" />
              <span>Remote Wipe All Sessions?</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
              This will immediately terminate all client sessions across all registered browsers and log out everyone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmWipeDialog(false)}
                className="px-3.5 py-2 text-xs text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteWipeSessions}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-[10px] cursor-pointer shadow-xs"
              >
                Confirm Remote Wipe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
