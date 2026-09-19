"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Tag,
  Copy,
  Check,
  Download,
  X,
  History,
  Lock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Camera,
  Layers,
  ArrowRight,
  Filter,
  CheckCircle2,
  Store,
  Info,
  ShieldCheck,
  AlertCircle,
  Database,
  HelpCircle,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { AccessGate, lockApp } from "@/components/access-gate";
import {
  HistoryDrawer,
  saveListingToHistory,
  getSavedListings,
  SavedListing,
} from "@/components/history-drawer";
import { PricingCalculator } from "@/components/pricing-calculator";
import { ProductFactsDrawer } from "@/components/product-facts-drawer";
import { DataDetailsDrawer } from "@/components/data-details-drawer";
import { Header, NavItem } from "@/components/header";
import { ProductFacts } from "@/lib/product-facts/types";

// Clean example presets
const PRESETS = [
  {
    name: "Ceramic Mugs",
    description: "Wheel-thrown stoneware coffee mugs",
    query: "handmade ceramic coffee mug",
  },
  {
    name: "Leather Wallets",
    description: "Full-grain leather bifold wallets",
    query: "personalized leather wallet",
  },
  {
    name: "Silver Jewelry",
    description: "925 sterling silver birth flower necklaces",
    query: "sterling silver birth flower necklace",
  },
  {
    name: "Wood Cutting Boards",
    description: "End-grain walnut charcuterie boards",
    query: "personalized walnut cutting board",
  },
];

type MainTab = "overview" | "keywords" | "competitors" | "listing" | "pricing" | "photos";
type ListingSubTab = "titles" | "description" | "faqs";
type ApplicationMode = "research" | "optimize";

export function QuickUserView() {
  // Mode State: Mode A (Research) vs Mode B (Optimize)
  const [appMode, setAppMode] = useState<ApplicationMode>("research");

  // Navigation & View State
  const [activeTab, setActiveTab] = useState<MainTab>("overview");
  const [listingSubTab, setListingSubTab] = useState<ListingSubTab>("titles");

  // Search Input State
  const [searchQuery, setSearchQuery] = useState("");
  const [showManualUrls, setShowManualUrls] = useState(false);
  const [manualUrls, setManualUrls] = useState(["", "", ""]);
  const [manualPrices, setManualPrices] = useState(["", "", ""]);

  // Product Facts State (Starts clean and unpolluted; no hardcoded state)
  const [productFacts, setProductFacts] = useState<Partial<ProductFacts>>({});
  const [sessionAnalysisId, setSessionAnalysisId] = useState<string | null>(null);

  // Drawers
  const [isFactsDrawerOpen, setIsFactsDrawerOpen] = useState(false);
  const [isDataDetailsOpen, setIsDataDetailsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  // Loading & Results
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [apiNotice, setApiNotice] = useState<string | null>(null);

  // Editable Workspace State
  const [editedTitle, setEditedTitle] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTags, setEditedTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState("");
  const [tagInputError, setTagInputError] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [photoChecks, setPhotoChecks] = useState<{ [key: number]: boolean }>({});

  // Copy Feedback States
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Keywords Tab Filters
  const [kwSearch, setKwSearch] = useState("");
  const [kwSourceFilter, setKwSourceFilter] = useState<"all" | "observed" | "suggested">("all");
  const [kwSortField, setKwSortField] = useState<"relevance" | "presence">("presence");
  const [kwSortAsc, setKwSortAsc] = useState(false);

  const tabsContainerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSavedCount(getSavedListings().length);
  }, []);

  // Smoothly keep active content tab in view on mobile
  useEffect(() => {
    if (!tabsContainerRef.current) return;
    const activeBtn = tabsContainerRef.current.querySelector<HTMLElement>('[data-active="true"]');
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [activeTab]);

  const triggerCopy = (key: string, text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Reset all state for clean isolated session
  const handleResetSession = () => {
    setResults(null);
    setSearchQuery("");
    setErrorMsg("");
    setApiNotice(null);
    setShowManualUrls(false);
    setManualUrls(["", "", ""]);
    setManualPrices(["", "", ""]);
    setEditedTitle("");
    setEditedTags([]);
    setEditedDescription("");
    setPhotoChecks({});
    setProductFacts({});
    setSessionAnalysisId(null);
    setIsFactsDrawerOpen(false);
    setIsDataDetailsOpen(false);
  };

  // Map activeTab to header NavItem
  const activeNav: NavItem = useMemo(() => {
    if (!results) return "research";
    if (activeTab === "overview") return "research";
    if (activeTab === "keywords") return "keywords";
    if (activeTab === "competitors") return "competitors";
    if (activeTab === "listing") return "listing";
    if (activeTab === "pricing") return "pricing";
    return "research";
  }, [results, activeTab]);

  const handleSelectNav = (item: NavItem) => {
    if (item === "research") {
      if (!results) {
        setAppMode("research");
      } else {
        setActiveTab("overview");
      }
    } else {
      setActiveTab(item as MainTab);
    }
  };

  const handleNewAnalysis = () => {
    handleResetSession();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Run Market Analysis / Optimization with 1-click execution & clean session isolation
  const handleAnalyze = async (e?: React.FormEvent, overrideQuery?: string) => {
    if (e) e.preventDefault();
    const cleanQuery = (overrideQuery !== undefined ? overrideQuery : searchQuery).trim();
    if (!cleanQuery) return;

    setIsLoading(true);
    setErrorMsg("");
    setApiNotice(null);

    // Clear previous results to guarantee zero cross-analysis state leakage
    setResults(null);
    const newSessionId = `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setSessionAnalysisId(newSessionId);

    // Reset previous product facts if running research mode to avoid any cross-product contamination
    if (appMode === "research") {
      setProductFacts({});
    }

    try {
      let fetchedCompetitorListings: any[] = [];
      const validManualUrls = manualUrls.filter((u) => u.trim().length > 0);

      // Attempt background competitor retrieval if no manual URLs were explicitly provided
      if (validManualUrls.length === 0) {
        try {
          const autoRes = await fetch("/api/auto-fetch-competitors", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ keyword: cleanQuery, limit: 25 }),
          });
          const autoData = await autoRes.json();

          if (autoData.success && Array.isArray(autoData.data?.competitors) && autoData.data.competitors.length > 0) {
            fetchedCompetitorListings = autoData.data.competitors;
          }
        } catch {
          // Graceful fallback to 0 listings; quick-optimize processes cleanly without blocking
        }
      }

      // Call quick-optimize engine with strict provenance and session isolation
      const res = await fetch("/api/quick-optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: appMode,
          queryOrUrl: cleanQuery,
          productFacts: appMode === "optimize" ? productFacts : undefined,
          competitorListings: fetchedCompetitorListings.length > 0 ? fetchedCompetitorListings : undefined,
          competitorUrls: validManualUrls.length > 0 ? validManualUrls : undefined,
          manualPrices: manualPrices.filter(Boolean),
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Analysis could not be completed.");
      }

      setResults(data);
      setEditedTitle(data.title?.text || "");
      setEditedTags(data.tags?.list || []);
      setEditedDescription(data.description?.fullDescription || "");
      setActiveTab("overview");
      setPhotoChecks({});
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to analyze market. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Apply Preset & Auto-Analyze for 1-click exploration
  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    handleResetSession();
    setSearchQuery(preset.query);
    handleAnalyze(undefined, preset.query);
  };

  // Tag editing functions
  const handleRemoveTag = (indexToRemove: number) => {
    setEditedTags((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newTagInput.trim().toLowerCase();
    if (!clean) return;
    if (clean.length > 20) {
      setTagInputError("Etsy tags must be 20 characters or fewer.");
      return;
    }
    if (editedTags.includes(clean)) {
      setTagInputError("Tag already in list.");
      return;
    }
    if (editedTags.length >= 13) {
      setTagInputError("Maximum 13 Etsy tags reached.");
      return;
    }
    setEditedTags((prev) => [...prev, clean]);
    setNewTagInput("");
    setTagInputError("");
  };

  // Save to history
  const handleSaveToHistory = () => {
    if (!results) return;
    saveListingToHistory({
      mainBroadPhrase: results.mainBroadPhrase || searchQuery,
      productNoun: results.productNoun || "Product",
      title: editedTitle || results.title?.text || "",
      category: results.category || "Handmade Products",
      tags: editedTags,
      description: editedDescription,
      urls: {
        u1: manualUrls[0] || "",
        u2: manualUrls[1] || "",
        u3: manualUrls[2] || "",
      },
      prices: {
        p1: manualPrices[0],
        p2: manualPrices[1],
        p3: manualPrices[2],
      },
    });
    setSavedCount(getSavedListings().length);
    triggerCopy("save", "saved");
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!results) return;
    const rows = [
      ["Type", "Content"],
      ["Primary Keyword", results.mainBroadPhrase || searchQuery],
      ["Title", `"${(editedTitle || results.title?.text || "").replace(/"/g, '""')}"`],
      ["Tags (13)", `"${editedTags.join(", ")}"`],
      ["Description", `"${(editedDescription || "").replace(/"/g, '""')}"`],
      ["Care Instructions", `"${(results.description?.careInstructions || "").replace(/"/g, '""')}"`],
      ["Readiness Summary", results.readinessReport?.summary || "N/A"],
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `etsy-listing-${(results.mainBroadPhrase || "export").replace(/\s+/g, "-")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered & Sorted Keywords (Factual, no fake demand/competition columns)
  const processedKeywords = useMemo(() => {
    if (!results?.topKeywords) return [];
    let list = [...results.topKeywords];

    if (kwSearch.trim()) {
      const q = kwSearch.toLowerCase();
      list = list.filter((k) => k.keyword?.toLowerCase().includes(q));
    }

    if (kwSourceFilter === "observed") {
      list = list.filter((k) => k.source === "observed");
    } else if (kwSourceFilter === "suggested") {
      list = list.filter((k) => k.source === "suggested");
    }

    list.sort((a, b) => {
      let valA = 0;
      let valB = 0;
      if (kwSortField === "presence") {
        valA = a.competitorCount || 0;
        valB = b.competitorCount || 0;
      } else if (kwSortField === "relevance") {
        valA = a.relevanceScore || 0;
        valB = b.relevanceScore || 0;
      }
      return kwSortAsc ? valA - valB : valB - valA;
    });

    return list;
  }, [results, kwSearch, kwSourceFilter, kwSortField, kwSortAsc]);

  // Research Coverage Factual Counts
  const researchCoverage = useMemo(() => {
    const compCount = results?.competitorsAnalyzed?.length || 0;
    const priceCount = results?.priceQuartiles?.sampleSize || 0;
    const kwCount = results?.topKeywords?.length || 0;
    const factsCount = Object.keys(productFacts).length;

    return {
      competitors: {
        count: compCount,
        status: compCount >= 5 ? "Sufficient" : compCount > 0 ? "Limited sample" : "Unavailable",
        color: compCount >= 5 ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-slate-600 bg-slate-100 border-slate-200",
      },
      pricing: {
        count: priceCount,
        status: priceCount >= 5 ? "Sufficient" : "Insufficient (< 5)",
        color: priceCount >= 5 ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-amber-700 bg-amber-50 border-amber-200",
      },
      keywords: {
        count: kwCount,
        status: kwCount > 0 ? `${kwCount} candidates` : "None",
        color: kwCount > 0 ? "text-blue-700 bg-blue-50 border-blue-200" : "text-slate-600 bg-slate-100 border-slate-200",
      },
      facts: {
        count: factsCount,
        status: factsCount >= 3 ? `${factsCount} confirmed` : "Default / Inferred",
        color: factsCount >= 3 ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-slate-600 bg-slate-100 border-slate-200",
      },
    };
  }, [results, productFacts]);

  return (
    <AccessGate>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased overflow-x-hidden w-full">
        {/* Premium Floating Glass Header */}
        <Header
          activeNav={activeNav}
          onSelectNav={handleSelectNav}
          onNewAnalysis={handleNewAnalysis}
          onOpenHistory={() => setIsHistoryOpen(true)}
          savedCount={savedCount}
          onOpenFacts={() => setIsFactsDrawerOpen(true)}
        />

        {/* Main Body */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-3 sm:pt-6 pb-28 sm:pb-8 space-y-6">
          {/* SEARCH WORKSPACE: Shown when no results */}
          {!results && (
            <div className="max-w-2xl mx-auto py-8 sm:py-12 space-y-8">
              <div className="text-center space-y-3">
                {/* Segmented Mode Selector */}
                <div className="inline-flex p-1 bg-slate-200/80 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setAppMode("research")}
                    className={`px-4 py-1.5 rounded-lg transition cursor-pointer ${
                      appMode === "research"
                        ? "bg-white text-slate-900 shadow-xs font-bold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Market Research
                  </button>
                  <button
                    type="button"
                    onClick={() => setAppMode("optimize")}
                    className={`px-4 py-1.5 rounded-lg transition cursor-pointer ${
                      appMode === "optimize"
                        ? "bg-white text-slate-900 shadow-xs font-bold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Listing Optimization
                  </button>
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  {appMode === "research"
                    ? "Etsy Market & Competitor Research"
                    : "Listing Optimization & Search Grounding"}
                </h1>
                <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                  {appMode === "research"
                    ? "Inspect real competitor listings, market price quartiles, and tag overlap without assuming your product features."
                    : "Combine confirmed product facts with live competitor patterns to generate compliant titles, 13 tags, and pricing plans."}
                </p>
              </div>

              {/* Main Search Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
                <form onSubmit={handleAnalyze} className="space-y-4">
                  {/* Primary Product Query */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                      Target Search Keyword or Product Niche
                    </label>
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="e.g. ceramic matcha bowl, leather wallet, digital planner..."
                        className="w-full h-11 bg-white border border-slate-200 rounded-lg pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Optional Competitor Benchmarking URLs (Progressive Disclosure) */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowManualUrls(!showManualUrls)}
                      className="text-xs font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <span className="text-slate-400 font-mono text-sm leading-none">{showManualUrls ? "−" : "+"}</span>
                      <span>Add competitor URLs to benchmark (optional)</span>
                    </button>

                    {showManualUrls && (
                      <div className="space-y-2.5 pt-3 mt-2 border-t border-slate-100">
                        <p className="text-[11px] text-slate-500">
                          Paste up to 3 live Etsy listing URLs to directly compare keywords and pricing against:
                        </p>
                        {[0, 1, 2].map((idx) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <input
                              type="url"
                              value={manualUrls[idx]}
                              onChange={(e) => {
                                const copy = [...manualUrls];
                                copy[idx] = e.target.value;
                                setManualUrls(copy);
                              }}
                              placeholder={`Competitor #${idx + 1} Etsy URL (e.g. https://www.etsy.com/listing/...)`}
                              className="flex-1 h-9 bg-white border border-slate-200 rounded-lg px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 outline-none"
                            />
                            <div className="relative w-24">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">$</span>
                              <input
                                type="number"
                                step="0.5"
                                value={manualPrices[idx]}
                                onChange={(e) => {
                                  const copy = [...manualPrices];
                                  copy[idx] = e.target.value;
                                  setManualPrices(copy);
                                }}
                                placeholder="Price"
                                className="w-full h-9 bg-white border border-slate-200 rounded-lg pl-6 pr-2 text-xs font-mono text-slate-900 focus:border-slate-900 outline-none"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {apiNotice && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>{apiNotice}</span>
                    </div>
                  )}

                  {errorMsg && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                      {errorMsg}
                    </div>
                  )}

                  {/* Primary CTA */}
                  <button
                    type="submit"
                    disabled={isLoading || !searchQuery.trim()}
                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-sm rounded-lg transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Gathering marketplace evidence...</span>
                      </>
                    ) : (
                      <>
                        <span>{appMode === "research" ? "Analyze Market" : "Optimize Listing"}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Clean Presets */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block text-center">
                  Select a category example
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="p-3 bg-white border border-slate-200 rounded-lg text-left hover:border-slate-400 transition shadow-2xs group cursor-pointer"
                    >
                      <div className="font-semibold text-xs text-slate-900 group-hover:text-emerald-700">
                        {preset.name}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {preset.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ANALYSIS RESULTS WORKSPACE */}
          {results && (
            <div className="space-y-6">
              {/* Project Header Bar */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight capitalize">
                      {results.mainBroadPhrase || searchQuery}
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {results.category || "Handmade Products"}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {results.mode === "research" ? "Mode A: Market Research" : "Mode B: Listing Optimization"}
                    </span>
                  </div>

                  {/* Factual Research Status */}
                  <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap pt-0.5">
                    <span className="font-mono font-medium text-slate-700">
                      {results.competitorsAnalyzed?.length || 0} listings retrieved
                    </span>
                    <span>•</span>
                    <span>{results.topKeywords?.length || 0} keywords found</span>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setIsDataDetailsOpen(true)}
                      className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 ml-1 cursor-pointer"
                    >
                      <Database className="w-3.5 h-3.5" />
                      <span>Data sources</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFactsDrawerOpen(true)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Product Facts</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="px-3.5 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>Export CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveToHistory}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                  >
                    {copiedKey === "save" ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Saved</span>
                      </>
                    ) : (
                      <span>Save analysis</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Permanent Results Navigation */}
              <div className="w-full max-w-full overflow-hidden border-b border-slate-200">
                <div
                  ref={tabsContainerRef}
                  className="flex items-center gap-4 sm:gap-5 overflow-x-auto whitespace-nowrap px-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                >
                  {[
                    { id: "overview", label: "Overview" },
                    { id: "keywords", label: "Keywords" },
                    { id: "competitors", label: "Competitors" },
                    { id: "listing", label: "Listing" },
                    { id: "pricing", label: "Pricing" },
                    { id: "photos", label: "Photos & Media" },
                  ].map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        data-active={isActive ? "true" : "false"}
                        onClick={() => setActiveTab(tab.id as MainTab)}
                        className={`py-3 px-1 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          isActive
                            ? "border-emerald-600 text-emerald-700 font-semibold"
                            : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* TAB 1: OVERVIEW */}
              {activeTab === "overview" && (
                <div className="space-y-5">
                  {/* Factual Research Coverage Breakdown */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Research Coverage Status
                      </h2>
                      <button
                        type="button"
                        onClick={() => setIsDataDetailsOpen(true)}
                        className="text-[11px] text-slate-400 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
                      >
                        <Info className="w-3 h-3" />
                        <span>Data sources</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                        <span className="text-slate-500 block text-[11px]">Competitors</span>
                        <div className="font-mono font-bold text-slate-900">
                          {results.competitorsAnalyzed?.length || 0} listings
                        </div>
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border ${researchCoverage.competitors.color}`}>
                          {researchCoverage.competitors.status}
                        </span>
                      </div>

                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                        <span className="text-slate-500 block text-[11px]">Pricing Benchmarks</span>
                        <div className="font-mono font-bold text-slate-900">
                          {results.priceQuartiles?.sampleSize || 0} valid prices
                        </div>
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border ${researchCoverage.pricing.color}`}>
                          {researchCoverage.pricing.status}
                        </span>
                      </div>

                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                        <span className="text-slate-500 block text-[11px]">Keyword Pool</span>
                        <div className="font-mono font-bold text-slate-900">
                          {results.topKeywords?.length || 0} candidates
                        </div>
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border bg-blue-50 text-blue-700 border-blue-200">
                          Available
                        </span>
                      </div>

                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                        <span className="text-slate-500 block text-[11px]">Product Facts</span>
                        <div className="font-mono font-bold text-slate-900">
                          {Object.keys(productFacts).length} fields provided
                        </div>
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border ${researchCoverage.facts.color}`}>
                          {researchCoverage.facts.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 12-Point 3-State Listing Readiness Audit */}
                  {results.readinessReport && (
                    <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                              Listing Readiness Audit
                            </h2>
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-bold ${
                                results.readinessReport.overallStatus === "ready"
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                  : results.readinessReport.overallStatus === "needs_attention"
                                  ? "bg-blue-50 text-blue-800 border border-blue-200"
                                  : "bg-amber-50 text-amber-800 border border-amber-200"
                              }`}
                            >
                              {results.readinessReport.summary}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Deterministic checks evaluating search compliance, completeness, and market alignment.
                          </p>
                        </div>
                      </div>

                      {/* 3-State Checklist Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {results.readinessReport.checks.map((check: any) => (
                          <div
                            key={check.id}
                            className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 transition ${
                              check.status === "complete"
                                ? "bg-slate-50/50 border-slate-200 text-slate-800"
                                : check.status === "cannot_evaluate"
                                ? "bg-slate-100/70 border-slate-200 text-slate-600"
                                : "bg-amber-50/40 border-amber-200 text-amber-900"
                            }`}
                          >
                            <div className="mt-0.5 shrink-0">
                              {check.status === "complete" ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              ) : check.status === "cannot_evaluate" ? (
                                <HelpCircle className="w-4 h-4 text-slate-400" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-amber-600" />
                              )}
                            </div>
                            <div className="space-y-0.5 flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold block">{check.label}</span>
                                <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded capitalize ${
                                  check.status === "complete"
                                    ? "text-emerald-700 bg-emerald-50"
                                    : check.status === "cannot_evaluate"
                                    ? "text-slate-500 bg-slate-200"
                                    : "text-amber-700 bg-amber-100"
                                }`}>
                                  {check.status.replace("_", " ")}
                                </span>
                              </div>
                              {check.recommendation && (
                                <p className="text-[11px] text-slate-500 leading-tight">
                                  {check.recommendation}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommended Title */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                          Recommended Title
                        </h2>
                        <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Optimized for Etsy search
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-mono font-medium ${
                          editedTitle.length > 140 ? "text-rose-600 font-bold" : "text-slate-500"
                        }`}>
                          {editedTitle.length} / 140
                        </span>
                        <button
                          type="button"
                          onClick={() => triggerCopy("title", editedTitle)}
                          className="p-1.5 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                          title="Copy title"
                        >
                          {copiedKey === "title" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {isEditingTitle ? (
                      <div className="space-y-2">
                        <textarea
                          value={editedTitle}
                          onChange={(e) => setEditedTitle(e.target.value)}
                          rows={2}
                          className="w-full p-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-slate-900"
                        />
                        <button
                          type="button"
                          onClick={() => setIsEditingTitle(false)}
                          className="px-3 py-1 bg-slate-900 text-white text-xs font-medium rounded-md cursor-pointer"
                        >
                          Done editing
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => setIsEditingTitle(true)}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 font-medium cursor-pointer hover:border-slate-400 transition"
                      >
                        {editedTitle}
                      </div>
                    )}
                  </div>

                  {/* 13 Recommended Tags as Interactive Chips */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                          13 Etsy Tags
                        </h2>
                        <p className="text-xs text-slate-500">
                          Click × to remove or type below to customize.
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-mono font-semibold ${
                          editedTags.length === 13 ? "text-emerald-700" : "text-amber-700"
                        }`}>
                          {editedTags.length} / 13 used ({13 - editedTags.length} remaining)
                        </span>
                        <button
                          type="button"
                          onClick={() => triggerCopy("tags", editedTags.join(", "))}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                        >
                          {copiedKey === "tags" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>Copy all tags</span>
                        </button>
                      </div>
                    </div>

                    {/* Interactive Tag Chips */}
                    <div className="flex flex-wrap gap-2">
                      {editedTags.map((tag, idx) => {
                        const isNearLimit = tag.length >= 19;
                        return (
                          <div
                            key={idx}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
                              isNearLimit
                                ? "bg-amber-50 text-amber-900 border-amber-300"
                                : "bg-slate-50 text-slate-800 border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <span>{tag}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({tag.length}/20)
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(idx)}
                              className="text-slate-400 hover:text-rose-600 transition cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Add Tag Input */}
                    {editedTags.length < 13 && (
                      <form onSubmit={handleAddTag} className="flex gap-2 items-center pt-2">
                        <input
                          type="text"
                          value={newTagInput}
                          onChange={(e) => setNewTagInput(e.target.value)}
                          maxLength={20}
                          placeholder="Add custom tag (max 20 chars)..."
                          className="w-64 h-9 bg-white border border-slate-200 rounded-lg px-3 text-xs text-slate-900 focus:border-slate-900 outline-none"
                        />
                        <button
                          type="submit"
                          className="h-9 px-3 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition cursor-pointer"
                        >
                          Add tag
                        </button>
                        {tagInputError && (
                          <span className="text-xs text-rose-600">{tagInputError}</span>
                        )}
                      </form>
                    )}
                  </div>

                  {/* 3 Important Actions */}
                  <div className="bg-slate-900 text-white rounded-xl p-5 sm:p-6 space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      3 Recommended Next Actions
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                      <div className="p-3.5 rounded-lg bg-slate-800/80 border border-slate-700/60 space-y-1">
                        <span className="text-xs font-bold text-emerald-400 block">1. Front-Load Physical Traits</span>
                        <p className="text-xs text-slate-300">
                          Lead with the exact product noun and primary material within the first 45 characters.
                        </p>
                      </div>
                      <div className="p-3.5 rounded-lg bg-slate-800/80 border border-slate-700/60 space-y-1">
                        <span className="text-xs font-bold text-emerald-400 block">2. Fill All 13 Tag Slots</span>
                        <p className="text-xs text-slate-300">
                          Ensure all 13 slots use diverse 2–3 word phrases under 20 characters to capture long-tail searches.
                        </p>
                      </div>
                      <div className="p-3.5 rounded-lg bg-slate-800/80 border border-slate-700/60 space-y-1">
                        <span className="text-xs font-bold text-emerald-400 block">3. Benchmark Production Costs</span>
                        <p className="text-xs text-slate-300">
                          Enter your material costs in the Pricing tab to compute your true take-home payout after Etsy commission.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: KEYWORDS (Factual, Observed vs Suggested) */}
              {activeTab === "keywords" && (
                <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        Keyword Research
                      </h2>
                      <p className="text-xs text-slate-500">
                        Distinguishing phrases observed directly in competing listings from AI semantic expansions.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={kwSearch}
                          onChange={(e) => setKwSearch(e.target.value)}
                          placeholder="Filter keywords..."
                          className="h-8 pl-8 pr-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 outline-none focus:border-slate-900"
                        />
                      </div>

                      <select
                        value={kwSourceFilter}
                        onChange={(e: any) => setKwSourceFilter(e.target.value)}
                        className="h-8 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 outline-none"
                      >
                        <option value="all">All Keywords</option>
                        <option value="observed">Observed in Competitors</option>
                        <option value="suggested">AI Suggestions</option>
                      </select>
                    </div>
                  </div>

                  {/* Factual Keywords Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                          <th className="pb-3 pr-4">Keyword</th>
                          <th className="pb-3 px-3">Type</th>
                          <th className="pb-3 px-3 cursor-pointer" onClick={() => { setKwSortField("presence"); setKwSortAsc(!kwSortAsc); }}>
                            Market Presence {kwSortField === "presence" ? (kwSortAsc ? "↑" : "↓") : ""}
                          </th>
                          <th className="pb-3 px-3">In Titles</th>
                          <th className="pb-3 px-3">In Tags</th>
                          <th className="pb-3 px-3 cursor-pointer" onClick={() => { setKwSortField("relevance"); setKwSortAsc(!kwSortAsc); }}>
                            Relevance {kwSortField === "relevance" ? (kwSortAsc ? "↑" : "↓") : ""}
                          </th>
                          <th className="pb-3 pl-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {processedKeywords.map((kw: any, idx: number) => {
                          const isUsedInTags = editedTags.includes(kw.keyword?.toLowerCase());
                          return (
                            <tr key={idx} className="hover:bg-slate-50 transition">
                              <td className="py-3 pr-4 font-semibold text-slate-900">
                                {kw.keyword}
                              </td>
                              <td className="py-3 px-3">
                                {kw.source === "observed" ? (
                                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    Observed
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-800 border border-blue-200">
                                    Suggested
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 font-mono text-slate-600">
                                {kw.competitorRatio || "—"}
                              </td>
                              <td className="py-3 px-3 font-mono text-slate-600">
                                {kw.inCompetitorTitles !== undefined ? kw.inCompetitorTitles : "—"}
                              </td>
                              <td className="py-3 px-3 font-mono text-slate-600">
                                {kw.inCompetitorTags !== undefined ? kw.inCompetitorTags : "—"}
                              </td>
                              <td className="py-3 px-3">
                                <span className={`px-1.5 py-0.5 rounded text-[11px] font-mono ${
                                  kw.relevanceScore >= 75 ? "text-emerald-700 bg-emerald-50" : "text-slate-600 bg-slate-100"
                                }`}>
                                  {kw.relevanceScore}%
                                </span>
                              </td>
                              <td className="py-3 pl-3 text-right space-x-1">
                                <button
                                  type="button"
                                  onClick={() => triggerCopy(`kw-${idx}`, kw.keyword)}
                                  className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                                  title="Copy keyword"
                                >
                                  {copiedKey === `kw-${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                                {!isUsedInTags && editedTags.length < 13 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (kw.keyword.length <= 20 && !editedTags.includes(kw.keyword.toLowerCase())) {
                                        setEditedTags([...editedTags, kw.keyword.toLowerCase()]);
                                      }
                                    }}
                                    className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[11px] font-semibold border border-emerald-200 transition cursor-pointer"
                                  >
                                    + Tag
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: COMPETITORS (Zero Fake Listings, Honest Unavailable State) */}
              {activeTab === "competitors" && (
                <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        Competitor Benchmarking
                      </h2>
                      <p className="text-xs text-slate-500">
                        Active listings observed in this product niche from official marketplace data.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsDataDetailsOpen(true)}
                      className="text-xs font-semibold text-emerald-700 flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Database className="w-3.5 h-3.5" />
                      <span>Data sources</span>
                    </button>
                  </div>

                  {/* If NO real competitors retrieved: show clean failure state */}
                  {(!results.competitorsAnalyzed || results.competitorsAnalyzed.length === 0) ? (
                    <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center mx-auto">
                        <Store className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-slate-900">
                          Competitor data unavailable
                        </h3>
                        <p className="text-xs text-slate-500 max-w-md mx-auto">
                          We couldn&apos;t retrieve live Etsy marketplace listings for this search term. Connect an Etsy API key or add competitor listing URLs manually.
                        </p>
                      </div>
                      <div className="flex items-center justify-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={handleAnalyze}
                          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Retry search</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowManualUrls(true);
                            setResults(null);
                          }}
                          className="px-3.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                        >
                          Add competitor URLs manually
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Real Competitor Cards Grid */
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {results.competitorsAnalyzed.map((comp: any, idx: number) => (
                        <div
                          key={idx}
                          className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3"
                        >
                          <div className="space-y-2">
                            <div className="w-full h-36 bg-slate-200 rounded-lg overflow-hidden flex items-center justify-center relative">
                              {comp.imageUrl ? (
                                <img
                                  src={comp.imageUrl}
                                  alt={comp.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Store className="w-8 h-8 text-slate-400" />
                              )}
                              {comp.price && (
                                <span className="absolute bottom-2 right-2 bg-slate-900/90 text-white font-mono font-bold text-xs px-2 py-0.5 rounded">
                                  ${comp.price}
                                </span>
                              )}
                            </div>

                            <div>
                              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                                {comp.shopName || "Etsy Shop"}
                              </span>
                              <h3 className="font-semibold text-xs text-slate-900 line-clamp-2 mt-0.5">
                                {comp.title}
                              </h3>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                            <span className="text-[11px] text-slate-400 font-mono">
                              {comp.listingId ? `ID: ${comp.listingId}` : "Competitor"}
                            </span>
                            {comp.url && comp.url.startsWith("http") ? (
                              <a
                                href={comp.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-emerald-700 font-semibold hover:underline"
                              >
                                <span>Open on Etsy</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: LISTING (Titles, Description, FAQs) */}
              {activeTab === "listing" && (
                <div className="space-y-5">
                  <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-lg border border-slate-200 w-fit text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => setListingSubTab("titles")}
                      className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                        listingSubTab === "titles"
                          ? "bg-white text-slate-900 font-semibold shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Titles
                    </button>
                    <button
                      type="button"
                      onClick={() => setListingSubTab("description")}
                      className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                        listingSubTab === "description"
                          ? "bg-white text-slate-900 font-semibold shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Description &amp; Care
                    </button>
                    <button
                      type="button"
                      onClick={() => setListingSubTab("faqs")}
                      className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                        listingSubTab === "faqs"
                          ? "bg-white text-slate-900 font-semibold shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Buyer FAQs
                    </button>
                  </div>

                  {/* Sub-tab: Titles */}
                  {listingSubTab === "titles" && (
                    <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-6">
                      <div>
                        <h2 className="text-base font-bold text-slate-900">
                          Title Variations
                        </h2>
                        <p className="text-xs text-slate-500">
                          Objective physical traits front-loaded in the first 45 characters.
                        </p>
                      </div>

                      {/* Primary Recommended Title */}
                      <div className="p-4 rounded-lg bg-emerald-50/40 border border-emerald-300 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                            Recommended (Search Focused)
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-medium text-slate-600">
                              {editedTitle.length} / 140
                            </span>
                            <button
                              type="button"
                              onClick={() => triggerCopy("rec-title", editedTitle)}
                              className="px-2 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                            >
                              {copiedKey === "rec-title" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              <span>Copy</span>
                            </button>
                          </div>
                        </div>
                        <p className="text-sm font-medium text-slate-900">
                          {editedTitle}
                        </p>
                      </div>

                      {/* Alternative A & B */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                              Alternative A: Gifting Focused
                            </span>
                            <button
                              type="button"
                              onClick={() => triggerCopy("alt-a", results.title?.variations?.giftFocused?.text)}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded transition cursor-pointer"
                              title="Copy title"
                            >
                              {copiedKey === "alt-a" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          <p className="text-xs text-slate-800 leading-relaxed font-medium">
                            {results.title?.variations?.giftFocused?.text}
                          </p>
                        </div>

                        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                              Alternative B: Craft &amp; Material
                            </span>
                            <button
                              type="button"
                              onClick={() => triggerCopy("alt-b", results.title?.variations?.featureFocused?.text)}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded transition cursor-pointer"
                              title="Copy title"
                            >
                              {copiedKey === "alt-b" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          <p className="text-xs text-slate-800 leading-relaxed font-medium">
                            {results.title?.variations?.featureFocused?.text}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sub-tab: Description & Care */}
                  {listingSubTab === "description" && (
                    <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                        <div>
                          <h2 className="text-base font-bold text-slate-900">
                            Listing Description Workspace
                          </h2>
                          <p className="text-xs text-slate-500">
                            Edit directly below. Dedicated care guidelines are embedded to reduce post-purchase disputes.
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => triggerCopy("desc", editedDescription)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                          >
                            {copiedKey === "desc" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>Copy description</span>
                          </button>
                        </div>
                      </div>

                      <textarea
                        value={editedDescription}
                        onChange={(e) => setEditedDescription(e.target.value)}
                        rows={16}
                        className="w-full p-4 text-xs sm:text-sm font-mono text-slate-900 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-slate-900 leading-relaxed transition"
                        placeholder="Listing description content..."
                      />

                      {/* Care guidelines block */}
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Product Care Guidelines
                          </span>
                          <button
                            type="button"
                            onClick={() => triggerCopy("care", results.description?.careInstructions)}
                            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                          >
                            {copiedKey === "care" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>Copy care instructions</span>
                          </button>
                        </div>
                        <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                          {results.description?.careInstructions}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Sub-tab: FAQs */}
                  {listingSubTab === "faqs" && (
                    <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div>
                          <h2 className="text-base font-bold text-slate-900">
                            Proactive Buyer FAQs
                          </h2>
                          <p className="text-xs text-slate-500">
                            Addresses pre-purchase hesitations regarding materials, dispatch, and sizing.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const text = (results.faqs || []).map((f: any) => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n");
                            triggerCopy("faqs-all", text);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                        >
                          {copiedKey === "faqs-all" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>Copy all FAQs</span>
                        </button>
                      </div>

                      <div className="space-y-3">
                        {(results.faqs || []).map((faq: any, idx: number) => (
                          <div key={idx} className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                            <div className="font-semibold text-xs text-slate-900">
                              {faq.question}
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              {faq.answer}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: PRICING (Statistical Quartiles with Evidence Threshold) */}
              {activeTab === "pricing" && (
                <PricingCalculator
                  prices={
                    results.competitorsAnalyzed?.map((c: any) => c.price).filter(Boolean) || []
                  }
                  productNoun={results.productNoun}
                  initialCogs={productFacts.cogs}
                  initialPrice={productFacts.targetPrice}
                />
              )}

              {/* TAB 6: PHOTOS & MEDIA (Category-Tailored Strategy) */}
              {activeTab === "photos" && (
                <div className="space-y-6">
                  <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-bold text-slate-900">
                            Listing Photo Strategy
                          </h2>
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {results.category || "Handmade Products"} Plan
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Tailored shot guidance adapted to your specific product category. Click cards to check off completed slots.
                        </p>
                      </div>

                      <span className="text-xs font-mono font-semibold text-slate-600">
                        {Object.values(photoChecks).filter(Boolean).length} / 10 completed
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {(results.photoStrategy || []).map((slotItem: any) => {
                        const isChecked = Boolean(photoChecks[slotItem.slot]);
                        return (
                          <div
                            key={slotItem.slot}
                            onClick={() => setPhotoChecks((prev) => ({ ...prev, [slotItem.slot]: !isChecked }))}
                            className={`p-4 rounded-lg border transition cursor-pointer flex items-start gap-3 select-none ${
                              isChecked
                                ? "bg-slate-50 border-emerald-500 text-slate-900"
                                : "bg-white border-slate-200 hover:border-slate-300 text-slate-800"
                            }`}
                          >
                            <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center border transition ${
                              isChecked
                                ? "bg-emerald-600 border-emerald-600 text-white"
                                : "border-slate-300 bg-white"
                            }`}>
                              {isChecked && <Check className="w-3.5 h-3.5" />}
                            </div>

                            <div className="space-y-0.5 flex-1">
                              <span className="text-xs font-bold text-slate-900 block">
                                {String(slotItem.slot).padStart(2, "0")} {slotItem.title}
                              </span>
                              <p className="text-xs text-slate-500 leading-snug">
                                {slotItem.guidance}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 15-Second Video Strategy */}
                  {results.videoStrategy && (
                    <div className="bg-slate-900 text-white rounded-xl p-5 sm:p-6 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <Camera className="w-4 h-4 text-emerald-400" />
                          <h3 className="text-sm font-bold tracking-tight">
                            Recommended 15-Second Video: {results.videoStrategy.title}
                          </h3>
                        </div>
                        <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                          {results.videoStrategy.durationSeconds}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {results.videoStrategy.guidance}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>

        {/* Footer with Mandatory Etsy Trademark Disclaimer */}
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400 space-y-1">
          <p>
            The term &apos;Etsy&apos; is a trademark of Etsy, Inc. This application uses the Etsy API but is not endorsed or certified by Etsy, Inc.
          </p>
          <p className="text-[11px] text-slate-400">
            Engineered for high-converting handmade and artisan sellers.
          </p>
        </footer>

        {/* Product Facts Drawer */}
        <ProductFactsDrawer
          isOpen={isFactsDrawerOpen}
          onClose={() => setIsFactsDrawerOpen(false)}
          facts={productFacts}
          onChange={(updated) => setProductFacts(updated)}
          onApplyAndReanalyze={handleAnalyze}
        />

        {/* Data Sources Drawer */}
        <DataDetailsDrawer
          isOpen={isDataDetailsOpen}
          onClose={() => setIsDataDetailsOpen(false)}
          sampleStats={results?.sampleStats}
          productFactsCount={Object.keys(productFacts).length}
          pricingSufficient={Boolean(results?.priceQuartiles?.isSufficient)}
        />

        {/* History Drawer */}
        <HistoryDrawer
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          onRestore={(saved: SavedListing) => {
            handleResetSession();
            setSearchQuery(saved.mainBroadPhrase);
            setEditedTitle(saved.title);
            setEditedTags(saved.tags);
            setEditedDescription(saved.description);
            setActiveTab("overview");
            setIsHistoryOpen(false);
          }}
        />
      </div>
    </AccessGate>
  );
}
