"use client";

import React, { useState } from "react";
import {
  Tag as TagIcon,
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  AlertCircle,
  Layers,
  BarChart3,
  Sliders,
  RefreshCw,
} from "lucide-react";
import { SelectedTag } from "@/lib/optimizers/tag-optimizer";

interface TagOptimizerViewProps {
  initialCandidates: Array<{
    keyword: string;
    cluster: string;
    opportunityScore: number;
    relevanceScore: number;
    intentScore: number;
    demandScore?: number | null;
    intentType: string;
    isContradictory?: boolean;
  }>;
  productName: string;
}

export function TagOptimizerView({ initialCandidates, productName }: TagOptimizerViewProps) {
  const [selectedTags, setSelectedTags] = useState<SelectedTag[]>([]);
  const [rejectedList, setRejectedList] = useState<Array<{ tag: string; reason: string }>>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [uniqueClusters, setUniqueClusters] = useState<string[]>([]);

  const handleRunOptimizer = async () => {
    setIsOptimizing(true);
    try {
      const res = await fetch("/api/tags/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidates: initialCandidates,
          maxTags: 13,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedTags(data.selectedTags);
        setRejectedList(data.rejectedCandidates || []);
        setUniqueClusters(data.uniqueClustersCovered || []);
      }
    } catch (err) {
      console.error("Optimizer error:", err);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleCopyTags = (format: "comma" | "lines") => {
    const text = selectedTags.map((t) => t.tag).join(format === "comma" ? ", " : "\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Run initial optimization on mount if empty
  React.useEffect(() => {
    if (selectedTags.length === 0 && initialCandidates.length > 0) {
      handleRunOptimizer();
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <TagIcon className="w-5 h-5 text-orange-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">13-Tag Set Marginal Utility Optimizer</h2>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Product: <span className="text-neutral-200 font-medium">{productName}</span> • Enforces Etsy&apos;s strict &le;20 character limit and maximizes semantic cluster coverage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunOptimizer}
            disabled={isOptimizing}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 disabled:bg-neutral-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isOptimizing ? "Optimizing..." : "Re-Calculate 13 Tags"}</span>
          </button>
        </div>
      </div>

      {/* 13 Tag Slots Grid */}
      <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white">Selected Etsy Tag Set ({selectedTags.length}/13 Slots)</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-medium">
              Etsy Compliant
            </span>
          </div>

          {selectedTags.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopyTags("comma")}
                className="flex items-center gap-1.5 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-3 py-1.5 rounded-lg border border-neutral-700 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied!" : "Copy as Comma List"}</span>
              </button>
            </div>
          )}
        </div>

        {/* The 13 Visual Slots */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {Array.from({ length: 13 }).map((_, index) => {
            const item = selectedTags[index];
            return (
              <div
                key={index}
                className={`p-3.5 rounded-lg border text-xs transition ${
                  item
                    ? "bg-neutral-950 border-neutral-800 hover:border-neutral-700"
                    : "bg-neutral-950/40 border-neutral-800/50 border-dashed text-neutral-600"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5 text-[10px] text-neutral-400">
                  <span className="font-semibold text-orange-400">Slot #{index + 1}</span>
                  {item ? (
                    <span className="font-mono text-neutral-400">
                      {item.characterCount}/20 chars
                    </span>
                  ) : (
                    <span>Empty</span>
                  )}
                </div>

                {item ? (
                  <div className="space-y-1.5">
                    <div className="font-bold text-white text-sm truncate">{item.tag}</div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 text-[10px]">
                        {item.cluster}
                      </span>
                      <span className="text-emerald-400 font-medium text-[10px]">
                        +{item.marginalValue} Utility
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="py-2 text-center text-neutral-400 italic">No tag selected</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Marginal Utility & Diversity Rationale */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Cluster Diversity Coverage */}
        <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-white text-sm font-semibold">
            <Layers className="w-4 h-4 text-blue-400" />
            <span>Semantic Cluster Distribution ({uniqueClusters.length} Clusters Covered)</span>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Rather than filling all 13 slots with repetitive variations of &lsquo;personalized wallet&rsquo;, the greedy selection algorithm balances Core Product, Material, Recipient, Occasion, and Feature terms to cast the widest net.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {uniqueClusters.map((c) => (
              <span
                key={c}
                className="px-2.5 py-1 rounded-md text-xs font-medium bg-neutral-800 border border-neutral-700 text-neutral-200"
              >
                {c}
              </span>
            ))}
          </div>
        </div>

        {/* Right: Marginal Utility Formula Guide */}
        <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-white text-sm font-semibold">
            <BarChart3 className="w-4 h-4 text-orange-400" />
            <span>Marginal Utility Formula</span>
          </div>
          <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 text-[11px] font-mono text-neutral-300 space-y-1">
            <div>BaseTagValue = 0.45×Opp + 0.25×Rel + 0.15×Intent + 0.15×Demand</div>
            <div className="text-orange-400">
              MarginalUtility = BaseValue + ClusterBonus + IntentBonus - RedundancyPenalty
            </div>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Each successive tag is evaluated against the tags already picked. If a tag is too lexically or semantically similar to an existing selection, a heavy redundancy penalty is applied.
          </p>
        </div>
      </div>

      {/* Rejected Tag Candidates */}
      {rejectedList.length > 0 && (
        <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-red-400 text-xs font-semibold">
            <AlertCircle className="w-4 h-4" />
            <span>Excluded Candidates ({rejectedList.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
            {rejectedList.map((r, idx) => (
              <div key={idx} className="p-2 bg-neutral-950 rounded border border-neutral-800 text-neutral-400">
                <span className="text-white font-medium">&lsquo;{r.tag}&rsquo;</span>: {r.reason}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
