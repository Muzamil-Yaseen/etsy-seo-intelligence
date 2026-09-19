"use client";

import React, { useState } from "react";
import {
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Info,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  Shield,
  Layers,
  ChevronRight,
  HelpCircle,
  Eye,
  SlidersHorizontal,
} from "lucide-react";

interface KeywordItem {
  id: string;
  keyword: string;
  canonicalText: string;
  cluster: string;
  scores: {
    opportunityScore: number;
    confidenceScore: number;
    confidenceLevel: string;
    demandScore: number | null;
    competitionScore: number | null;
    relevanceScore: number;
    intentScore: number;
    trendScore: number | null;
    relevanceState: string;
    intentType: string;
    scoringVersion?: string;
    weights?: Record<string, number>;
    explanation?: {
      summary: string;
      relevanceExplanation: string;
      competitionExplanation: string;
      recommendationAction: string;
      warnings: string[];
    };
  };
  observation?: {
    searches30d?: number | null;
    listingCount?: number | null;
    sourceName?: string;
    sourceType?: string;
    isSynthetic?: boolean;
  } | null;
  userState?: {
    isSelected: boolean;
    isRejected: boolean;
    rejectionReason: string | null;
    userNotes: string | null;
  };
}

interface ResearchViewProps {
  initialKeywords: KeywordItem[];
  projectId: string;
  product: {
    id: string;
    name: string;
    category: string;
    materials?: string | null;
    features?: string | null;
  };
}

type FilterPreset =
  | "ALL"
  | "BEST_OVERALL"
  | "HIGH_CONFIDENCE"
  | "LONG_TAIL"
  | "LOW_COMPETITION"
  | "HIGH_INTENT"
  | "PRIMARY_CANDIDATES"
  | "AVOID";

export function ResearchView({ initialKeywords, projectId, product }: ResearchViewProps) {
  const [keywordsList, setKeywordsList] = useState<KeywordItem[]>(initialKeywords);
  const [seedKeyword, setSeedKeyword] = useState("personalized leather wallet");
  const [isResearching, setIsResearching] = useState(false);
  const [researchStage, setResearchStage] = useState("");
  const [activePreset, setActivePreset] = useState<FilterPreset>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCluster, setSelectedCluster] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"BASIC" | "ADVANCED">("BASIC");
  const [inspectKeyword, setInspectKeyword] = useState<KeywordItem | null>(null);

  // Sorting state
  const [sortField, setSortField] = useState<"opportunity" | "confidence" | "demand" | "competition" | "relevance" | "intent">("opportunity");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Rejection modal state
  const [rejectingItem, setRejectingItem] = useState<KeywordItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState("IRRELEVANT");

  // Unique clusters
  const clusters = Array.from(new Set(keywordsList.map((k) => k.cluster))).filter(Boolean);

  const handleRunResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seedKeyword.trim()) return;

    setIsResearching(true);
    setResearchStage("Generating semantic candidate universe...");

    try {
      setTimeout(() => setResearchStage("Normalizing & deduplicating variants..."), 600);
      setTimeout(() => setResearchStage("Retrieving legitimate marketplace observations..."), 1200);
      setTimeout(() => setResearchStage("Evaluating product relevance & buyer intent..."), 1800);
      setTimeout(() => setResearchStage("Calculating deterministic Opportunity & Confidence..."), 2400);

      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          seedKeyword,
          allowSyntheticFallback: true,
        }),
      });

      const data = await res.json();
      if (data.success && data.keywords) {
        setKeywordsList(data.keywords);
      }
    } catch (err) {
      console.error("Research failed:", err);
    } finally {
      setIsResearching(false);
      setResearchStage("");
    }
  };

  const handleToggleSelect = async (kw: KeywordItem) => {
    const isNowSelected = !kw.userState?.isSelected;
    // Optimistic update
    setKeywordsList((prev) =>
      prev.map((k) =>
        k.id === kw.id
          ? {
              ...k,
              userState: {
                ...k.userState,
                isSelected: isNowSelected,
                isRejected: false,
                rejectionReason: null,
                userNotes: k.userState?.userNotes || null,
              },
            }
          : k
      )
    );

    await fetch("/api/keywords/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        keywordId: kw.id,
        action: isNowSelected ? "SELECT" : "DESELECT",
      }),
    });
  };

  const handleConfirmReject = async () => {
    if (!rejectingItem) return;

    setKeywordsList((prev) =>
      prev.map((k) =>
        k.id === rejectingItem.id
          ? {
              ...k,
              userState: {
                ...k.userState,
                isSelected: false,
                isRejected: true,
                rejectionReason: rejectionReason,
                userNotes: k.userState?.userNotes || null,
              },
            }
          : k
      )
    );

    await fetch("/api/keywords/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        keywordId: rejectingItem.id,
        action: "REJECT",
        rejectionReason,
      }),
    });

    setRejectingItem(null);
  };

  const handleExportCSV = () => {
    const headers = [
      "Keyword",
      "Cluster",
      "Opportunity Score",
      "Confidence Score",
      "Demand Score",
      "Searches 30d",
      "Competition Opportunity",
      "Listing Count",
      "Product Relevance",
      "Buyer Intent",
      "Relevance State",
      "Data Source",
    ];

    const rows = filteredKeywords.map((k) => [
      `"${k.keyword}"`,
      `"${k.cluster}"`,
      k.scores.opportunityScore,
      k.scores.confidenceScore,
      k.scores.demandScore ?? "N/A",
      k.observation?.searches30d ?? "N/A",
      k.scores.competitionScore ?? "N/A",
      k.observation?.listingCount ?? "N/A",
      k.scores.relevanceScore,
      k.scores.intentScore,
      k.scores.relevanceState,
      `"${k.observation?.sourceName || "AI Candidate"}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `etsy_keywords_${projectId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter logic
  const filteredKeywords = keywordsList.filter((kw) => {
    // Search query
    if (searchQuery && !kw.keyword.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Cluster filter
    if (selectedCluster !== "ALL" && kw.cluster !== selectedCluster) {
      return false;
    }

    // Presets
    if (activePreset === "BEST_OVERALL") {
      return kw.scores.opportunityScore >= 75 && kw.scores.relevanceScore >= 70;
    }
    if (activePreset === "HIGH_CONFIDENCE") {
      return kw.scores.confidenceScore >= 75;
    }
    if (activePreset === "LONG_TAIL") {
      return kw.keyword.split(/\s+/).length >= 3;
    }
    if (activePreset === "LOW_COMPETITION") {
      return (kw.scores.competitionScore ?? 0) >= 60;
    }
    if (activePreset === "HIGH_INTENT") {
      return kw.scores.intentScore >= 80;
    }
    if (activePreset === "PRIMARY_CANDIDATES") {
      return kw.scores.opportunityScore >= 80 && kw.scores.relevanceScore >= 85;
    }
    if (activePreset === "AVOID") {
      return kw.scores.relevanceState === "BLOCKED" || kw.scores.relevanceState === "CONTRADICTORY" || kw.userState?.isRejected;
    }

    // By default, exclude rejected keywords from main view unless in AVOID preset
    if (kw.userState?.isRejected) {
      return false;
    }

    return true;
  });

  // Sort logic
  filteredKeywords.sort((a, b) => {
    let valA = 0;
    let valB = 0;

    if (sortField === "opportunity") {
      valA = a.scores.opportunityScore;
      valB = b.scores.opportunityScore;
    } else if (sortField === "confidence") {
      valA = a.scores.confidenceScore;
      valB = b.scores.confidenceScore;
    } else if (sortField === "demand") {
      valA = a.scores.demandScore ?? -1;
      valB = b.scores.demandScore ?? -1;
    } else if (sortField === "competition") {
      valA = a.scores.competitionScore ?? -1;
      valB = b.scores.competitionScore ?? -1;
    } else if (sortField === "relevance") {
      valA = a.scores.relevanceScore;
      valB = b.scores.relevanceScore;
    } else if (sortField === "intent") {
      valA = a.scores.intentScore;
      valB = b.scores.intentScore;
    }

    return sortDirection === "desc" ? valB - valA : valA - valB;
  });

  return (
    <div className="space-y-6">
      {/* Research Form Banner */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Keyword Universe Explorer</h2>
            <p className="text-xs text-neutral-400">
              Target Product: <span className="text-neutral-200 font-medium">{product.name}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400">View Mode:</span>
            <button
              onClick={() => setViewMode("BASIC")}
              className={`text-xs px-2.5 py-1 rounded font-medium transition ${
                viewMode === "BASIC"
                  ? "bg-orange-600 text-white"
                  : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"
              }`}
            >
              Basic
            </button>
            <button
              onClick={() => setViewMode("ADVANCED")}
              className={`text-xs px-2.5 py-1 rounded font-medium transition ${
                viewMode === "ADVANCED"
                  ? "bg-orange-600 text-white"
                  : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"
              }`}
            >
              Advanced
            </button>
          </div>
        </div>

        {/* Input Bar */}
        <form onSubmit={handleRunResearch} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={seedKeyword}
              onChange={(e) => setSeedKeyword(e.target.value)}
              placeholder="Enter seed keyword (e.g. personalized leather wallet)..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-10 pr-4 py-2 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-orange-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={isResearching}
            className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 disabled:bg-neutral-800 text-white text-xs font-semibold px-5 py-2 rounded-lg transition shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isResearching ? "Exploring..." : "Generate & Validate Universe"}</span>
          </button>
        </form>

        {/* Multi-stage Progress Indicator */}
        {isResearching && (
          <div className="p-3 bg-neutral-950/80 rounded-lg border border-orange-500/30 flex items-center gap-3 text-xs text-orange-400 animate-pulse">
            <Sparkles className="w-4 h-4 animate-spin shrink-0" />
            <span>{researchStage}</span>
          </div>
        )}
      </div>

      {/* Filter Presets Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: "ALL", label: "All Candidates" },
              { id: "BEST_OVERALL", label: "Best Overall" },
              { id: "PRIMARY_CANDIDATES", label: "Primary Targets" },
              { id: "HIGH_CONFIDENCE", label: "High Confidence" },
              { id: "LOW_COMPETITION", label: "Low Competition" },
              { id: "LONG_TAIL", label: "Long Tail" },
              { id: "HIGH_INTENT", label: "High Intent" },
              { id: "AVOID", label: "Avoid / Blocked" },
            ] as const
          ).map((preset) => (
            <button
              key={preset.id}
              onClick={() => setActivePreset(preset.id)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                activePreset === preset.id
                  ? "bg-orange-600/20 text-orange-400 border border-orange-500/40"
                  : "bg-neutral-900/60 text-neutral-400 hover:text-neutral-200 border border-neutral-800"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Cluster Filter */}
          <select
            value={selectedCluster}
            onChange={(e) => setSelectedCluster(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-300 focus:outline-none focus:border-neutral-700"
          >
            <option value="ALL">All Clusters ({clusters.length})</option>
            {clusters.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 text-xs bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 px-3 py-1.5 rounded-lg transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-900/80 border-b border-neutral-800 text-[11px] text-neutral-400 uppercase tracking-wider select-none">
              <tr>
                <th className="py-3 px-4 font-medium">Select</th>
                <th className="py-3 px-4 font-medium cursor-pointer hover:text-white" onClick={() => setSortField("opportunity")}>
                  <div className="flex items-center gap-1">
                    <span>Keyword</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3 font-medium">Cluster</th>
                <th className="py-3 px-3 font-medium cursor-pointer hover:text-white" onClick={() => { setSortField("opportunity"); setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc'); }}>
                  <div className="flex items-center gap-1">
                    <span>Opportunity</span>
                    <ArrowUpDown className="w-3 h-3 text-orange-400" />
                  </div>
                </th>
                <th className="py-3 px-3 font-medium cursor-pointer hover:text-white" onClick={() => { setSortField("confidence"); setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc'); }}>
                  <div className="flex items-center gap-1">
                    <span>Confidence</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3 font-medium cursor-pointer hover:text-white" onClick={() => { setSortField("demand"); setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc'); }}>
                  <div className="flex items-center gap-1">
                    <span>Demand</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                {viewMode === "ADVANCED" && (
                  <th className="py-3 px-3 font-medium">Searches (30d)</th>
                )}
                <th className="py-3 px-3 font-medium cursor-pointer hover:text-white" onClick={() => { setSortField("competition"); setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc'); }}>
                  <div className="flex items-center gap-1">
                    <span>Comp. Opp</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                {viewMode === "ADVANCED" && (
                  <th className="py-3 px-3 font-medium">Listings</th>
                )}
                <th className="py-3 px-3 font-medium cursor-pointer hover:text-white" onClick={() => { setSortField("relevance"); setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc'); }}>
                  <div className="flex items-center gap-1">
                    <span>Relevance</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3 font-medium cursor-pointer hover:text-white" onClick={() => { setSortField("intent"); setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc'); }}>
                  <div className="flex items-center gap-1">
                    <span>Intent</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3 font-medium">Data Source</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
              {filteredKeywords.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-neutral-500">
                    No keywords found matching this filter. Try adjusting your search query or presets.
                  </td>
                </tr>
              ) : (
                filteredKeywords.map((kw) => {
                  const isBlocked = kw.scores.relevanceState === "BLOCKED" || kw.scores.relevanceState === "CONTRADICTORY";
                  const isSelected = kw.userState?.isSelected;
                  const isRejected = kw.userState?.isRejected;

                  return (
                    <tr
                      key={kw.id}
                      className={`hover:bg-neutral-800/30 transition ${
                        isBlocked ? "bg-red-950/10 text-neutral-400" : ""
                      } ${isSelected ? "bg-orange-950/10" : ""}`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected || false}
                          disabled={isBlocked}
                          onChange={() => handleToggleSelect(kw)}
                          className="rounded border-neutral-700 text-orange-600 focus:ring-0 w-3.5 h-3.5 bg-neutral-900 cursor-pointer"
                        />
                      </td>

                      {/* Keyword Name */}
                      <td className="py-3 px-4 font-medium text-white">
                        <div className="flex items-center gap-2">
                          <span className={isBlocked ? "line-through text-neutral-400" : ""}>
                            {kw.keyword}
                          </span>
                          {isBlocked && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-950/80 text-red-400 border border-red-800">
                              BLOCKED
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Cluster */}
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-800/80 text-neutral-300 border border-neutral-700/60">
                          {kw.cluster}
                        </span>
                      </td>

                      {/* Opportunity Score */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-bold ${kw.scores.opportunityScore >= 75 ? "text-orange-400" : "text-neutral-300"}`}>
                            {Math.round(kw.scores.opportunityScore)}
                          </span>
                          <span className="text-[10px] text-neutral-400">/100</span>
                        </div>
                      </td>

                      {/* Confidence Score */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              kw.scores.confidenceLevel === "VERY_HIGH" || kw.scores.confidenceLevel === "HIGH"
                                ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800"
                                : kw.scores.confidenceLevel === "MEDIUM"
                                ? "bg-blue-950/80 text-blue-400 border border-blue-800"
                                : "bg-neutral-800 text-neutral-400 border border-neutral-700"
                            }`}
                          >
                            {kw.scores.confidenceLevel}
                          </span>
                        </div>
                      </td>

                      {/* Demand Score */}
                      <td className="py-3 px-3">
                        {kw.scores.demandScore !== null ? (
                          <span className="font-medium text-neutral-200">{Math.round(kw.scores.demandScore)}</span>
                        ) : (
                          <span className="text-neutral-400 italic text-[11px]">Unobserved</span>
                        )}
                      </td>

                      {/* Searches 30d (Advanced) */}
                      {viewMode === "ADVANCED" && (
                        <td className="py-3 px-3 text-neutral-300">
                          {kw.observation?.searches30d !== null && kw.observation?.searches30d !== undefined
                            ? kw.observation.searches30d.toLocaleString()
                            : "—"}
                        </td>
                      )}

                      {/* Competition Opportunity */}
                      <td className="py-3 px-3">
                        {kw.scores.competitionScore !== null ? (
                          <span className="font-medium text-neutral-200">{Math.round(kw.scores.competitionScore)}</span>
                        ) : (
                          <span className="text-neutral-400 italic text-[11px]">Unobserved</span>
                        )}
                      </td>

                      {/* Listings Count (Advanced) */}
                      {viewMode === "ADVANCED" && (
                        <td className="py-3 px-3 text-neutral-300">
                          {kw.observation?.listingCount !== null && kw.observation?.listingCount !== undefined
                            ? kw.observation.listingCount.toLocaleString()
                            : "—"}
                        </td>
                      )}

                      {/* Relevance Score */}
                      <td className="py-3 px-3">
                        <span
                          className={`font-semibold ${
                            kw.scores.relevanceScore >= 80
                              ? "text-emerald-400"
                              : kw.scores.relevanceScore >= 50
                              ? "text-neutral-300"
                              : "text-red-400"
                          }`}
                        >
                          {Math.round(kw.scores.relevanceScore)}%
                        </span>
                      </td>

                      {/* Intent Type */}
                      <td className="py-3 px-3">
                        <span className="text-[11px] text-neutral-400">
                          {kw.scores.intentType.replace(/_/g, " ")}
                        </span>
                      </td>

                      {/* Data Source Badge */}
                      <td className="py-3 px-3">
                        {kw.observation?.isSynthetic ? (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800/80">
                            SYNTHETIC DEMO
                          </span>
                        ) : kw.observation?.sourceType === "ETSY_MARKETPLACE_INSIGHTS" ? (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/80">
                            DIRECT INSIGHTS
                          </span>
                        ) : kw.observation?.sourceType === "ETSY_OPEN_API" ? (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-blue-950/80 text-blue-300 border border-blue-800/80">
                            OPEN API v3
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[9px] font-medium bg-neutral-800 text-neutral-400 border border-neutral-700">
                            AI CANDIDATE
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setInspectKeyword(kw)}
                            className="text-[11px] bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-2.5 py-1 rounded transition"
                          >
                            Inspect
                          </button>

                          {!isBlocked && (
                            <button
                              onClick={() => {
                                setRejectingItem(kw);
                                setRejectionReason("IRRELEVANT");
                              }}
                              title="Reject keyword with reason"
                              className="text-neutral-400 hover:text-red-400 p-1 transition"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Keyword Drawer / Modal */}
      {inspectKeyword && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-neutral-800 pb-4">
              <div>
                <span className="text-[10px] text-orange-400 font-semibold uppercase tracking-wider">
                  Transparent Score Breakdown
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">{inspectKeyword.keyword}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-neutral-400">Cluster: {inspectKeyword.cluster}</span>
                  <span className="text-neutral-600">•</span>
                  <span className="text-xs text-neutral-400">Version: {inspectKeyword.scores.scoringVersion || "v1.0.0"}</span>
                </div>
              </div>

              <button
                onClick={() => setInspectKeyword(null)}
                className="text-neutral-400 hover:text-white text-sm p-1 rounded-md transition"
              >
                ✕
              </button>
            </div>

            {/* Score Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                <div className="text-[10px] text-neutral-400 font-medium">Opportunity</div>
                <div className="text-xl font-bold text-orange-400 mt-1">
                  {Math.round(inspectKeyword.scores.opportunityScore)}/100
                </div>
              </div>

              <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                <div className="text-[10px] text-neutral-400 font-medium">Confidence</div>
                <div className="text-xl font-bold text-emerald-400 mt-1">
                  {inspectKeyword.scores.confidenceLevel}
                </div>
              </div>

              <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                <div className="text-[10px] text-neutral-400 font-medium">Relevance</div>
                <div className="text-xl font-bold text-neutral-200 mt-1">
                  {Math.round(inspectKeyword.scores.relevanceScore)}%
                </div>
              </div>

              <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                <div className="text-[10px] text-neutral-400 font-medium">Buyer Intent</div>
                <div className="text-xl font-bold text-blue-400 mt-1">
                  {Math.round(inspectKeyword.scores.intentScore)}/100
                </div>
              </div>
            </div>

            {/* Transparent Calculation: Why this score? */}
            <div className="bg-neutral-950/80 p-4 rounded-lg border border-neutral-800 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <Info className="w-4 h-4 text-orange-400" />
                <span>Deterministic Calculation Formula</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed font-mono">
                Opportunity = 0.26×Demand + 0.17×Competition + 0.18×Relevance + 0.14×Intent + 0.10×Trend + 0.09×SERP + 0.06×SellerFit
              </p>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                When specific signals (such as Trend or Seller Fit) are unobserved, the engine dynamically drops their weights and re-normalizes the active signals to sum to 100%. No fake default numbers are ever injected.
              </p>
            </div>

            {/* Evidence & Explanation */}
            {inspectKeyword.scores.explanation && (
              <div className="space-y-3 text-xs">
                <div className="font-semibold text-white">Marketplace Evidence Explanation</div>
                <p className="text-neutral-300 leading-relaxed bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                  {inspectKeyword.scores.explanation.summary}
                </p>

                {inspectKeyword.scores.explanation.warnings?.length > 0 && (
                  <div className="p-3 bg-red-950/40 border border-red-800/80 rounded-lg text-red-300 space-y-1">
                    <div className="font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Warnings</span>
                    </div>
                    {inspectKeyword.scores.explanation.warnings.map((w, idx) => (
                      <div key={idx}>• {w}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Data Provenance Details */}
            <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 text-xs space-y-2">
              <div className="font-semibold text-white flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                <span>Data Provenance &amp; Verification</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-neutral-400">
                <div>Source: <span className="text-neutral-200">{inspectKeyword.observation?.sourceName || "AI Candidate"}</span></div>
                <div>Data Type: <span className="text-neutral-200">{inspectKeyword.observation?.isSynthetic ? "Synthetic Development Fixture" : "Direct Marketplace Observation"}</span></div>
                <div>Searches (30d): <span className="text-neutral-200">{inspectKeyword.observation?.searches30d ?? "Not directly recorded"}</span></div>
                <div>Active Listings: <span className="text-neutral-200">{inspectKeyword.observation?.listingCount?.toLocaleString() ?? "Not directly recorded"}</span></div>
              </div>
            </div>

            {/* Drawer Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-neutral-800">
              <button
                onClick={() => setInspectKeyword(null)}
                className="text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-4 py-2 rounded-lg transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleToggleSelect(inspectKeyword);
                  setInspectKeyword(null);
                }}
                className={`text-xs font-semibold px-4 py-2 rounded-lg transition ${
                  inspectKeyword.userState?.isSelected
                    ? "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                    : "bg-orange-600 hover:bg-orange-500 text-white"
                }`}
              >
                {inspectKeyword.userState?.isSelected ? "Deselect" : "Add to Target Set"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-md w-full p-5 space-y-4">
            <h3 className="text-sm font-bold text-white">Reject Keyword: &lsquo;{rejectingItem.keyword}&rsquo;</h3>
            <p className="text-xs text-neutral-400">
              Select why this keyword should be excluded. Your decision is preserved and AI will never automatically re-add a rejected term.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs text-neutral-300 font-medium">Rejection Reason</label>
              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-neutral-700"
              >
                <option value="IRRELEVANT">Irrelevant to Product</option>
                <option value="MISLEADING">Misleading / Contradictory</option>
                <option value="TOO_COMPETITIVE">Too Saturated / Competitive</option>
                <option value="WEAK_DEMAND">Weak Buyer Demand</option>
                <option value="LOW_CONFIDENCE">Low Data Confidence</option>
                <option value="NOT_APPLICABLE">Not Applicable to Listing</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
              <button
                onClick={() => setRejectingItem(null)}
                className="text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-3 py-1.5 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="text-xs bg-red-600 hover:bg-red-500 text-white font-semibold px-3 py-1.5 rounded-lg transition"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
