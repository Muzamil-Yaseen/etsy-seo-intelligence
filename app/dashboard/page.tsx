import Link from "next/link";
import {
  Search,
  Tag,
  BarChart3,
  TrendingUp,
  Sparkles,
  ArrowUpRight,
  Database,
  Store,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { db, initializeDatabase } from "@/lib/db";
import { projects, keywords, keywordScores, keywordSources, shops } from "@/lib/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { seedDatabase } from "@/lib/db/seed";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await initializeDatabase();

  // Auto-seed if database is currently empty
  const projectList = await db.select().from(projects);
  if (projectList.length === 0) {
    await seedDatabase();
  }

  const allKeywords = await db.select({ count: sql<number>`count(*)` }).from(keywords);
  const totalKeywords = Number(allKeywords[0]?.count || 0);

  const topOpportunities = await db
    .select({
      score: keywordScores,
      keyword: keywords,
    })
    .from(keywordScores)
    .innerJoin(keywords, eq(keywordScores.keywordId, keywords.id))
    .where(eq(keywordScores.relevanceState, "HIGHLY_RELEVANT"))
    .orderBy(desc(keywordScores.opportunityScore))
    .limit(5);

  const sources = await db.select().from(keywordSources);

  return (
    <div className="space-y-8">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800/80 pb-6">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">SEO Intelligence Overview</h2>
          <p className="text-sm text-neutral-400 mt-1">
            Real marketplace evidence, deterministic scoring, and Etsy-compliant listing optimization.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/"
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-sm transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Open Simple Listing Studio</span>
          </Link>

          <Link
            href="/research"
            className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold px-3.5 py-2 rounded-lg border border-neutral-700 transition"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Keyword Research</span>
          </Link>

          <Link
            href="/tags"
            className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold px-3.5 py-2 rounded-lg border border-neutral-700 transition"
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Optimize 13 Tags</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4.5 space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium uppercase tracking-wider">Active Projects</span>
            <Layers className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-bold text-white">1</div>
          <p className="text-[11px] text-neutral-400">Heritage Leather Wallets SEO</p>
        </div>

        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4.5 space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium uppercase tracking-wider">Scored Keywords</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">{totalKeywords}</div>
          <p className="text-[11px] text-neutral-400">Deduplicated &amp; Clustered</p>
        </div>

        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4.5 space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium uppercase tracking-wider">Scoring Engine</span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">v1.0.0</div>
          <p className="text-[11px] text-emerald-400 font-medium">Dynamic Re-weighting Active</p>
        </div>

        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4.5 space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium uppercase tracking-wider">Data Provenance</span>
            <Database className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">{sources.length} Sources</div>
          <p className="text-[11px] text-neutral-400">Direct Etsy &amp; Synthetic Fixtures</p>
        </div>
      </div>

      {/* Main Grid: High Opportunity Highlights & Connected Shop Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: High Opportunity Keywords Table */}
        <div className="lg:col-span-2 bg-neutral-900/40 border border-neutral-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Top High-Opportunity Targets</h3>
              <p className="text-xs text-neutral-400">Keywords with high relevance, solid buyer intent, and favorable competition.</p>
            </div>
            <Link
              href="/research"
              className="text-xs text-orange-400 hover:text-orange-300 font-medium flex items-center gap-1 transition"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-neutral-800 text-neutral-400 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 font-medium">Keyword</th>
                  <th className="py-2.5 font-medium">Opportunity</th>
                  <th className="py-2.5 font-medium">Confidence</th>
                  <th className="py-2.5 font-medium">Relevance</th>
                  <th className="py-2.5 font-medium">Intent</th>
                  <th className="py-2.5 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
                {topOpportunities.map((row: any) => (
                  <tr key={row.keyword.id} className="hover:bg-neutral-800/30 transition">
                    <td className="py-3 font-medium text-white">
                      <div className="flex items-center gap-2">
                        <span>{row.keyword.displayText}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-orange-400">{Math.round(Number(row.score.opportunityScore))}</span>
                        <span className="text-[10px] text-neutral-400">/100</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-800 text-neutral-300 border border-neutral-700">
                        {row.score.confidenceLevel}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="text-emerald-400 font-medium">{Math.round(Number(row.score.relevanceScore))}%</span>
                    </td>
                    <td className="py-3">
                      <span className="text-neutral-300">{row.score.intentType.replace(/_/g, " ")}</span>
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/research?inspect=${row.keyword.id}`}
                        className="text-[11px] bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-2 py-1 rounded transition"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Connected Shop & Etsy Guidelines */}
        <div className="space-y-6">
          {/* Connected Shop Card */}
          <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-orange-400" />
                <h3 className="text-sm font-semibold text-white">Etsy Shop Connection</h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-950/60 border border-amber-800/80 text-amber-400">
                Personal App Tier
              </span>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              Connect your Etsy seller account via secure OAuth 2.0 PKCE to personalize Seller Fit scores and analyze your active listings.
            </p>

            <Link
              href="/shops"
              className="block text-center text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 py-2 rounded-lg border border-neutral-700 transition"
            >
              Manage Connected Shops
            </Link>
          </div>

          {/* 2026 Etsy Guidelines Reference Card */}
          <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-white text-sm font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>2026 Etsy Search Rules</span>
            </div>
            <ul className="text-xs text-neutral-400 space-y-2 leading-relaxed">
              <li className="flex items-start gap-1.5">
                <span className="text-neutral-500">•</span>
                <span><strong>Tags:</strong> Up to 13 tags, strictly &le;20 characters each. Focus on multi-word long-tail intent.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-neutral-500">•</span>
                <span><strong>Titles:</strong> Concise &amp; scannable (&lt;15 words recommended). Objective traits first; zero comma salad.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-neutral-500">•</span>
                <span><strong>Marketplace Insights:</strong> 30-day search queries &amp; competition counts imported without scraping.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
