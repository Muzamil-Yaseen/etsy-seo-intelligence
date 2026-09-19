"use client";

import React, { useState } from "react";
import {
  Store,
  ShieldCheck,
  KeyRound,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Layers,
  Lock,
} from "lucide-react";

export function ConnectedShopsView() {
  const [apiKey, setApiKey] = useState("");
  const [sharedSecret, setSharedSecret] = useState("");
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const handleSaveApiKeys = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus("Etsy Open API v3 configuration updated. Ready for PKCE authentication flow.");
    setTimeout(() => setSaveStatus(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-orange-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Connected Etsy Shops</h2>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Authorize seller-owned shop performance metrics and active listings using official Etsy OAuth 2.0 with PKCE.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800 font-medium">
            PKCE Flow Ready
          </span>
        </div>
      </div>

      {/* Mandatory Attribution Banner */}
      <div className="p-4 bg-neutral-900/80 border border-neutral-800 rounded-xl text-xs space-y-1.5">
        <div className="font-semibold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Official Etsy API Attribution Requirement</span>
        </div>
        <p className="text-neutral-300 italic">
          &ldquo;The term &lsquo;Etsy&rsquo; is a trademark of Etsy, Inc. This Application uses Etsy&apos;s API, but is not endorsed or certified by Etsy.&rdquo;
        </p>
      </div>

      {/* Shop Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Connected Shops List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Shops in Current Workspace</h3>
                <p className="text-xs text-neutral-400">Craft &amp; Timber Studio</p>
              </div>
              <button className="text-xs bg-orange-600 hover:bg-orange-500 text-white font-semibold px-3.5 py-1.5 rounded-lg transition">
                + Connect New Etsy Shop
              </button>
            </div>

            {/* Mock/Active Shop Entry */}
            <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-600/20 border border-orange-500/30 flex items-center justify-center font-bold text-orange-400">
                    CT
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-sm">Craft &amp; Timber Goods</h4>
                    <p className="text-[11px] text-neutral-400">Etsy Shop ID: 29841029 • Currency: USD</p>
                  </div>
                </div>

                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-medium">
                  Connected (OAuth 2.0)
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs border-t border-neutral-800/80">
                <div>
                  <div className="text-[10px] text-neutral-400">Active Listings</div>
                  <div className="font-semibold text-neutral-200 mt-0.5">38</div>
                </div>
                <div>
                  <div className="text-[10px] text-neutral-400">Granted Scopes</div>
                  <div className="font-semibold text-neutral-200 mt-0.5">listings_r, shops_r</div>
                </div>
                <div>
                  <div className="text-[10px] text-neutral-400">Token Status</div>
                  <div className="font-semibold text-emerald-400 mt-0.5">Encrypted at rest</div>
                </div>
                <div>
                  <div className="text-[10px] text-neutral-400">Last Synced</div>
                  <div className="font-semibold text-neutral-300 mt-0.5">2 hours ago</div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800/60">
                <button className="text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-3 py-1.5 rounded-lg border border-neutral-700 transition flex items-center gap-1.5">
                  <RefreshCw className="w-3 h-3" />
                  <span>Sync Listings</span>
                </button>
                <button className="text-xs text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg transition">
                  Disconnect
                </button>
              </div>
            </div>
          </div>

          {/* Access Tiers Explanation */}
          <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white">Etsy App Access Tiers</h3>
            <div className="space-y-2 text-xs text-neutral-300 leading-relaxed">
              <p>
                <strong>Personal App Access:</strong> Your application starts in the Personal Access tier. This allows connections for up to 5 of your own authorized shops, ideal for development, testing, and private shop optimization.
              </p>
              <p>
                <strong>Commercial Access:</strong> To onboard external third-party Etsy sellers, you must submit an application for Commercial Access in the Etsy Developer Portal and adhere to Etsy&apos;s API Terms and attribution policies.
              </p>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Etsy Developer Credentials Config */}
        <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-orange-400" />
            <h3 className="text-sm font-semibold text-white">Etsy API Credentials</h3>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Configure your registered Etsy Developer App keystring and secret. Secrets are kept server-side and never sent to the browser.
          </p>

          <form onSubmit={handleSaveApiKeys} className="space-y-3 text-xs">
            <div>
              <label className="text-neutral-400 font-medium">Etsy API Key (Keystring)</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter keystring..."
                className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white focus:outline-none focus:border-neutral-700"
              />
            </div>

            <div>
              <label className="text-neutral-400 font-medium">Shared Secret</label>
              <input
                type="password"
                value={sharedSecret}
                onChange={(e) => setSharedSecret(e.target.value)}
                placeholder="Enter shared secret..."
                className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white focus:outline-none focus:border-neutral-700"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold py-2 rounded-lg border border-neutral-700 transition"
            >
              Save API Configuration
            </button>
          </form>

          {saveStatus && (
            <div className="p-2.5 bg-emerald-950/60 border border-emerald-800 rounded-lg text-xs text-emerald-300">
              {saveStatus}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
