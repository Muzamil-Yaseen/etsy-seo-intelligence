"use client";

import React, { useState } from "react";
import {
  FileText,
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  AlertTriangle,
  Info,
  Layers,
} from "lucide-react";
import { DescriptionAnalysisResult } from "@/lib/optimizers/description-optimizer";

interface DescriptionOptimizerViewProps {
  productContext: {
    name: string;
    category: string;
    materials?: string | null;
    features?: string | null;
    personalization?: string | null;
    currentDescription?: string | null;
  };
}

export function DescriptionOptimizerView({ productContext }: DescriptionOptimizerViewProps) {
  const [productName, setProductName] = useState(productContext.name);
  const [primaryKeyword, setPrimaryKeyword] = useState("personalized leather wallet");
  const [materials, setMaterials] = useState(productContext.materials || "Full Grain Cowhide Leather, Waxed Thread");
  const [features, setFeatures] = useState(productContext.features || "6 Card Slots, Cash Sleeve, Slim Bifold Profile");
  const [personalization, setPersonalization] = useState(productContext.personalization || "Laser engraved monogram or custom text");
  const [dimensions, setDimensions] = useState("4.3\" x 3.3\" (closed)");
  const [careInstructions, setCareInstructions] = useState("Condition with natural leather balm periodically to maintain rich patina.");
  const [shippingNotes, setShippingNotes] = useState("Handmade to order. Dispatches within 1-2 business days with tracking.");

  const [result, setResult] = useState<DescriptionAnalysisResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/descriptions/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName,
          category: productContext.category,
          materials,
          features,
          personalization,
          dimensions,
          careInstructions,
          primaryKeyword,
          supportingKeywords: ["custom wallet", "leather wallet men", "anniversary gift"],
          shippingNotes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setResult(data);
      }
    } catch (err) {
      console.error("Description optimization error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.fullDescription);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  React.useEffect(() => {
    handleGenerate();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Buyer-First Description Studio</h2>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Generates a compelling, high-converting opening paragraph with natural keyword integration, structured buyer details, and zero keyword stuffing.
          </p>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 disabled:bg-neutral-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isGenerating ? "Building..." : "Generate Optimized Copy"}</span>
        </button>
      </div>

      {/* Editor & Diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Output Display & Metrics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Generated Opening Paragraph Highlight */}
          {result && (
            <div className="bg-neutral-900/40 border border-orange-500/30 rounded-xl p-5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-orange-400 uppercase tracking-wider">
                  Optimized First Paragraph (Crucial for Mobile &amp; Search Snippets)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-orange-950 text-orange-300 border border-orange-800 font-medium">
                  Natural Flow
                </span>
              </div>
              <p className="text-sm text-neutral-200 leading-relaxed font-serif italic bg-neutral-950 p-4 rounded-lg border border-neutral-800">
                &ldquo;{result.openingParagraph}&rdquo;
              </p>
            </div>
          )}

          {/* Full Structured Description */}
          {result && (
            <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Full Structured Listing Description</h3>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-3 py-1.5 rounded-lg border border-neutral-700 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied All" : "Copy Description"}</span>
                </button>
              </div>

              <textarea
                rows={14}
                readOnly
                value={result.fullDescription}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-4 text-xs text-neutral-300 font-mono focus:outline-none leading-relaxed"
              />
            </div>
          )}

          {/* Quality Meters */}
          {result && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-4 space-y-1">
                <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Keyword Match</div>
                <div className="text-2xl font-bold text-emerald-400">{Math.round(result.keywordCoverageRatio * 100)}%</div>
                <p className="text-[10px] text-neutral-400">Naturally integrated</p>
              </div>

              <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-4 space-y-1">
                <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Detail Coverage</div>
                <div className="text-2xl font-bold text-blue-400">{Math.round(result.productDetailCoverageRatio * 100)}%</div>
                <p className="text-[10px] text-neutral-400">Materials, dimensions, care</p>
              </div>

              <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-4 space-y-1">
                <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Readability</div>
                <div className="text-2xl font-bold text-orange-400">{result.readabilityScore}%</div>
                <p className="text-[10px] text-neutral-400">Flesch clarity score</p>
              </div>

              <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-4 space-y-1">
                <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Stuffing Risk</div>
                <div className={`text-2xl font-bold ${result.stuffingRiskScore > 30 ? "text-red-400" : "text-neutral-400"}`}>
                  {result.stuffingRiskScore}%
                </div>
                <p className="text-[10px] text-neutral-400">Zero dump penalty</p>
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: Product Details Input */}
        <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">Product Parameters</h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Customize the factual details used to populate the opening copy and buyer reference sections:
          </p>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-neutral-400 font-medium">Primary Keyword</label>
              <input
                type="text"
                value={primaryKeyword}
                onChange={(e) => setPrimaryKeyword(e.target.value)}
                className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white focus:outline-none focus:border-neutral-700"
              />
            </div>

            <div>
              <label className="text-neutral-400 font-medium">Materials</label>
              <input
                type="text"
                value={materials}
                onChange={(e) => setMaterials(e.target.value)}
                className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white focus:outline-none focus:border-neutral-700"
              />
            </div>

            <div>
              <label className="text-neutral-400 font-medium">Key Features</label>
              <input
                type="text"
                value={features}
                onChange={(e) => setFeatures(e.target.value)}
                className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white focus:outline-none focus:border-neutral-700"
              />
            </div>

            <div>
              <label className="text-neutral-400 font-medium">Personalization Guide</label>
              <input
                type="text"
                value={personalization}
                onChange={(e) => setPersonalization(e.target.value)}
                className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white focus:outline-none focus:border-neutral-700"
              />
            </div>

            <div>
              <label className="text-neutral-400 font-medium">Dimensions</label>
              <input
                type="text"
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
                className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white focus:outline-none focus:border-neutral-700"
              />
            </div>

            <button
              onClick={handleGenerate}
              className="w-full mt-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold py-2 rounded-lg border border-neutral-700 transition"
            >
              Re-generate Description
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
