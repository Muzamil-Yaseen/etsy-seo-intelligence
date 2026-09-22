"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Shield,
  Smartphone,
  Laptop,
  Tablet,
  CheckCircle2,
  Ban,
  Trash2,
  LogOut,
  Key,
  KeyRound,
  Puzzle,
  Cpu,
  Database,
  ExternalLink,
  RefreshCw,
  Clock,
  AlertTriangle,
  Calendar,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  Download,
  Terminal,
} from "lucide-react";
import {
  DeviceSession,
  ConnectedApp,
  getRegisteredDevices,
  getCurrentDeviceId,
  revokeDevice,
  deleteDevice,
  revokeAllOtherDevices,
  getSecretValidityInfo,
  updateAppSecret,
  updateAppSecretExpiry,
  getConnectedAppsList,
} from "@/lib/device-manager";
import { lockApp } from "@/components/access-gate";

interface DevicesAppsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DevicesAppsModal({ isOpen, onClose }: DevicesAppsModalProps) {
  const [activeTab, setActiveTab] = useState<"devices" | "apps" | "security">("devices");
  const [devices, setDevices] = useState<DeviceSession[]>([]);
  const [apps, setApps] = useState<ConnectedApp[]>([]);
  const [validityInfo, setValidityInfo] = useState(getSecretValidityInfo());
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Security editing state
  const [isEditingSecret, setIsEditingSecret] = useState(false);
  const [newSecretInput, setNewSecretInput] = useState("");
  const [newExpiryInput, setNewExpiryInput] = useState("2026-12-01");
  const [showSecretText, setShowSecretText] = useState(false);

  // API Key management inside apps tab
  const [etsyKeyInput, setEtsyKeyInput] = useState("");
  const [groqKeyInput, setGroqKeyInput] = useState("");
  const [isEditingEtsyKey, setIsEditingEtsyKey] = useState(false);
  const [isEditingGroqKey, setIsEditingGroqKey] = useState(false);

  const refreshData = () => {
    setDevices(getRegisteredDevices());
    setApps(getConnectedAppsList());
    setValidityInfo(getSecretValidityInfo());

    try {
      setEtsyKeyInput(localStorage.getItem("etsy_user_api_key") || "");
      setGroqKeyInput(localStorage.getItem("groq_api_key") || "");
    } catch {}
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
    }
  }, [isOpen]);

  const showToast = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleRevoke = (id: string, isCurrent?: boolean) => {
    const updated = revokeDevice(id);
    setDevices(updated);
    if (isCurrent) {
      showToast("Current device revoked. Locking studio...");
      setTimeout(() => lockApp(), 1200);
    } else {
      showToast("Device access revoked successfully.");
    }
  };

  const handleDelete = (id: string) => {
    const updated = deleteDevice(id);
    setDevices(updated);
    showToast("Device removed from records.");
  };

  const handleRevokeOthers = () => {
    const updated = revokeAllOtherDevices();
    setDevices(updated);
    showToast("All other devices have been revoked.");
  };

  const handleSaveSecret = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSecretInput.trim()) return;
    updateAppSecret(newSecretInput.trim());
    if (newExpiryInput) {
      updateAppSecretExpiry(`${newExpiryInput}T23:59:59Z`);
    }
    refreshData();
    setIsEditingSecret(false);
    showToast("Access secret & expiry updated successfully.");
  };

  const handleSaveEtsyKey = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const clean = etsyKeyInput.trim();
      if (clean) {
        localStorage.setItem("etsy_user_api_key", clean);
      } else {
        localStorage.removeItem("etsy_user_api_key");
      }
      refreshData();
      setIsEditingEtsyKey(false);
      showToast(clean ? "Etsy API Key saved." : "Etsy API Key removed.");
    } catch {}
  };

  const handleSaveGroqKey = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const clean = groqKeyInput.trim();
      if (clean) {
        localStorage.setItem("groq_api_key", clean);
      } else {
        localStorage.removeItem("groq_api_key");
      }
      refreshData();
      setIsEditingGroqKey(false);
      showToast(clean ? "Groq API Key saved." : "Groq API Key removed.");
    } catch {}
  };

  if (!isOpen) return null;

  const currentDeviceId = getCurrentDeviceId();
  const activeDeviceCount = devices.filter((d) => d.status === "active").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center shadow-sm">
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-sm sm:text-base font-bold text-slate-900">
                  Device &amp; App Management
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Admin Control
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Manage authorized devices, connected tools, and your app access secret.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action notification toast */}
        {actionNotice && (
          <div className="mx-5 mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2 animate-in fade-in duration-150">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{actionNotice}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="px-5 pt-3 border-b border-slate-100 flex items-center justify-between bg-white flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab("devices")}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === "devices"
                  ? "bg-black text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>Devices ({devices.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("apps")}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === "apps"
                  ? "bg-black text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Puzzle className="w-3.5 h-3.5" />
              <span>Connected Apps ({apps.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("security")}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === "security"
                  ? "bg-black text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Secret &amp; Access</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-500 pb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Valid till <strong>1st Dec 2026</strong></span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* ========================================================================= */}
          {/* TAB 1: DEVICES MANAGEMENT                                                 */}
          {/* ========================================================================= */}
          {activeTab === "devices" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Authorized Devices ({activeDeviceCount} Active)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Browsers and computers that have unlocked this studio workspace.
                  </p>
                </div>

                {devices.length > 1 && (
                  <button
                    type="button"
                    onClick={handleRevokeOthers}
                    className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Ban className="w-3 h-3 text-rose-600" />
                    <span>Revoke Other Devices</span>
                  </button>
                )}
              </div>

              <div className="space-y-2.5">
                {devices.map((device) => {
                  const isCurrent = device.id === currentDeviceId;
                  const isRevoked = device.status === "revoked";

                  const DeviceIcon =
                    device.type === "mobile"
                      ? Smartphone
                      : device.type === "tablet"
                      ? Tablet
                      : Laptop;

                  return (
                    <div
                      key={device.id}
                      className={`p-3.5 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isRevoked
                          ? "bg-slate-50 border-slate-200 opacity-60"
                          : isCurrent
                          ? "bg-white border-emerald-300 shadow-xs ring-1 ring-emerald-500/20"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                            isRevoked
                              ? "bg-slate-200 text-slate-500"
                              : isCurrent
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          <DeviceIcon className="w-4 h-4" />
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-900">
                              {device.name}
                            </span>
                            {isCurrent && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                This Device
                              </span>
                            )}
                            {isRevoked ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                Revoked
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                                Active Session
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                            <span>OS: <strong>{device.os}</strong></span>
                            <span>•</span>
                            <span>Browser: <strong>{device.browser}</strong></span>
                            <span>•</span>
                            <span>
                              Active: {new Date(device.lastActive).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {!isRevoked ? (
                          <button
                            type="button"
                            onClick={() => handleRevoke(device.id, isCurrent)}
                            className="h-7 px-2.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-semibold inline-flex items-center gap-1 transition cursor-pointer border border-rose-200"
                            title={isCurrent ? "Revoke this device and lock session" : "Revoke device access"}
                          >
                            <Ban className="w-3 h-3 text-rose-600" />
                            <span>Revoke</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Revoked</span>
                        )}

                        {!isCurrent && (
                          <button
                            type="button"
                            onClick={() => handleDelete(device.id)}
                            className="h-7 w-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
                            title="Delete device record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between flex-wrap gap-2">
                <span>
                  All devices authenticate using the secret <strong>MuzamilTheKing</strong>. Revoking a device forces an immediate lockout.
                </span>
                <button
                  type="button"
                  onClick={refreshData}
                  className="inline-flex items-center gap-1 text-slate-700 hover:text-slate-900 font-semibold cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Refresh List</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: CONNECTED APPS                                                     */}
          {/* ========================================================================= */}
          {activeTab === "apps" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Connected Apps &amp; External Integrations
                </h3>
                <p className="text-[11px] text-slate-500">
                  Manage external connections, browser extensions, and API keys powering this studio.
                </p>
              </div>

              <div className="space-y-3">
                {/* 1. Chrome Extension */}
                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
                        <Puzzle className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900">
                            Etsy Intelligence Chrome Extension
                          </h4>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            v1.2.0 Active
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          Injects the ⚡ <strong>Open in Studio</strong> button and competitor inspector directly on Etsy listing and search pages.
                        </p>
                      </div>
                    </div>

                    <a
                      href="/api/download-extension"
                      download="etsy-intelligence-extension.zip"
                      className="shrink-0 px-3 py-1.5 bg-black hover:bg-zinc-800 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition border border-black cursor-pointer self-start sm:self-auto"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Extension (.ZIP)</span>
                    </a>
                  </div>
                </div>

                {/* 2. Etsy Developer API */}
                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                        <Database className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900">
                            Official Etsy Open API v3
                          </h4>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              etsyKeyInput
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {etsyKeyInput ? "Key Active" : "Optional / Ready"}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          Provides server-side listing retrieval, HD gallery sync, and price history without browser limits.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsEditingEtsyKey(!isEditingEtsyKey)}
                      className="shrink-0 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition cursor-pointer border border-slate-200 self-start sm:self-auto"
                    >
                      <Key className="w-3.5 h-3.5 text-slate-600" />
                      <span>{isEditingEtsyKey ? "Close" : etsyKeyInput ? "Edit Key" : "Add Key"}</span>
                    </button>
                  </div>

                  {isEditingEtsyKey && (
                    <form onSubmit={handleSaveEtsyKey} className="pt-2 border-t border-slate-100 flex gap-2">
                      <input
                        type="password"
                        value={etsyKeyInput}
                        onChange={(e) => setEtsyKeyInput(e.target.value)}
                        placeholder="Paste your Etsy API keystring..."
                        className="flex-1 h-9 bg-slate-50 border border-slate-200 rounded-lg px-3 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                      />
                      <button
                        type="submit"
                        className="h-9 px-3.5 bg-black text-white text-xs font-semibold rounded-lg hover:bg-zinc-800 transition cursor-pointer border border-black"
                      >
                        Save
                      </button>
                    </form>
                  )}
                </div>

                {/* 3. Groq AI Engine */}
                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center shrink-0">
                        <Cpu className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900">
                            Groq Cloud Llama-3 Engine
                          </h4>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Online
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          Runs Llama-3.3-70B for high-converting titles, 13 tags, and semantic search queries with under 1s latency.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsEditingGroqKey(!isEditingGroqKey)}
                      className="shrink-0 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition cursor-pointer border border-slate-200 self-start sm:self-auto"
                    >
                      <Key className="w-3.5 h-3.5 text-slate-600" />
                      <span>{isEditingGroqKey ? "Close" : groqKeyInput ? "Custom Key Set" : "Custom Key"}</span>
                    </button>
                  </div>

                  {isEditingGroqKey && (
                    <form onSubmit={handleSaveGroqKey} className="pt-2 border-t border-slate-100 flex gap-2">
                      <input
                        type="password"
                        value={groqKeyInput}
                        onChange={(e) => setGroqKeyInput(e.target.value)}
                        placeholder="Paste custom Groq API key (gsk_...)"
                        className="flex-1 h-9 bg-slate-50 border border-slate-200 rounded-lg px-3 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                      />
                      <button
                        type="submit"
                        className="h-9 px-3.5 bg-black text-white text-xs font-semibold rounded-lg hover:bg-zinc-800 transition cursor-pointer border border-black"
                      >
                        Save
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: APP SECRET & ACCESS CONTROL                                        */}
          {/* ========================================================================= */}
          {activeTab === "security" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  App Secret &amp; Expiration Settings
                </h3>
                <p className="text-[11px] text-slate-500">
                  Control the master team key and expiration date granting access to this dashboard.
                </p>
              </div>

              {/* Secret Overview Card */}
              <div className="p-5 bg-gradient-to-br from-slate-900 via-zinc-900 to-black text-white rounded-2xl border border-slate-800 shadow-md space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      Active Access Secret
                    </span>
                  </div>
                  <div className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/10 text-slate-200 border border-white/20">
                    {validityInfo.daysRemaining} days remaining
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <div className="font-mono text-xl sm:text-2xl font-black tracking-wide text-white">
                      {showSecretText ? validityInfo.secret : "•••••••••••••••"}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSecretText(!showSecretText)}
                      className="text-slate-400 hover:text-white transition cursor-pointer"
                      title={showSecretText ? "Hide secret" : "Show secret"}
                    >
                      {showSecretText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400">
                    Valid till: <strong className="text-white">{validityInfo.formattedExpiry}</strong> (1st December 2026)
                  </p>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between flex-wrap gap-3 text-xs">
                  <span className="text-slate-400">
                    All authorized devices must use this key to unlock studio features.
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setNewSecretInput(validityInfo.secret);
                      setIsEditingSecret(!isEditingSecret);
                    }}
                    className="px-3 py-1.5 bg-white text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    {isEditingSecret ? "Cancel Edit" : "Change Secret or Expiry"}
                  </button>
                </div>
              </div>

              {/* Edit Secret & Expiry Form */}
              {isEditingSecret && (
                <form
                  onSubmit={handleSaveSecret}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-in fade-in duration-150"
                >
                  <h4 className="text-xs font-bold text-slate-900">
                    Update Master Access Secret
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700 block">
                        Secret Key Phrase
                      </label>
                      <input
                        type="text"
                        value={newSecretInput}
                        onChange={(e) => setNewSecretInput(e.target.value)}
                        placeholder="e.g. MuzamilTheKing"
                        className="w-full h-9 bg-white border border-slate-200 rounded-lg px-3 text-xs text-slate-900 font-mono focus:outline-none focus:border-slate-900"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700 block">
                        Expiration Date (YYYY-MM-DD)
                      </label>
                      <input
                        type="date"
                        value={newExpiryInput}
                        onChange={(e) => setNewExpiryInput(e.target.value)}
                        className="w-full h-9 bg-white border border-slate-200 rounded-lg px-3 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsEditingSecret(false)}
                      className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-black hover:bg-zinc-800 text-white text-xs font-bold rounded-lg transition cursor-pointer border border-black"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              )}

              {/* Immediate Lockout Trigger */}
              <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl flex items-center justify-between flex-wrap gap-3">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-rose-900">
                    Lock Studio Immediately
                  </h4>
                  <p className="text-[11px] text-rose-700">
                    Invalidates the local browser session and requires re-entering the secret key.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => lockApp()}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Lock Studio Now</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <span>Active Device ID: <code className="font-mono text-[10px] text-slate-700">{currentDeviceId}</code></span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-black text-white rounded-lg text-xs font-semibold hover:bg-zinc-800 transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
