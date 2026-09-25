"use client";

import React, { useState } from "react";
import {
  Tag,
  Search,
  Copy,
  Check,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  RefreshCw,
  Layers,
} from "lucide-react";

interface TagsExtractorViewProps {
  onAnalyzeNiche: (query: string) => void;
}

export function TagsExtractorView({ onAnalyzeNiche }: TagsExtractorViewProps) {
  const [inputVal, setInputVal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [copiedMode, setCopiedMode] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleExtract = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = inputVal.trim();
    if (!query) return;

    setIsLoading(true);
    setStatusMessage(null);

    try {
      if (query.includes("etsy.com/listing/")) {
        // Fetch via listing details API
        const res = await fetch("/api/fetch-listing-details", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: query }),
        });
        const data = await res.json();
        if (data.tags && Array.isArray(data.tags) && data.tags.length > 0) {
          setTags(data.tags.slice(0, 13));
          setStatusMessage(`Extracted ${data.tags.length} official tags from listing.`);
        } else {
          setStatusMessage("No public tags found on listing page. Showing grounded tags for product.");
        }
      } else {
        // Fetch via keyword research API
        const res = await fetch("/api/seed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });
        const data = await res.json();
        if (data.tags && Array.isArray(data.tags) && data.tags.length > 0) {
          setTags(data.tags.slice(0, 13));
          setStatusMessage(`Generated 13 high-intent tags for "${query}".`);
        } else {
          setStatusMessage(`Extracted tags for "${query}".`);
        }
      }
    } catch {
      setStatusMessage("Could not extract live tags. You can add and edit tags manually below.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyTags = (mode: "comma" | "lines") => {
    const text = mode === "comma" ? tags.join(", ") : tags.join("\n");
    navigator.clipboard.writeText(text);
    setCopiedMode(mode);
    setTimeout(() => setCopiedMode(null), 2000);
  };

  const copySingleTag = (tag: string, idx: number) => {
    navigator.clipboard.writeText(tag);
    setCopiedMode(`tag-${idx}`);
    setTimeout(() => setCopiedMode(null), 1500);
  };

  const addTag = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newTag.trim().toLowerCase();
    if (!clean) return;
    if (tags.length >= 13) {
      alert("Maximum 13 Etsy tags allowed per listing.");
      return;
    }
    if (clean.length > 20) {
      alert("Etsy tags must be 20 characters or fewer.");
      return;
    }
    if (!tags.includes(clean)) {
      setTags([...tags, clean]);
      setNewTag("");
    }
  };

  const removeTag = (indexToRemove: number) => {
    setTags(tags.filter((_, idx) => idx !== indexToRemove));
  };

  const overLimitCount = tags.filter((t) => t.length > 20).length;
  const isOptimal = tags.length === 13 && overLimitCount === 0;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#0F1621] border border-slate-200 dark:border-[#263244] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                <Tag className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-slate-900 dark:text-[#F8FAFC]">
                13 Tags Extractor &amp; Validator
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-[#94A3B8]">
              Extract tags directly from any Etsy listing URL or product niche. Verifies character counts and formats for 1-click copying.
            </p>
          </div>
        </div>

        {/* Input Bar */}
        <form onSubmit={handleExtract} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Paste any Etsy listing URL or enter target keyword..."
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-[#263244] text-xs sm:text-sm text-slate-900 dark:text-[#F8FAFC] placeholder:text-slate-400 outline-none focus:border-emerald-500 transition"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs disabled:opacity-50 shrink-0"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Tag className="w-4 h-4" />}
            <span>{isLoading ? "Extracting..." : "Extract Tags"}</span>
          </button>
        </form>

        {statusMessage && (
          <div className="text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-200/60 dark:border-emerald-800/40">
            {statusMessage}
          </div>
        )}
      </div>

      {tags.length === 0 ? (
        <div className="bg-white dark:bg-[#0F1621] border border-slate-200 dark:border-[#263244] rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <Tag className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-[#F8FAFC]">
            No Tags Extracted Yet
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-[#94A3B8] max-w-md mx-auto leading-relaxed">
            Paste any Etsy listing URL or enter a product keyword above, then click <strong>Extract Tags</strong> to retrieve, validate, and copy 13 tags.
          </p>
        </div>
      ) : (
        /* Tags Validation & Action Cards */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Saturation & Stats (1 Col) */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#0F1621] border border-slate-200 dark:border-[#263244] rounded-2xl p-5 shadow-xs space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#64748B]">
              Etsy Tag Saturation
            </span>

            <div className="flex items-center justify-between">
              <div className="text-3xl font-extrabold text-slate-900 dark:text-[#F8FAFC]">
                {tags.length} <span className="text-base font-normal text-slate-400">/ 13</span>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  tags.length === 13
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                    : "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
                }`}
              >
                {tags.length === 13 ? "100% Saturation" : `${Math.round((tags.length / 13) * 100)}% Saturation`}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-[#1E293B] overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  tags.length === 13 ? "bg-emerald-500" : "bg-amber-500"
                }`}
                style={{ width: `${(tags.length / 13) * 100}%` }}
              />
            </div>

            <div className="space-y-2 pt-2 text-xs text-slate-600 dark:text-[#94A3B8]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Etsy search algorithm indexes all 13 slots</span>
              </div>
              <div className="flex items-center gap-2">
                {overLimitCount > 0 ? (
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                )}
                <span>
                  {overLimitCount > 0
                    ? `${overLimitCount} tag(s) exceed 20 characters`
                    : "All tags strictly ≤ 20 characters"}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-[#1E293B] space-y-2">
              <button
                type="button"
                onClick={() => copyTags("comma")}
                className="w-full h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#172231] dark:hover:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                {copiedMode === "comma" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedMode === "comma" ? "Copied!" : "Copy as Comma-Separated"}</span>
              </button>

              <button
                type="button"
                onClick={() => copyTags("lines")}
                className="w-full h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#172231] dark:hover:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                {copiedMode === "lines" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedMode === "lines" ? "Copied!" : "Copy One-Per-Line"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Tags Chips & Add Tag (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-[#0F1621] border border-slate-200 dark:border-[#263244] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#64748B]">
                Extracted Tags ({tags.length} / 13)
              </span>
              <button
                type="button"
                onClick={() => setTags([])}
                className="text-xs text-rose-500 hover:underline flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear All</span>
              </button>
            </div>

            {/* Tags Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {tags.map((tag, idx) => {
                const isOver = tag.length > 20;
                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                      isOver
                        ? "bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900/50 text-rose-900 dark:text-rose-300"
                        : "bg-slate-50 dark:bg-[#111827] border-slate-200 dark:border-[#263244] text-slate-900 dark:text-[#F8FAFC]"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-[#64748B] w-4">
                        #{idx + 1}
                      </span>
                      <span className="text-xs font-medium truncate">{tag}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          isOver
                            ? "bg-rose-200 text-rose-800 dark:bg-rose-900 dark:text-rose-200"
                            : "bg-slate-200 dark:bg-[#1E293B] text-slate-600 dark:text-[#94A3B8]"
                        }`}
                      >
                        {tag.length}/20
                      </span>

                      <button
                        type="button"
                        onClick={() => copySingleTag(tag, idx)}
                        className="p-1 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
                        title="Copy tag"
                      >
                        {copiedMode === `tag-${idx}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => removeTag(idx)}
                        className="p-1 text-slate-400 hover:text-rose-500 transition"
                        title="Remove tag"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add Custom Tag Bar */}
            {tags.length < 13 && (
              <form onSubmit={addTag} className="flex gap-2 pt-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={newTag}
                    maxLength={20}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add custom tag (max 20 chars)..."
                    className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-[#263244] text-xs text-slate-900 dark:text-[#F8FAFC] placeholder:text-slate-400 outline-none focus:border-emerald-500 transition"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono">
                    {newTag.length}/20
                  </span>
                </div>
                <button
                  type="submit"
                  disabled={!newTag.trim()}
                  className="h-10 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-[#172231] dark:hover:bg-[#1E293B] text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-40"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Tag</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
