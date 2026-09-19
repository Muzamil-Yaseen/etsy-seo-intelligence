"use client";

import React, { useState } from "react";
import {
  Type,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Info,
  ShieldCheck,
  Layers,
} from "lucide-react";
import { TitleValidationResult } from "@/lib/optimizers/title-optimizer";

interface TitleOptimizerViewProps {
  initialTitle: string;
  productContext: {
    name: string;
    category: string;
    materials?: string | null;
    features?: string | null;
    personalization?: string | null;
    recipient?: string | null;
  };
}

export function TitleOptimizerView({ initialTitle, productContext }: TitleOptimizerViewProps) {
  const [currentTitle, setCurrentTitle] = useState(initialTitle);
  const [validation, setValidation] = useState<TitleValidationResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // Form states for title generator
  const [productNoun, setProductNoun] = useState("Bifold Wallet");
  const [primaryMaterial, setPrimaryMaterial] = useState("Full Grain Leather");
  const [personalizationType, setPersonalizationType] = useState("Initial Engraving");
  const [definingFeature, setDefiningFeature] = useState("Slim Card Slots");
  const [recipient, setRecipient] = useState("Men");

  const runValidation = async (titleToTest: string) => {
    setIsValidating(true);
    try {
      const res = await fetch("/api/titles/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titleToValidate: titleToTest,
          primaryKeyword: "Personalized Leather Wallet",
          productNoun,
        }),
      });
      const data = await res.json();
      if (data.success && data.validation) {
        setValidation(data.validation);
      }
    } catch (err) {
      console.error("Validation error:", err);
    } finally {
      setIsValidating(false);
    }
  };

  const handleGenerateTitle = async () => {
    try {
      const res = await fetch("/api/titles/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generateInput: {
            productNoun,
            primaryMaterial,
            personalizationType,
            definingFeature,
            recipient,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.generatedTitle) {
          setCurrentTitle(data.generatedTitle);
        }
        if (data.validation) {
          setValidation(data.validation);
        }
      }
    } catch (err) {
      console.error("Generation error:", err);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentTitle);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  React.useEffect(() => {
    runValidation(currentTitle);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Type className="w-5 h-5 text-orange-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">2026 Etsy Title Studio &amp; Validator</h2>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Build clean, high-conversion titles that prioritize human readability, front-load objective traits, and eliminate keyword stuffing penalties.
          </p>
        </div>

        <button
          onClick={handleGenerateTitle}
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Auto-Generate Compliant Title</span>
        </button>
      </div>

      {/* Title Editor & Live Diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Title Editor & Metrics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Title Input Area */}
          <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-white">Listing Title</label>
              <div className="flex items-center gap-3 text-xs">
                <span className={currentTitle.length > 140 ? "text-red-400 font-bold" : "text-neutral-400"}>
                  {currentTitle.length}/140 chars
                </span>
                <span className="text-neutral-600">•</span>
                <span className={validation && !validation.isUnderWordGuideline ? "text-amber-400" : "text-neutral-400"}>
                  {currentTitle.split(/\s+/).filter(Boolean).length} words (&lt;15 recommended)
                </span>
              </div>
            </div>

            <textarea
              rows={3}
              value={currentTitle}
              onChange={(e) => {
                setCurrentTitle(e.target.value);
                runValidation(e.target.value);
              }}
              placeholder="Enter or generate title..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-orange-500 transition leading-relaxed"
            />

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-3 py-1.5 rounded-lg border border-neutral-700 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied Title" : "Copy Title"}</span>
              </button>

              <button
                onClick={() => runValidation(currentTitle)}
                className="text-xs text-orange-400 hover:text-orange-300 transition"
              >
                Re-validate Rules
              </button>
            </div>
          </div>

          {/* Diagnostic Scores Meter Grid */}
          {validation && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-4 space-y-1">
                <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Title Quality</div>
                <div className="text-2xl font-bold text-orange-400">{validation.titleQualityScore}%</div>
                <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-orange-500 h-full" style={{ width: `${validation.titleQualityScore}%` }} />
                </div>
              </div>

              <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-4 space-y-1">
                <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Guideline Score</div>
                <div className="text-2xl font-bold text-emerald-400">{validation.guidelineComplianceScore}%</div>
                <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full" style={{ width: `${validation.guidelineComplianceScore}%` }} />
                </div>
              </div>

              <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-4 space-y-1">
                <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Readability</div>
                <div className="text-2xl font-bold text-blue-400">{validation.readabilityScore}%</div>
                <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full" style={{ width: `${validation.readabilityScore}%` }} />
                </div>
              </div>

              <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-4 space-y-1">
                <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Stuffing Risk</div>
                <div className={`text-2xl font-bold ${validation.stuffingRiskScore > 30 ? "text-red-400" : "text-neutral-400"}`}>
                  {validation.stuffingRiskScore}%
                </div>
                <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                  <div className={`h-full ${validation.stuffingRiskScore > 30 ? "bg-red-500" : "bg-neutral-600"}`} style={{ width: `${validation.stuffingRiskScore}%` }} />
                </div>
              </div>
            </div>
          )}

          {/* Warnings & Recommendations */}
          {validation && (
            <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-white">Etsy Compliance Analysis</h3>

              {validation.warnings.length > 0 && (
                <div className="p-3.5 bg-red-950/30 border border-red-800/80 rounded-lg text-xs text-red-300 space-y-1.5">
                  <div className="font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span>Areas for Improvement</span>
                  </div>
                  {validation.warnings.map((w, idx) => (
                    <div key={idx}>• {w}</div>
                  ))}
                </div>
              )}

              {validation.recommendations.length > 0 && (
                <div className="p-3.5 bg-neutral-950 rounded-lg border border-neutral-800 text-xs text-neutral-300 space-y-1.5">
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Recommendations</span>
                  </div>
                  {validation.recommendations.map((r, idx) => (
                    <div key={idx}>• {r}</div>
                  ))}
                </div>
              )}

              {validation.repeatedWords.length > 0 && (
                <div className="text-xs text-neutral-400">
                  <span>Repeated Words in Title: </span>
                  <span className="text-orange-400 font-mono font-semibold">
                    {validation.repeatedWords.join(", ")}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right 1 Col: Title Generator Parameters */}
        <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-orange-400" />
            <h3 className="text-sm font-semibold text-white">Generator Parameters</h3>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Constructs a natural, scannable title by ordering product traits in alignment with Etsy search recommendations:
          </p>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-neutral-400 font-medium">Core Product Noun</label>
              <input
                type="text"
                value={productNoun}
                onChange={(e) => setProductNoun(e.target.value)}
                className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white focus:outline-none focus:border-neutral-700"
              />
            </div>

            <div>
              <label className="text-neutral-400 font-medium">Primary Material</label>
              <input
                type="text"
                value={primaryMaterial}
                onChange={(e) => setPrimaryMaterial(e.target.value)}
                className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white focus:outline-none focus:border-neutral-700"
              />
            </div>

            <div>
              <label className="text-neutral-400 font-medium">Personalization Specifier</label>
              <input
                type="text"
                value={personalizationType}
                onChange={(e) => setPersonalizationType(e.target.value)}
                className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white focus:outline-none focus:border-neutral-700"
              />
            </div>

            <div>
              <label className="text-neutral-400 font-medium">Defining Feature</label>
              <input
                type="text"
                value={definingFeature}
                onChange={(e) => setDefiningFeature(e.target.value)}
                className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white focus:outline-none focus:border-neutral-700"
              />
            </div>

            <div>
              <label className="text-neutral-400 font-medium">Essential Recipient</label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white focus:outline-none focus:border-neutral-700"
              />
            </div>

            <button
              onClick={handleGenerateTitle}
              className="w-full mt-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold py-2 rounded-lg border border-neutral-700 transition"
            >
              Update Generated Title
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
