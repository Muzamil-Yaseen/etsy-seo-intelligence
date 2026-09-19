"use client";

import React, { useState } from "react";
import {
  FlaskConical,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
} from "lucide-react";

export function ExperimentsView() {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">SEO Optimization Experiments</h2>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Track before-and-after listing snapshots, measure traffic and conversion impact, and avoid multi-variable correlation fallacies.
          </p>
        </div>

        <button className="text-xs bg-purple-600 hover:bg-purple-500 text-white font-semibold px-4 py-2 rounded-lg transition">
          + Start New SEO Experiment
        </button>
      </div>

      {/* Experiment Caution Notice */}
      <div className="p-4 bg-neutral-900/80 border border-neutral-800 rounded-xl text-xs space-y-1.5">
        <div className="font-semibold text-white flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>Scientific Experimentation Principle</span>
        </div>
        <p className="text-neutral-300 leading-relaxed">
          Never change title, tags, photos, and prices at the exact same moment. Single-variable or controlled changes (such as swapping 3 redundant tags for long-tail phrases) produce clear causal signals without noise.
        </p>
      </div>

      {/* Active Experiments List */}
      <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-white">Tracked Listing Optimizations</h3>

        <div className="p-5 bg-neutral-950 rounded-xl border border-neutral-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-white text-sm">Experiment #1: 2026 Title Restructure &amp; Tag Expansion</h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-medium">
                  Active (Day 14)
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Target Listing: Personalized Full Grain Leather Bifold Wallet
              </p>
            </div>

            <div className="text-xs text-neutral-400">
              Started: <span className="text-neutral-200">Sep 4, 2026</span>
            </div>
          </div>

          {/* Before vs After Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2 border-t border-neutral-800/80">
            {/* Baseline */}
            <div className="p-3.5 bg-neutral-900/60 rounded-lg border border-neutral-800 space-y-2">
              <div className="font-semibold text-neutral-400 uppercase tracking-wider text-[10px]">
                Baseline (30 Days Prior)
              </div>
              <div className="text-neutral-300">
                <strong>Title:</strong> Personalized Leather Wallet Men, Custom Engraved Wallet for Husband...
              </div>
              <div className="text-neutral-300">
                <strong>Tags:</strong> 10 tags (3 repetitive phrases)
              </div>
              <div className="pt-2 grid grid-cols-3 gap-2 text-neutral-400 border-t border-neutral-800 text-[11px]">
                <div>Views: <span className="text-white font-medium">320</span></div>
                <div>Favorites: <span className="text-white font-medium">24</span></div>
                <div>Orders: <span className="text-white font-medium">6</span></div>
              </div>
            </div>

            {/* Post Change */}
            <div className="p-3.5 bg-neutral-900/60 rounded-lg border border-neutral-800 space-y-2">
              <div className="font-semibold text-purple-400 uppercase tracking-wider text-[10px]">
                Post-Optimization (Current 14 Days)
              </div>
              <div className="text-neutral-300">
                <strong>Title:</strong> Personalized Full Grain Leather Bifold Wallet with Initial Engraving
              </div>
              <div className="text-neutral-300">
                <strong>Tags:</strong> 13 diverse tags (&le;20 chars each, 6 unique clusters)
              </div>
              <div className="pt-2 grid grid-cols-3 gap-2 text-neutral-400 border-t border-neutral-800 text-[11px]">
                <div>Views: <span className="text-emerald-400 font-medium">210 (+31%)</span></div>
                <div>Favorites: <span className="text-emerald-400 font-medium">19 (+42%)</span></div>
                <div>Orders: <span className="text-emerald-400 font-medium">5 (+55%)</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
