"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  ShieldAlert,
  ShieldCheck,
  Laptop,
  Smartphone,
  Tablet,
  Ban,
  Trash2,
  Key,
  Puzzle,
  Cpu,
  Palette,
  Sparkles,
  Check,
  RefreshCw,
  Eye,
  EyeOff,
  LogOut,
  Settings,
  Flame,
  Radio,
  Sliders,
  Paintbrush,
  Image as ImageIcon,
  Save,
  RotateCcw,
  AlertTriangle,
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
  setAdminAuthenticated,
} from "@/lib/admin-settings";
import {
  getRegisteredDevices,
  getCurrentDeviceId,
  revokeDevice,
  deleteDevice,
  DeviceSession,
} from "@/lib/device-manager";
import { lockApp } from "@/components/access-gate";

interface MasterAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_COLORS = [
  { name: "Emerald", hex: "#10B981", bg: "bg-emerald-500" },
  { name: "Sapphire", hex: "#3B82F6", bg: "bg-blue-500" },
  { name: "Amethyst", hex: "#8B5CF6", bg: "bg-purple-500" },
  { name: "Sunset Amber", hex: "#F59E0B", bg: "bg-amber-500" },
  { name: "Crimson", hex: "#EF4444", bg: "bg-rose-500" },
  { name: "Monolith Black", hex: "#09090B", bg: "bg-zinc-900" },
];

export function MasterAdminModal({ isOpen, onClose }: MasterAdminModalProps) {
  const [activeTab, setActiveTab] = useState<"sessions" | "apikeys" | "ai" | "branding" | "secret">("sessions");
  const [settings, setSettings] = useState<AdminSettings>(getAdminSettings());
  const [devices, setDevices] = useState<DeviceSession[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Form states
  const [appSecretInput, setAppSecretInput] = useState("");
  const [expiryInput, setExpiryInput] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [negativeKwInput, setNegativeKwInput] = useState("");

  const refreshState = () => {
    const s = getAdminSettings();
    setSettings(s);
    setAppSecretInput(s.appSecret);
    setExpiryInput(s.appSecretExpiry.split("T")[0] || "2026-12-01");
    setDevices(getRegisteredDevices());
  };

  useEffect(() => {
    if (isOpen) {
      refreshState();
    }
  }, [isOpen]);

  const notify = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleSaveAll = (updated: Partial<AdminSettings>) => {
    const s = saveAdminSettings(updated);
    setSettings(s);
    notify("Settings saved & applied live!");
  };

  // Remote Actions
  const handleRemoteDeleteExtension = () => {
    if (confirm("Are you sure you want to remotely disconnect the Chrome Extension?")) {
      remoteDeleteExtensionBridge();
      refreshState();
      notify("Chrome Extension bridge token revoked and remote access disabled.");
    }
  };

  const handleRemoteDeleteEtsyKey = () => {
    remoteDeleteEtsyApiKey();
    refreshState();
    notify("Etsy API key remotely cleared.");
  };

  const handleRemoteDeleteGroqKey = () => {
    remoteDeleteGroqApiKey();
    refreshState();
    notify("Custom Groq API key remotely deleted.");
  };

  const handleRemoteWipeSessions = () => {
    if (confirm("Remote wipe all active sessions? This will log out every device immediately.")) {
      remoteWipeAllSessions();
      setDevices([]);
      notify("All active sessions wiped.");
      setTimeout(() => lockApp(), 1000);
    }
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
    if (!appSecretInput.trim()) return;
    handleSaveAll({
      appSecret: appSecretInput.trim(),
      appSecretExpiry: `${expiryInput}T23:59:59.999Z`,
    });
    // Also reauthorize current device to avoid lockouts
    reauthorizeCurrentDevice();
    notify("App Secret & Expiry updated successfully.");
  };

  if (!isOpen) return null;

  const currentId = getCurrentDeviceId();

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-zinc-950 text-zinc-100 rounded-2xl border border-zinc-800 shadow-2xl flex flex-col overflow-hidden font-sans">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-base sm:text-lg font-extrabold text-white tracking-tight">
                  Muzamil&apos;s Master Admin Panel
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/80">
                  Superuser Access
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Full governance over sessions, remote API keys, Groq AI guardrails, and site appearance.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live notification banner */}
        {toastMsg && (
          <div className="mx-6 mt-3 p-2.5 bg-emerald-950/80 border border-emerald-600/50 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{toastMsg}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 border-b border-zinc-800/80 flex items-center gap-2 overflow-x-auto bg-zinc-900/30">
          <button
            type="button"
            onClick={() => setActiveTab("sessions")}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition cursor-pointer shrink-0 ${
              activeTab === "sessions"
                ? "bg-zinc-800 text-white border border-zinc-700 shadow-xs"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900"
            }`}
          >
            <Laptop className="w-3.5 h-3.5 text-emerald-400" />
            <span>Control Sessions ({devices.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("apikeys")}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition cursor-pointer shrink-0 ${
              activeTab === "apikeys"
                ? "bg-zinc-800 text-white border border-zinc-700 shadow-xs"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900"
            }`}
          >
            <Key className="w-3.5 h-3.5 text-teal-400" />
            <span>Remote API &amp; Extension</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ai")}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition cursor-pointer shrink-0 ${
              activeTab === "ai"
                ? "bg-zinc-800 text-white border border-zinc-700 shadow-xs"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900"
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span>AI Rules &amp; Guardrails</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("branding")}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition cursor-pointer shrink-0 ${
              activeTab === "branding"
                ? "bg-zinc-800 text-white border border-zinc-700 shadow-xs"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900"
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-amber-400" />
            <span>Logo, Styles &amp; Colors</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("secret")}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition cursor-pointer shrink-0 ${
              activeTab === "secret"
                ? "bg-zinc-800 text-white border border-zinc-700 shadow-xs"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
            <span>App Secret &amp; Expiry</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ========================================================================= */}
          {/* TAB 1: SESSIONS & DEVICES                                                 */}
          {/* ========================================================================= */}
          {activeTab === "sessions" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-zinc-900/60 rounded-xl border border-zinc-800">
                <div>
                  <h3 className="text-sm font-bold text-white">Active Client Sessions</h3>
                  <p className="text-xs text-zinc-400">
                    Real-time list of all browser instances authenticated to access this app.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRemoteWipeSessions}
                  className="px-3.5 py-2 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
                >
                  <Ban className="w-3.5 h-3.5 text-rose-400" />
                  <span>Remote Wipe All Sessions</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {devices.map((d) => {
                  const isCur = d.id === currentId;
                  const isRev = d.status === "revoked";
                  const Icon =
                    d.type === "mobile" ? Smartphone : d.type === "tablet" ? Tablet : Laptop;

                  return (
                    <div
                      key={d.id}
                      className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                        isRev
                          ? "bg-zinc-900/30 border-zinc-800/60 opacity-50"
                          : isCur
                          ? "bg-zinc-900/80 border-emerald-500/50 shadow-sm ring-1 ring-emerald-500/20"
                          : "bg-zinc-900/60 border-zinc-800"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                            isRev
                              ? "bg-zinc-800 text-zinc-600"
                              : isCur
                              ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                              : "bg-zinc-800 text-zinc-300"
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-white">{d.name}</span>
                            {isCur && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                                This Browser
                              </span>
                            )}
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                isRev
                                  ? "bg-rose-950 text-rose-400 border border-rose-800"
                                  : "bg-zinc-800 text-zinc-300"
                              }`}
                            >
                              {isRev ? "Revoked" : "Active"}
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-400 flex items-center gap-2 flex-wrap font-mono">
                            <span>ID: {d.id}</span>
                            <span>•</span>
                            <span>
                              Authorized: {new Date(d.firstAuthorized).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {!isRev ? (
                          <button
                            type="button"
                            onClick={() => handleRevokeDevice(d.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-semibold inline-flex items-center gap-1 transition cursor-pointer"
                          >
                            <Ban className="w-3 h-3" />
                            <span>Kill Session</span>
                          </button>
                        ) : (
                          <span className="text-xs text-zinc-500 italic">Terminated</span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteDevice(d.id)}
                          className="w-8 h-8 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 flex items-center justify-center transition cursor-pointer"
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
          {/* TAB 2: REMOTE API KEYS & EXTENSION CONTROL                                 */}
          {/* ========================================================================= */}
          {activeTab === "apikeys" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white">Remote API &amp; Extension Disconnect</h3>
                <p className="text-xs text-zinc-400">
                  Instantly revoke, wipe, or reconfigure external integrations across all devices.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Chrome Extension Control */}
                <div className="p-4 bg-zinc-900/60 rounded-xl border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Puzzle className="w-4 h-4 text-amber-400" />
                      <h4 className="text-xs font-bold text-white">Chrome Extension Bridge</h4>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        settings.extensionEnabled
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          : "bg-rose-950 text-rose-400 border border-rose-800"
                      }`}
                    >
                      {settings.extensionEnabled ? "Active" : "Disabled"}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Bridge Token: <code className="font-mono text-zinc-200">{settings.extensionBridgeToken}</code>
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        handleSaveAll({
                          extensionEnabled: !settings.extensionEnabled,
                        })
                      }
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold cursor-pointer border border-zinc-700"
                    >
                      {settings.extensionEnabled ? "Disable Bridge" : "Enable Bridge"}
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoteDeleteExtension}
                      className="px-3 py-1.5 rounded-lg bg-rose-950/70 hover:bg-rose-900 text-rose-300 text-xs font-semibold cursor-pointer border border-rose-800"
                    >
                      Remote Disconnect
                    </button>
                  </div>
                </div>

                {/* Etsy Official API Key */}
                <div className="p-4 bg-zinc-900/60 rounded-xl border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-teal-400" />
                      <h4 className="text-xs font-bold text-white">Etsy Developer API Key</h4>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400">
                      {localStorage.getItem("etsy_user_api_key") ? "Key Configured" : "None"}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Permits server-side gallery &amp; tag extraction directly from Etsy servers.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleRemoteDeleteEtsyKey}
                      className="px-3 py-1.5 rounded-lg bg-rose-950/70 hover:bg-rose-900 text-rose-300 text-xs font-semibold cursor-pointer border border-rose-800"
                    >
                      Remote Delete Key
                    </button>
                  </div>
                </div>

                {/* Groq Llama-3 API Key */}
                <div className="p-4 bg-zinc-900/60 rounded-xl border border-zinc-800 space-y-3 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-purple-400" />
                      <h4 className="text-xs font-bold text-white">Groq AI Engine Key</h4>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400">
                      {localStorage.getItem("groq_api_key") ? "Custom Key Active" : "Default Server Key"}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Powering real-time market grounding and optimization. You can wipe custom keys remotely at any time.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleRemoteDeleteGroqKey}
                      className="px-3 py-1.5 rounded-lg bg-rose-950/70 hover:bg-rose-900 text-rose-300 text-xs font-semibold cursor-pointer border border-rose-800"
                    >
                      Remote Wipe Custom Groq Key
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: AI RULES & GUARDRAILS                                              */}
          {/* ========================================================================= */}
          {activeTab === "ai" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white">AI Optimization Guardrails</h3>
                <p className="text-xs text-zinc-400">
                  Control how Groq Llama-3 crafts listing titles, selects 13 tags, and rejects prohibited keywords.
                </p>
              </div>

              {/* System Prompt Guidelines */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-200 block">
                  Custom AI Instructions / System Tone
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
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100 focus:outline-none focus:border-zinc-700 font-mono leading-relaxed"
                />
              </div>

              {/* Model & Temperature */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-200 block">Groq AI Model</label>
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
                    className="w-full h-10 bg-zinc-900 border border-zinc-800 rounded-xl px-3 text-xs text-zinc-100 focus:outline-none"
                  >
                    <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile (Recommended)</option>
                    <option value="llama-3.1-8b-instant">llama-3.1-8b-instant (Fastest)</option>
                    <option value="mixtral-8x7b-32768">mixtral-8x7b-32768</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-200">Creativity / Temperature</label>
                    <span className="text-xs font-mono text-emerald-400">
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
                    className="w-full accent-emerald-500"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500">
                    <span>Deterministic (0.0)</span>
                    <span>Creative (1.0)</span>
                  </div>
                </div>
              </div>

              {/* Negative Keywords Filter */}
              <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                <label className="text-xs font-bold text-zinc-200 block">
                  Strict Negative Keywords Filter (Prohibited Terms)
                </label>
                <form onSubmit={handleAddNegativeKeyword} className="flex gap-2">
                  <input
                    type="text"
                    value={negativeKwInput}
                    onChange={(e) => setNegativeKwInput(e.target.value)}
                    placeholder="Add term (e.g. replica, fake, free)..."
                    className="flex-1 h-9 bg-zinc-900 border border-zinc-800 rounded-xl px-3 text-xs text-zinc-100 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="h-9 px-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold cursor-pointer border border-zinc-700"
                  >
                    Add Filter
                  </button>
                </form>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {settings.aiRules.negativeKeywords.map((kw, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-zinc-900 text-zinc-300 text-xs border border-zinc-800 flex items-center gap-1.5"
                    >
                      <span>{kw}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveNegativeKeyword(kw)}
                        className="text-zinc-500 hover:text-rose-400 cursor-pointer ml-1"
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
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm"
                >
                  Save AI Guardrails
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: SITE BRANDING, LOGO & COLORS                                       */}
          {/* ========================================================================= */}
          {activeTab === "branding" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-white">Branding &amp; Visual Styles</h3>
                <p className="text-xs text-zinc-400">
                  Customize the application logo, studio title, color theme, and announcement banners.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* App Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-200 block">App Name</label>
                  <input
                    type="text"
                    value={settings.branding.appName}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        branding: { ...settings.branding, appName: e.target.value },
                      })
                    }
                    className="w-full h-9 bg-zinc-900 border border-zinc-800 rounded-xl px-3 text-xs text-zinc-100 focus:outline-none"
                  />
                </div>

                {/* Subtitle */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-200 block">Header Subtitle Badge</label>
                  <input
                    type="text"
                    value={settings.branding.headerBadgeText}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        branding: { ...settings.branding, headerBadgeText: e.target.value },
                      })
                    }
                    className="w-full h-9 bg-zinc-900 border border-zinc-800 rounded-xl px-3 text-xs text-zinc-100 focus:outline-none"
                  />
                </div>

                {/* Logo URL */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-zinc-200 block">Logo Image Path or URL</label>
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
                      className="flex-1 h-9 bg-zinc-900 border border-zinc-800 rounded-xl px-3 text-xs text-zinc-100 focus:outline-none"
                    />
                    <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 p-1">
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

                {/* Footer Credit */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-zinc-200 block">Footer Signature / Credit</label>
                  <input
                    type="text"
                    value={settings.branding.footerCredit}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        branding: { ...settings.branding, footerCredit: e.target.value },
                      })
                    }
                    className="w-full h-9 bg-zinc-900 border border-zinc-800 rounded-xl px-3 text-xs text-zinc-100 focus:outline-none"
                  />
                </div>
              </div>

              {/* Accent Color Palette */}
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <label className="text-xs font-bold text-zinc-200 block">
                  Studio Accent Theme Color
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {PRESET_COLORS.map((c) => {
                    const isSelected = settings.branding.accentColor.toLowerCase() === c.hex.toLowerCase();
                    return (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() =>
                          setSettings({
                            ...settings,
                            branding: { ...settings.branding, accentColor: c.hex },
                          })
                        }
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                          isSelected
                            ? "bg-zinc-800 text-white border-white/40 shadow-sm"
                            : "bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-white"
                        }`}
                      >
                        <span className={`w-3 h-3 rounded-full ${c.bg}`} />
                        <span>{c.name}</span>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Announcement Banner */}
              <div className="p-4 bg-zinc-900/60 rounded-xl border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Top Studio Announcement Banner</span>
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
                    <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
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
                    placeholder="Enter banner message shown to all users..."
                    className="w-full h-9 bg-zinc-950 border border-zinc-800 rounded-lg px-3 text-xs text-zinc-100 focus:outline-none"
                  />
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const r = resetAdminSettings();
                    setSettings(r);
                    notify("Reset to factory branding.");
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Defaults</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveAll({ branding: settings.branding })}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm"
                >
                  Apply Branding Live
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: APP SECRET & EXPIRATION (MUZAMIL'S SECRET KEY)                     */}
          {/* ========================================================================= */}
          {activeTab === "secret" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white">App Access Secret &amp; Date Expiration</h3>
                <p className="text-xs text-zinc-400">
                  This key is strictly private. Only you can view or set it from this master panel.
                </p>
              </div>

              <form onSubmit={handleSaveSecretAndExpiry} className="p-5 bg-zinc-900/60 rounded-xl border border-zinc-800 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-200 block">
                      Secret Key Phrase (Private)
                    </label>
                    <div className="relative">
                      <input
                        type={showSecret ? "text" : "password"}
                        value={appSecretInput}
                        onChange={(e) => setAppSecretInput(e.target.value)}
                        className="w-full h-10 bg-zinc-950 border border-zinc-800 rounded-xl pl-3 pr-10 text-xs font-mono text-white focus:outline-none focus:border-zinc-700"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowSecret(!showSecret)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                      >
                        {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-200 block">
                      Expiration Date (Access valid until)
                    </label>
                    <input
                      type="date"
                      value={expiryInput}
                      onChange={(e) => setExpiryInput(e.target.value)}
                      className="w-full h-10 bg-zinc-950 border border-zinc-800 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-zinc-700"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-zinc-400">
                    Currently: <strong className="text-emerald-400">{settings.appSecret}</strong> (Valid till{" "}
                    <strong>{new Date(settings.appSecretExpiry).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}</strong>)
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm"
                  >
                    Save Secret &amp; Date
                  </button>
                </div>
              </form>

              {/* Emergency Lock Studio Button */}
              <div className="p-4 bg-rose-950/40 border border-rose-900/60 rounded-xl flex items-center justify-between flex-wrap gap-3">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-rose-300">Lock App Immediately</h4>
                  <p className="text-[11px] text-rose-400/80">
                    Wipes session token from this browser and forces re-authentication.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => lockApp()}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-sm transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Lock Studio Now</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-900/50 flex items-center justify-between text-xs text-zinc-400">
          <span>Admin Session Active • User: <strong>Muzamil</strong></span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white text-zinc-950 rounded-lg text-xs font-bold hover:bg-zinc-200 transition cursor-pointer"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
}
