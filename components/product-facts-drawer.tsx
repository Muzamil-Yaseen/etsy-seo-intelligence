"use client";

import React from "react";
import { X, Check, ShieldCheck, Sparkles, AlertCircle, Package } from "lucide-react";
import { ProductFacts } from "@/lib/product-facts/types";

interface ProductFactsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  facts: Partial<ProductFacts>;
  onChange: (updated: Partial<ProductFacts>) => void;
  onApplyAndReanalyze?: () => void;
}

export function ProductFactsDrawer({
  isOpen,
  onClose,
  facts,
  onChange,
  onApplyAndReanalyze,
}: ProductFactsDrawerProps) {
  if (!isOpen) return null;

  const updateField = (key: keyof ProductFacts, value: any) => {
    onChange({
      ...facts,
      [key]: value,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Body */}
      <div className="relative w-full max-w-lg bg-white shadow-2xl flex flex-col h-full z-10 border-l border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white text-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight text-white">
                Confirmed Product Facts
              </h3>
              <p className="text-[11px] text-slate-300">
                Ground truth parameters used to prevent AI hallucinations
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs text-slate-800">
          <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg space-y-1">
            <span className="font-semibold text-emerald-900 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              Programmatic Whitelist Active
            </span>
            <p className="text-emerald-700 text-[11px] leading-relaxed">
              Titles, tags, and descriptions will only use attributes confirmed below. Non-confirmed materials (e.g. leather, sterling silver, solid oak) are automatically rejected.
            </p>
          </div>

          {/* Product Type (Physical vs Digital) */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 uppercase tracking-wider block">
              Product Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => updateField("productType", "physical")}
                className={`py-2 px-3 rounded-lg border text-center font-medium transition ${
                  facts.productType !== "digital"
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                }`}
              >
                Physical Item (Shipped)
              </button>
              <button
                type="button"
                onClick={() => updateField("productType", "digital")}
                className={`py-2 px-3 rounded-lg border text-center font-medium transition ${
                  facts.productType === "digital"
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                }`}
              >
                Digital Download
              </button>
            </div>
          </div>

          {/* Product Noun */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 block">
              Exact Product Noun
            </label>
            <input
              type="text"
              value={facts.productNoun || ""}
              onChange={(e) => updateField("productNoun", e.target.value)}
              placeholder="e.g. Ceramic Matcha Bowl, Bifold Wallet, Pendant Necklace"
              className="w-full h-9 bg-white border border-slate-200 rounded-lg px-3 text-xs text-slate-900 focus:border-slate-900 outline-none"
            />
          </div>

          {/* Primary Material */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 block">
              Confirmed Primary Material
            </label>
            <input
              type="text"
              value={facts.primaryMaterial || ""}
              onChange={(e) => updateField("primaryMaterial", e.target.value)}
              placeholder="e.g. Stoneware Ceramic, Full-grain Vegetable Tanned Leather, Solid Oak"
              className="w-full h-9 bg-white border border-slate-200 rounded-lg px-3 text-xs text-slate-900 focus:border-slate-900 outline-none"
            />
            <p className="text-[11px] text-slate-400">
              Only confirmed materials will be used in title variations and tags.
            </p>
          </div>

          {/* Personalization Toggle */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">Is Personalization Offered?</span>
              <button
                type="button"
                onClick={() =>
                  updateField("personalization", {
                    isOffered: !facts.personalization?.isOffered,
                    instructions: facts.personalization?.instructions || "",
                  })
                }
                className={`w-11 h-6 flex items-center rounded-full p-1 transition cursor-pointer ${
                  facts.personalization?.isOffered ? "bg-emerald-600" : "bg-slate-300"
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition ${
                    facts.personalization?.isOffered ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </div>

            {facts.personalization?.isOffered && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 mt-2">
                <label className="text-[11px] font-semibold text-slate-600 block">
                  Personalization Instructions / Character Limit:
                </label>
                <input
                  type="text"
                  value={facts.personalization?.instructions || ""}
                  onChange={(e) =>
                    updateField("personalization", {
                      ...facts.personalization,
                      instructions: e.target.value,
                    })
                  }
                  placeholder="e.g. Max 3 initials laser engraved on bottom rim"
                  className="w-full h-8 bg-white border border-slate-200 rounded-md px-2.5 text-xs text-slate-900 outline-none"
                />
              </div>
            )}
          </div>

          {/* Sizing & Dimensions */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="font-semibold text-slate-700 block">Dimensions / Capacity</span>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                step="0.1"
                value={facts.dimensions?.length || ""}
                onChange={(e) =>
                  updateField("dimensions", {
                    ...facts.dimensions,
                    length: parseFloat(e.target.value) || undefined,
                    unit: facts.dimensions?.unit || "in",
                  })
                }
                placeholder="Length"
                className="h-8 bg-white border border-slate-200 rounded-md px-2.5 text-xs text-slate-900 outline-none"
              />
              <input
                type="number"
                step="0.1"
                value={facts.dimensions?.width || ""}
                onChange={(e) =>
                  updateField("dimensions", {
                    ...facts.dimensions,
                    width: parseFloat(e.target.value) || undefined,
                    unit: facts.dimensions?.unit || "in",
                  })
                }
                placeholder="Width / Diam"
                className="h-8 bg-white border border-slate-200 rounded-md px-2.5 text-xs text-slate-900 outline-none"
              />
              <select
                value={facts.dimensions?.unit || "in"}
                onChange={(e: any) =>
                  updateField("dimensions", {
                    ...facts.dimensions,
                    unit: e.target.value,
                  })
                }
                className="h-8 bg-white border border-slate-200 rounded-md px-2 text-xs text-slate-700 outline-none"
              >
                <option value="in">Inches (in)</option>
                <option value="cm">Centimeters (cm)</option>
                <option value="mm">Millimeters (mm)</option>
              </select>
            </div>
          </div>

          {/* Care Guidelines */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="font-semibold text-slate-700 block">
              Care &amp; Maintenance Instructions
            </label>
            <textarea
              rows={3}
              value={facts.careInstructions || ""}
              onChange={(e) => updateField("careInstructions", e.target.value)}
              placeholder="e.g. Dishwasher & microwave safe. Wash with soft cloth; avoid metal scouring pads."
              className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:border-slate-900 outline-none leading-relaxed"
            />
          </div>

          {/* Unit Cost (COGS) */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="font-semibold text-slate-700 block">
              Material &amp; Production Cost (COGS)
            </label>
            <div className="relative w-36">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">$</span>
              <input
                type="number"
                step="0.5"
                value={facts.cogs !== undefined && facts.cogs !== null ? facts.cogs : ""}
                onChange={(e) => updateField("cogs", parseFloat(e.target.value) || undefined)}
                placeholder="e.g. 12.50"
                className="w-full h-8 bg-white border border-slate-200 rounded-md pl-6 pr-2 text-xs font-mono font-bold text-slate-900 outline-none focus:border-slate-900"
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Never shared publicly. Used only to calculate your real net take-home profit.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition"
          >
            Close
          </button>

          {onApplyAndReanalyze && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onApplyAndReanalyze();
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Apply &amp; Re-optimize</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
