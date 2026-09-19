"use client";

import React from "react";
import {
  Settings,
  Database,
  ShieldCheck,
  Cpu,
  Clock,
  ExternalLink,
  Layers,
  Sparkles,
} from "lucide-react";

export function SettingsView() {
  const sourcesHierarchy = [
    {
      level: 1,
      name: "Etsy Marketplace Insights",
      type: "ETSY_MARKETPLACE_INSIGHTS",
      quality: "Level 1 (Highest Quality)",
      description: "Direct Etsy search volume and active listing competition from the previous 30 days. Imported via legitimate user-controlled methods without scraping.",
      badge: "DIRECT_ETSY",
      badgeColor: "bg-emerald-950 text-emerald-400 border-emerald-800",
    },
    {
      level: 2,
      name: "Etsy Open API v3",
      type: "ETSY_OPEN_API",
      quality: "Level 2 (High Quality)",
      description: "Official authenticated endpoints (findAllListingsActive, taxonomy, shop listings) complying with Etsy Developer Terms.",
      badge: "OFFICIAL_API",
      badgeColor: "bg-blue-950 text-blue-400 border-blue-800",
    },
    {
      level: 3,
      name: "Seller-Owned Shop Analytics",
      type: "SHOP_ANALYTICS",
      quality: "Level 3 (High Quality)",
      description: "Seller's direct shop performance history (orders, listing views, conversion, price performance). Used strictly for private Seller Fit personalization.",
      badge: "SHOP_DATA",
      badgeColor: "bg-indigo-950 text-indigo-400 border-indigo-800",
    },
    {
      level: 4,
      name: "Approved Third-Party Providers",
      type: "THIRD_PARTY",
      quality: "Level 4 (Estimated)",
      description: "Normalized third-party search and competitive estimates. Clearly distinguished from direct platform facts.",
      badge: "ESTIMATED",
      badgeColor: "bg-neutral-800 text-neutral-300 border-neutral-700",
    },
    {
      level: 5,
      name: "AI Semantic Classification",
      type: "AI_GENERATED",
      quality: "Level 5 (Derived / Semantic)",
      description: "Calculates semantic relevance, buyer intent, contradiction detection, and candidate expansion. Never fabricates marketplace metrics.",
      badge: "AI_DERIVED",
      badgeColor: "bg-purple-950 text-purple-400 border-purple-800",
    },
    {
      level: 6,
      name: "Synthetic Development Fixtures",
      type: "SYNTHETIC_DEMO",
      quality: "Level 6 (Development Only)",
      description: "Demonstration fixtures clearly labeled SYNTHETIC DEMO DATA with 0 production confidence. Used solely for offline development and automated testing.",
      badge: "SYNTHETIC_DEMO",
      badgeColor: "bg-amber-950 text-amber-400 border-amber-800",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-orange-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              Data Sources, Provenance &amp; System Settings
            </h2>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Review scoring algorithm versions, data source quality hierarchy, and Etsy API compliance policies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded bg-neutral-800 text-neutral-300 border border-neutral-700 font-mono">
            Scoring Engine: v1.0.0
          </span>
        </div>
      </div>

      {/* Mandatory Etsy Attribution Card */}
      <div className="p-4 bg-neutral-900/80 border border-neutral-800 rounded-xl text-xs space-y-2">
        <div className="font-semibold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Etsy API Terms of Use Attribution Notice</span>
        </div>
        <p className="text-neutral-300 italic leading-relaxed">
          &ldquo;The term &lsquo;Etsy&rsquo; is a trademark of Etsy, Inc. This Application uses Etsy&apos;s API, but is not endorsed or certified by Etsy.&rdquo;
        </p>
        <p className="text-[11px] text-neutral-400">
          This notice is displayed permanently across the application footer and documentation in full compliance with Etsy trademark and developer policies.
        </p>
      </div>

      {/* Data Source Quality Hierarchy Table */}
      <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-5 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Data Source Hierarchy (Levels 1 to 6)</h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Every marketplace metric maintains strict provenance so sellers always know whether a number is direct, derived, or synthetic.
          </p>
        </div>

        <div className="space-y-3">
          {sourcesHierarchy.map((src) => (
            <div
              key={src.level}
              className="p-4 bg-neutral-950 rounded-lg border border-neutral-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{src.name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium border ${src.badgeColor}`}>
                    {src.badge}
                  </span>
                </div>
                <p className="text-neutral-400 leading-relaxed">{src.description}</p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[11px] text-neutral-300 font-semibold">{src.quality}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Freshness Policies & Algorithm Versioning */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-5 space-y-3 text-xs">
          <div className="flex items-center gap-2 font-semibold text-white text-sm">
            <Clock className="w-4 h-4 text-blue-400" />
            <span>Observation Freshness Policies</span>
          </div>
          <ul className="text-neutral-400 space-y-2 leading-relaxed">
            <li>• <strong>Search Demand:</strong> Refreshed on each import cycle; historical observations are preserved forever.</li>
            <li>• <strong>Active Competition:</strong> Refreshed via official listing counts periodically.</li>
            <li>• <strong>AI Semantic Classifications:</strong> Cached indefinitely; updated only when product specifications or models change.</li>
            <li>• <strong>No Overwriting:</strong> Every measurement is appended as a point-in-time observation with source provenance.</li>
          </ul>
        </div>

        <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-5 space-y-3 text-xs">
          <div className="flex items-center gap-2 font-semibold text-white text-sm">
            <Cpu className="w-4 h-4 text-orange-400" />
            <span>Deterministic Scoring Engine Specifications</span>
          </div>
          <ul className="text-neutral-400 space-y-2 leading-relaxed">
            <li>• <strong>Active Version:</strong> <code>v1.0.0</code></li>
            <li>• <strong>Dynamic Re-weighting:</strong> Missing signals are never filled with fake 50s or zeroes; remaining signal weights re-normalize to 100%.</li>
            <li>• <strong>Confidence Decoupled:</strong> Measures evidence credibility (source quality, freshness, coverage, sample size), strictly independent of Opportunity.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
