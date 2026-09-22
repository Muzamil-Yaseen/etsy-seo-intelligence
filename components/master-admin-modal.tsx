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
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-[1180px] h-[88vh] max-h-[850px] bg-[#0B1019] text-[#F8FAFC] rounded-[18px] border border-[#263244] shadow-2xl flex flex-col overflow-hidden font-sans">
        {/* Header Bar */}
        <div className="h-16 px-6 border-b border-[#263244] flex items-center justify-between bg-[#0F1621] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[10px] bg-[#14B8A6]/10 border border-[#14B8A6]/20 text-[#14B8A6] flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#F8FAFC] tracking-tight">
                  Etsy Intelligence Admin
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#14B8A6]/10 text-[#2DD4BF] border border-[#14B8A6]/20">
                  Owner
                </span>
              </div>
              <p className="text-xs text-[#94A3B8]">
                Manage access, AI providers, sessions and application settings.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-block text-xs text-[#64748B]">
              Signed in as <strong className="text-[#94A3B8]">Muzamil</strong>
            </span>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-[10px] flex items-center justify-center text-[#64748B] hover:text-[#F8FAFC] hover:bg-[#131C29] transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Notification Bar */}
        {toastMsg && (
          <div className="mx-6 mt-3 p-2.5 bg-[#10B981]/10 border border-[#10B981]/30 rounded-[10px] text-xs text-[#10B981] flex items-center gap-2 animate-in fade-in shrink-0">
            <Check className="w-4 h-4 shrink-0" />
            <span className="font-medium">{toastMsg}</span>
          </div>
        )}

        {/* Two-Column Layout: Left Sidebar + Right Content */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Left Settings Navigation Sidebar (230px) */}
          <aside className="w-[230px] border-r border-[#263244] bg-[#0F1621] p-3 flex flex-col justify-between shrink-0 overflow-y-auto">
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
                        ? "bg-[#14B8A6]/10 text-[#F8FAFC] font-semibold border-l-2 border-[#14B8A6]"
                        : "text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/[0.04]"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#2DD4BF]" : "text-[#64748B]"}`} />
                    <span>{item.label}</span>
                    {item.id === "sessions" && (
                      <span className="ml-auto text-[11px] px-1.5 py-0.5 rounded-full bg-[#131C29] text-[#94A3B8]">
                        {devices.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="pt-3 border-t border-[#263244] text-[11px] text-[#64748B] flex items-center justify-between px-1">
              <span>Platform v1.2</span>
              <span className="text-[#10B981] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
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
                  <h3 className="text-base font-bold text-[#F8FAFC]">System Overview</h3>
                  <p className="text-xs text-[#94A3B8]">
                    Real-time status of application security, AI engines, and external integrations.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-[#0F1621] border border-[#263244] rounded-[14px] space-y-1">
                    <span className="text-xs text-[#94A3B8]">Application Access</span>
                    <div className="text-lg font-bold text-[#F8FAFC] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                      <span>Active</span>
                    </div>
                    <span className="text-[11px] text-[#64748B] block">
                      Expires {humanExpiry}
                    </span>
                  </div>

                  <div className="p-4 bg-[#0F1621] border border-[#263244] rounded-[14px] space-y-1">
                    <span className="text-xs text-[#94A3B8]">Authorized Sessions</span>
                    <div className="text-lg font-bold text-[#F8FAFC]">
                      {devices.length} Device{devices.length === 1 ? "" : "s"}
                    </div>
                    <span className="text-[11px] text-[#64748B] block">
                      {devices.filter((d) => d.status === "active").length} Active now
                    </span>
                  </div>

                  <div className="p-4 bg-[#0F1621] border border-[#263244] rounded-[14px] space-y-1">
                    <span className="text-xs text-[#94A3B8]">AI Intelligence Engine</span>
                    <div className="text-lg font-bold text-[#F8FAFC] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#14B8A6]" />
                      <span>Groq Llama-3</span>
                    </div>
                    <span className="text-[11px] text-[#64748B] block truncate">
                      {settings.aiRules.model}
                    </span>
                  </div>

                  <div className="p-4 bg-[#0F1621] border border-[#263244] rounded-[14px] space-y-1">
                    <span className="text-xs text-[#94A3B8]">Chrome Extension</span>
                    <div className="text-lg font-bold text-[#F8FAFC] flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${settings.extensionEnabled ? "bg-[#10B981]" : "bg-[#F43F5E]"}`} />
                      <span>{settings.extensionEnabled ? "Connected" : "Disabled"}</span>
                    </div>
                    <span className="text-[11px] text-[#64748B] block">
                      Bridge ready
                    </span>
                  </div>
                </div>

                {/* Quick Shortcuts */}
                <div className="p-5 bg-[#0F1621] border border-[#263244] rounded-[14px] space-y-3">
                  <h4 className="text-sm font-semibold text-[#F8FAFC]">Quick Governance Actions</h4>
                  <div className="flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      onClick={() => setActiveTab("security")}
                      className="px-3.5 py-2 rounded-[10px] bg-[#172231] hover:bg-[#1E293B] border border-[#263244] text-xs font-medium text-[#E2E8F0] transition cursor-pointer"
                    >
                      Update Access Expiration
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("sessions")}
                      className="px-3.5 py-2 rounded-[10px] bg-[#172231] hover:bg-[#1E293B] border border-[#263244] text-xs font-medium text-[#E2E8F0] transition cursor-pointer"
                    >
                      Manage Active Sessions
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("ai")}
                      className="px-3.5 py-2 rounded-[10px] bg-[#172231] hover:bg-[#1E293B] border border-[#263244] text-xs font-medium text-[#E2E8F0] transition cursor-pointer"
                    >
                      Configure AI Model &amp; Guardrails
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("branding")}
                      className="px-3.5 py-2 rounded-[10px] bg-[#172231] hover:bg-[#1E293B] border border-[#263244] text-xs font-medium text-[#E2E8F0] transition cursor-pointer"
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
                    <h3 className="text-base font-bold text-[#F8FAFC]">Active Sessions</h3>
                    <p className="text-xs text-[#94A3B8]">
                      Authorized devices and browsers permitted to use Etsy Intelligence.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRevokeAllOther}
                      className="px-3.5 py-2 bg-[#172231] hover:bg-[#1E293B] text-[#E2E8F0] border border-[#263244] rounded-[10px] text-xs font-medium transition cursor-pointer"
                    >
                      Revoke All Other Sessions
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowConfirmWipeDialog(true)}
                      className="px-3.5 py-2 bg-[#F43F5E]/10 hover:bg-[#F43F5E]/20 text-[#F43F5E] border border-[#F43F5E]/30 rounded-[10px] text-xs font-medium transition cursor-pointer"
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
                            ? "bg-[#0F1621]/40 border-[#263244]/40 opacity-50"
                            : isCur
                            ? "bg-[#0F1621] border-[#14B8A6]/40 shadow-xs"
                            : "bg-[#0F1621] border-[#263244]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 ${
                              isRev
                                ? "bg-[#111827] text-[#64748B]"
                                : isCur
                                ? "bg-[#14B8A6]/10 text-[#2DD4BF] border border-[#14B8A6]/20"
                                : "bg-[#131C29] text-[#94A3B8]"
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-[#F8FAFC]">{d.name}</span>
                              {isCur && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#14B8A6]/10 text-[#2DD4BF] border border-[#14B8A6]/20">
                                  This Browser
                                </span>
                              )}
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  isRev
                                    ? "bg-[#F43F5E]/10 text-[#F43F5E] border border-[#F43F5E]/20"
                                    : "bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20"
                                }`}
                              >
                                {isRev ? "Revoked" : "Active"}
                              </span>
                            </div>
                            <div className="text-xs text-[#64748B] flex items-center gap-2 flex-wrap">
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
                              className="px-2.5 py-1.5 rounded-[8px] bg-[#F43F5E]/10 hover:bg-[#F43F5E]/20 text-[#F43F5E] border border-[#F43F5E]/30 text-xs font-medium inline-flex items-center gap-1 transition cursor-pointer"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>Revoke</span>
                            </button>
                          ) : (
                            <span className="text-xs text-[#64748B] italic">Revoked</span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteDevice(d.id)}
                            className="w-8 h-8 rounded-[8px] text-[#64748B] hover:text-[#F8FAFC] hover:bg-[#131C29] flex items-center justify-center transition cursor-pointer"
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
                  <h3 className="text-base font-bold text-[#F8FAFC]">API &amp; Extension Configuration</h3>
                  <p className="text-xs text-[#94A3B8]">
                    Configure and manage external marketplace and AI model connections.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Groq Cloud */}
                  <div className="p-5 bg-[#0F1621] border border-[#263244] rounded-[14px] space-y-3 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-[10px] bg-[#14B8A6]/10 text-[#14B8A6] flex items-center justify-center">
                          <Cpu className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-[#F8FAFC]">Groq Llama-3 AI Engine</h4>
                          <p className="text-xs text-[#94A3B8]">Model: {settings.aiRules.model}</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20">
                        Connected
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B] leading-relaxed">
                      Powers title optimization, deterministic 13-tag extraction, and listing gap diagnostics.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleRemoteDeleteGroqKey}
                        className="px-3 py-1.5 rounded-[10px] bg-[#F43F5E]/10 hover:bg-[#F43F5E]/20 text-[#F43F5E] text-xs font-medium border border-[#F43F5E]/30 cursor-pointer"
                      >
                        Clear Custom Groq Key
                      </button>
                    </div>
                  </div>

                  {/* Chrome Extension */}
                  <div className="p-5 bg-[#0F1621] border border-[#263244] rounded-[14px] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Puzzle className="w-4 h-4 text-[#14B8A6]" />
                        <h4 className="text-sm font-semibold text-[#F8FAFC]">Chrome Extension Bridge</h4>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          settings.extensionEnabled
                            ? "bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20"
                            : "bg-[#F43F5E]/10 text-[#F43F5E] border border-[#F43F5E]/20"
                        }`}
                      >
                        {settings.extensionEnabled ? "Active" : "Disabled"}
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B]">
                      Bridge Token: <code className="font-mono text-[#E2E8F0]">{settings.extensionBridgeToken}</code>
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          handleSaveAll({
                            extensionEnabled: !settings.extensionEnabled,
                          })
                        }
                        className="px-3 py-1.5 rounded-[10px] bg-[#172231] hover:bg-[#1E293B] text-[#E2E8F0] text-xs font-medium border border-[#263244] cursor-pointer"
                      >
                        {settings.extensionEnabled ? "Disable Bridge" : "Enable Bridge"}
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoteDeleteExtension}
                        className="px-3 py-1.5 rounded-[10px] bg-[#F43F5E]/10 hover:bg-[#F43F5E]/20 text-[#F43F5E] text-xs font-medium border border-[#F43F5E]/30 cursor-pointer"
                      >
                        Revoke Bridge
                      </button>
                    </div>
                  </div>

                  {/* Etsy Developer API */}
                  <div className="p-5 bg-[#0F1621] border border-[#263244] rounded-[14px] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-[#14B8A6]" />
                        <h4 className="text-sm font-semibold text-[#F8FAFC]">Etsy Open API v3</h4>
                      </div>
                      <span className="text-xs text-[#94A3B8]">Configured</span>
                    </div>
                    <p className="text-xs text-[#64748B]">
                      Official API integration for high-throughput server-side metadata fetching.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleRemoteDeleteEtsyKey}
                        className="px-3 py-1.5 rounded-[10px] bg-[#F43F5E]/10 hover:bg-[#F43F5E]/20 text-[#F43F5E] text-xs font-medium border border-[#F43F5E]/30 cursor-pointer"
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
                  <h3 className="text-base font-bold text-[#F8FAFC]">AI Rules &amp; Guardrails</h3>
                  <p className="text-xs text-[#94A3B8]">
                    Control model reasoning parameters, system prompt guidance, and keyword negative lists.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#F8FAFC] block">
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
                    className="w-full bg-[#111827] border border-[#263244] rounded-[10px] p-3 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#14B8A6] font-mono leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#F8FAFC] block">Reasoning Model</label>
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
                      className="w-full h-10 bg-[#111827] border border-[#263244] rounded-[10px] px-3 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#14B8A6]"
                    >
                      <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile (Recommended)</option>
                      <option value="llama-3.1-8b-instant">llama-3.1-8b-instant (Fast)</option>
                      <option value="mixtral-8x7b-32768">mixtral-8x7b-32768</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-[#F8FAFC]">Temperature</label>
                      <span className="text-xs font-mono text-[#14B8A6]">
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
                      className="w-full accent-[#14B8A6]"
                    />
                    <div className="flex justify-between text-[11px] text-[#64748B]">
                      <span>Deterministic (0.0)</span>
                      <span>Creative (1.0)</span>
                    </div>
                  </div>
                </div>

                {/* Negative Keywords List */}
                <div className="space-y-2 pt-2 border-t border-[#263244]">
                  <label className="text-xs font-semibold text-[#F8FAFC] block">
                    Strict Negative Keywords Filter
                  </label>
                  <form onSubmit={handleAddNegativeKeyword} className="flex gap-2">
                    <input
                      type="text"
                      value={negativeKwInput}
                      onChange={(e) => setNegativeKwInput(e.target.value)}
                      placeholder="Add excluded term (e.g. cheap, fake)..."
                      className="flex-1 h-9 bg-[#111827] border border-[#263244] rounded-[10px] px-3 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#14B8A6]"
                    />
                    <button
                      type="submit"
                      className="h-9 px-3 bg-[#172231] hover:bg-[#1E293B] text-[#E2E8F0] rounded-[10px] text-xs font-medium cursor-pointer border border-[#263244]"
                    >
                      Add Filter
                    </button>
                  </form>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {settings.aiRules.negativeKeywords.map((kw, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-full bg-[#111827] text-[#94A3B8] text-xs border border-[#263244] flex items-center gap-1.5"
                      >
                        <span>{kw}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveNegativeKeyword(kw)}
                          className="text-[#64748B] hover:text-[#F43F5E] cursor-pointer ml-1"
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
                    className="px-4 py-2 bg-[#14B8A6] hover:bg-[#2DD4BF] text-[#021A17] text-xs font-semibold rounded-[10px] transition cursor-pointer shadow-sm"
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
                  <h3 className="text-base font-bold text-[#F8FAFC]">Brand Identity</h3>
                  <p className="text-xs text-[#94A3B8]">
                    Customize application name, subtitle, and announcement banner.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#F8FAFC] block">App Name</label>
                    <input
                      type="text"
                      value={settings.branding.appName}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          branding: { ...settings.branding, appName: e.target.value },
                        })
                      }
                      className="w-full h-10 bg-[#111827] border border-[#263244] rounded-[10px] px-3 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#14B8A6]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#F8FAFC] block">Header Subtitle</label>
                    <input
                      type="text"
                      value={settings.branding.headerBadgeText}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          branding: { ...settings.branding, headerBadgeText: e.target.value },
                        })
                      }
                      className="w-full h-10 bg-[#111827] border border-[#263244] rounded-[10px] px-3 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#14B8A6]"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-semibold text-[#F8FAFC] block">Logo Image URL</label>
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
                        className="flex-1 h-10 bg-[#111827] border border-[#263244] rounded-[10px] px-3 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#14B8A6]"
                      />
                      <div className="w-10 h-10 rounded-[10px] bg-[#111827] border border-[#263244] flex items-center justify-center shrink-0 p-1">
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
                    <label className="text-xs font-semibold text-[#F8FAFC] block">Footer Signature</label>
                    <input
                      type="text"
                      value={settings.branding.footerCredit}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          branding: { ...settings.branding, footerCredit: e.target.value },
                        })
                      }
                      className="w-full h-10 bg-[#111827] border border-[#263244] rounded-[10px] px-3 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#14B8A6]"
                    />
                  </div>
                </div>

                {/* Announcement Banner */}
                <div className="p-4 bg-[#0F1621] border border-[#263244] rounded-[14px] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-[#F8FAFC] block">Top Announcement Banner</span>
                      <span className="text-[11px] text-[#64748B]">Broadcast notices to all users</span>
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
                      <div className="w-9 h-5 bg-[#263244] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#14B8A6]"></div>
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
                      className="w-full h-10 bg-[#111827] border border-[#263244] rounded-[10px] px-3 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#14B8A6]"
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
                    className="px-3 py-1.5 rounded-[10px] text-xs text-[#64748B] hover:text-[#94A3B8] flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Defaults</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveAll({ branding: settings.branding })}
                    className="px-4 py-2 bg-[#14B8A6] hover:bg-[#2DD4BF] text-[#021A17] text-xs font-semibold rounded-[10px] transition cursor-pointer shadow-sm"
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
                  <h3 className="text-base font-bold text-[#F8FAFC]">Access &amp; Security</h3>
                  <p className="text-xs text-[#94A3B8]">
                    Manage access credentials, expiration dates, and emergency authentication locks.
                  </p>
                </div>

                {/* Access Secret Card */}
                <div className="p-5 bg-[#0F1621] border border-[#263244] rounded-[14px] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-[#F8FAFC]">Access Secret</h4>
                      <p className="text-xs text-[#94A3B8]">Key required for clients to access this studio.</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20">
                      Configured
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-[#111827] rounded-[10px] border border-[#263244]">
                    <div>
                      <div className="font-mono text-sm tracking-widest text-[#94A3B8]">
                        ••••••••••••••••
                      </div>
                      <span className="text-[11px] text-[#64748B]">
                        Active secret stored securely
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowReplaceSecretDialog(true)}
                      className="px-3.5 py-1.5 rounded-[10px] bg-[#172231] hover:bg-[#1E293B] border border-[#263244] text-xs font-medium text-[#E2E8F0] transition cursor-pointer"
                    >
                      Replace Secret
                    </button>
                  </div>
                </div>

                {/* Expiration Date Card */}
                <form onSubmit={handleSaveSecretAndExpiry} className="p-5 bg-[#0F1621] border border-[#263244] rounded-[14px] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-[#F8FAFC]">Access Expiration</h4>
                      <p className="text-xs text-[#94A3B8]">Set the valid-until date threshold for active credentials.</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[#14B8A6] font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{humanExpiry}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 max-w-sm">
                    <label className="text-xs font-semibold text-[#F8FAFC] block">
                      Select Expiration Date
                    </label>
                    <input
                      type="date"
                      value={expiryInput}
                      onChange={(e) => setExpiryInput(e.target.value)}
                      className="w-full h-11 bg-[#111827] border border-[#263244] rounded-[10px] px-3.5 text-xs font-mono text-[#F8FAFC] focus:outline-none focus:border-[#14B8A6]"
                      required
                    />
                    <p className="text-xs text-[#94A3B8]">
                      Access expires <strong>{new Date(`${expiryInput}T00:00:00.000Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}</strong>.
                    </p>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#14B8A6] hover:bg-[#2DD4BF] text-[#021A17] text-xs font-semibold rounded-[10px] transition cursor-pointer shadow-sm"
                    >
                      Save Expiration Date
                    </button>
                  </div>
                </form>

                {/* Emergency Lock Danger Panel */}
                <div className="p-5 bg-[#F43F5E]/5 border border-[#F43F5E]/20 rounded-[14px] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-[#F43F5E] flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Lock Etsy Intelligence</span>
                    </h4>
                    <p className="text-xs text-[#94A3B8] max-w-md">
                      Immediately invalidates active user sessions and requires authentication again.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowConfirmLockDialog(true)}
                    className="px-4 py-2 bg-[#F43F5E] hover:bg-[#E11D48] text-white rounded-[10px] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-sm transition self-start sm:self-auto"
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
        <div className="h-12 px-6 border-t border-[#263244] bg-[#0F1621] flex items-center justify-between text-xs text-[#64748B] shrink-0">
          <span>Session active · Administrator controls</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-[#172231] hover:bg-[#1E293B] border border-[#263244] text-[#F8FAFC] rounded-[8px] text-xs font-medium transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Replace Secret Dialog */}
      {showReplaceSecretDialog && (
        <div className="fixed inset-0 z-[100001] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-[#0F1621] border border-[#263244] rounded-[16px] p-6 shadow-2xl space-y-4">
            <h4 className="text-sm font-bold text-[#F8FAFC]">Set New Access Secret</h4>
            <p className="text-xs text-[#94A3B8]">
              Clients will need this new phrase to authenticate into the studio.
            </p>

            <div className="relative">
              <input
                type={showSecretInDialog ? "text" : "password"}
                value={newSecretValue}
                onChange={(e) => setNewSecretValue(e.target.value)}
                placeholder="Enter new secret key..."
                autoFocus
                className="w-full h-11 bg-[#111827] border border-[#263244] rounded-[10px] px-3.5 pr-10 text-xs font-mono text-[#F8FAFC] focus:outline-none focus:border-[#14B8A6]"
              />
              <button
                type="button"
                onClick={() => setShowSecretInDialog(!showSecretInDialog)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#94A3B8]"
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
                className="px-3.5 py-2 text-xs text-[#94A3B8] hover:text-[#F8FAFC] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyNewSecret}
                disabled={!newSecretValue.trim()}
                className="px-4 py-2 bg-[#14B8A6] hover:bg-[#2DD4BF] disabled:opacity-50 text-[#021A17] text-xs font-semibold rounded-[10px] cursor-pointer"
              >
                Save New Secret
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Lock Dialog */}
      {showConfirmLockDialog && (
        <div className="fixed inset-0 z-[100001] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-[#0F1621] border border-[#263244] rounded-[16px] p-6 shadow-2xl space-y-4">
            <h4 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#F43F5E]" />
              <span>Lock Application?</span>
            </h4>
            <p className="text-xs text-[#94A3B8]">
              This will clear your active browser authentication token immediately. You will be redirected to the lock screen.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmLockDialog(false)}
                className="px-3.5 py-2 text-xs text-[#94A3B8] hover:text-[#F8FAFC] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => lockApp()}
                className="px-4 py-2 bg-[#F43F5E] hover:bg-[#E11D48] text-white text-xs font-semibold rounded-[10px] cursor-pointer"
              >
                Lock Application Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Wipe Sessions Dialog */}
      {showConfirmWipeDialog && (
        <div className="fixed inset-0 z-[100001] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-[#0F1621] border border-[#263244] rounded-[16px] p-6 shadow-2xl space-y-4">
            <h4 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#F43F5E]" />
              <span>Remote Wipe All Sessions?</span>
            </h4>
            <p className="text-xs text-[#94A3B8]">
              This will immediately terminate all client sessions across all registered browsers and log out everyone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmWipeDialog(false)}
                className="px-3.5 py-2 text-xs text-[#94A3B8] hover:text-[#F8FAFC] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteWipeSessions}
                className="px-4 py-2 bg-[#F43F5E] hover:bg-[#E11D48] text-white text-xs font-semibold rounded-[10px] cursor-pointer"
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
