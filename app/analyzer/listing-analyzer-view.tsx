"use client";

import React, { useState } from "react";
import {
  BarChart3,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
  Tag,
  Type,
  FileText,
  Layers,
} from "lucide-react";
import { ListingAuditResult } from "@/lib/analyzers/listing-analyzer";

export function ListingAnalyzerView() {
  const [title, setTitle] = useState(
    "Personalized Leather Wallet Men, Custom Engraved Wallet for Husband, Mens Bifold Wallet Gift, Anniversary Gift for Him"
  );
  const [tagsInput, setTagsInput] = useState(
    "personalized wallet, leather wallet men, custom wallet, mens wallet, leather wallet, wallet for husband, gift for dad, bifold wallet, anniversary gift, groomsmen gift"
  );
  const [description, setDescription] = useState(
    "Our custom leather wallets are handcrafted with care from genuine cowhide leather. Personalized with your initials or custom message. Features bifold construction with 6 card slots and cash compartment. Perfect gift for husband, boyfriend, or dad on wedding anniversary, Father's Day, or birthday."
  );
  const [category, setCategory] = useState("Bags & Purses > Wallets & Money Clips > Wallets");
  const [materials, setMaterials] = useState("Full Grain Leather, Thread");

  const [audit, setAudit] = useState<ListingAuditResult | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);

  const runAudit = async () => {
    setIsAuditing(true);
    try {
      const tagsArray = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch("/api/listings/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          tags: tagsArray,
          description,
          category,
          materials: materials.split(",").map((m) => m.trim()),
          targetKeywords: ["personalized leather wallet", "mens bifold wallet", "custom engraved wallet"],
        }),
      });

      const data = await res.json();
      if (data.success && data.audit) {
        setAudit(data.audit);
      }
    } catch (err) {
      console.error("Audit error:", err);
    } finally {
      setIsAuditing(false);
    }
  };

  React.useEffect(() => {
    runAudit();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-orange-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Etsy Listing Search Match Readiness Auditor</h2>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Audits your existing or draft listing against official search mechanics. Never promises fake guaranteed positions.
          </p>
        </div>

        <button
          onClick={runAudit}
          disabled={isAuditing}
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 disabled:bg-neutral-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isAuditing ? "Auditing..." : "Run Full Listing Audit"}</span>
        </button>
      </div>

      {/* Editor & Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Input Form */}
        <div className="lg:col-span-5 bg-neutral-900/40 border border-neutral-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">Listing Specifications</h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-neutral-400 font-medium">Title</label>
              <textarea
                rows={3}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-neutral-700"
              />
            </div>

            <div>
              <label className="text-neutral-400 font-medium">Tags (comma-separated, max 13)</label>
              <textarea
                rows={3}
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-neutral-700"
              />
            </div>

            <div>
              <label className="text-neutral-400 font-medium">Description</label>
              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-neutral-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-neutral-400 font-medium">Category</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
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
            </div>

            <button
              onClick={runAudit}
              className="w-full mt-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold py-2 rounded-lg border border-neutral-700 transition"
            >
              Re-Calculate Audit
            </button>
          </div>
        </div>

        {/* Right 7 Cols: Audit Results & Metrics */}
        <div className="lg:col-span-7 space-y-6">
          {audit && (
            <>
              {/* Score Meters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-4 space-y-1">
                  <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Search Readiness</div>
                  <div className="text-2xl font-bold text-orange-400">{audit.searchMatchReadiness}%</div>
                  <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-orange-500 h-full" style={{ width: `${audit.searchMatchReadiness}%` }} />
                  </div>
                </div>

                <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-4 space-y-1">
                  <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Tag Diversity</div>
                  <div className="text-2xl font-bold text-blue-400">{audit.tagDiversityScore}%</div>
                  <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full" style={{ width: `${audit.tagDiversityScore}%` }} />
                  </div>
                </div>

                <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-4 space-y-1">
                  <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Title Quality</div>
                  <div className="text-2xl font-bold text-emerald-400">{audit.titleQuality}%</div>
                  <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full" style={{ width: `${audit.titleQuality}%` }} />
                  </div>
                </div>

                <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-4 space-y-1">
                  <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Slot Usage</div>
                  <div className="text-2xl font-bold text-neutral-200">{audit.tagSlotUtilization}/13</div>
                  <p className="text-[10px] text-neutral-400">Available slots</p>
                </div>
              </div>

              {/* Problems & Opportunities */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Problems */}
                <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-red-400 text-xs font-semibold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Identified Issues ({audit.problems.length})</span>
                  </div>
                  {audit.problems.length === 0 ? (
                    <p className="text-xs text-neutral-500 italic">No critical issues detected.</p>
                  ) : (
                    <div className="space-y-2 text-xs text-red-300">
                      {audit.problems.map((p, idx) => (
                        <div key={idx} className="flex items-start gap-1.5">
                          <span className="text-red-500">•</span>
                          <span>{p}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Opportunities */}
                <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Actionable Opportunities ({audit.opportunities.length})</span>
                  </div>
                  <div className="space-y-2 text-xs text-neutral-300">
                    {audit.opportunities.map((o, idx) => (
                      <div key={idx} className="flex items-start gap-1.5">
                        <span className="text-emerald-500">•</span>
                        <span>{o}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tag Slot Breakdown Table */}
              <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-5 space-y-3">
                <h4 className="text-xs font-semibold text-white">13-Tag Slot Audit Breakdown</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-neutral-800 text-[10px] text-neutral-400 uppercase tracking-wider">
                      <tr>
                        <th className="py-2">Tag</th>
                        <th className="py-2">Length</th>
                        <th className="py-2">Status</th>
                        <th className="py-2">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/50 text-neutral-300">
                      {audit.tagAudit.map((t, idx) => (
                        <tr key={idx}>
                          <td className="py-2 font-medium text-white">{t.tag}</td>
                          <td className="py-2 font-mono text-[11px]">{t.characterCount}/20</td>
                          <td className="py-2">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                t.isValid
                                  ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                                  : "bg-red-950 text-red-400 border border-red-800"
                              }`}
                            >
                              {t.isValid ? "Valid" : "Invalid"}
                            </span>
                          </td>
                          <td className="py-2 text-neutral-400 text-[11px]">{t.issue || "Complies with Etsy rules"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
