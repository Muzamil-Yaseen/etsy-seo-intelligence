"use client";

import React from "react";
import { X, Database, CheckCircle2, AlertCircle, Clock } from "lucide-react";

interface DataDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sampleStats?: {
    listingsAnalyzed?: number;
    uniqueShopsCount?: number;
    updatedAt?: string;
    hasRealCompetitors?: boolean;
    competitorSource?: string;
  };
  productFactsCount?: number;
  pricingSufficient?: boolean;
}

export function DataDetailsDrawer({
  isOpen,
  onClose,
  sampleStats,
  productFactsCount = 0,
  pricingSufficient = false,
}: DataDetailsDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Body */}
      <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full z-10 border-l border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-200 text-xs">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm tracking-tight text-white">
                Data Sources
              </h3>
              <p className="text-[11px] text-slate-400">
                Factual status of active data feeds and inputs
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Factual Inventory List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-slate-700">
          {/* Competitors Source */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900">Competitors</span>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                  sampleStats?.hasRealCompetitors
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-slate-100 text-slate-600 border-slate-200"
                }`}
              >
                {sampleStats?.hasRealCompetitors ? "Etsy API (Active)" : "Etsy API (Unavailable)"}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {sampleStats?.hasRealCompetitors
                ? `${sampleStats.listingsAnalyzed} active listings analyzed across ${sampleStats.uniqueShopsCount} shops.`
                : "No live marketplace listings retrieved for this session. Competitor analysis is disabled or based on manual URLs if provided."}
            </p>
          </div>

          {/* Product Facts Source */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900">Product Facts</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                User provided
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {productFactsCount > 0
                ? `${productFactsCount} confirmed fields provided (materials, dimensions, personalization, care).`
                : "Standard product traits inferred from search query."}
            </p>
          </div>

          {/* Keywords Source */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900">Keyword Research</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                Market overlap + AI assisted
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Observed phrases are extracted directly from competitor titles and tags. Suggested phrases are semantic expansions evaluated for relevance.
            </p>
          </div>

          {/* Pricing Source */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900">Pricing Benchmarks</span>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                  pricingSufficient
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-slate-100 text-slate-600 border-slate-200"
                }`}
              >
                {pricingSufficient ? "Sufficient data (5+ listings)" : "Insufficient data (< 5 listings)"}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {pricingSufficient
                ? "Quartiles calculated from verified active listings in this product niche."
                : "Quartile calculations require at least 5 competitor listings to prevent distorted benchmarks."}
            </p>
          </div>

          {/* Search Volume Methodology Note */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900">Search Volume</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                Unavailable via Open API
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              The Etsy Open API v3 does not disclose exact monthly search counts. To see exact volume metrics, import a verified Marketplace Insights CSV export.
            </p>
          </div>

          {/* Legal Compliance */}
          <div className="pt-3 border-t border-slate-200 space-y-1.5 text-[11px] text-slate-500">
            <span className="font-semibold text-slate-700 block uppercase tracking-wider text-[10px]">
              Compliance Notice
            </span>
            <p className="leading-relaxed">
              The term &quot;Etsy&quot; is a trademark of Etsy, Inc. This application uses the Etsy API but is not endorsed or certified by Etsy, Inc.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-black hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold transition cursor-pointer border border-black"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
