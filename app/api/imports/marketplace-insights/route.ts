import { NextResponse } from "next/server";
import { db, initializeDatabase } from "@/lib/db";
import {
  keywords,
  keywordSources,
  keywordObservations,
  imports,
  importRows,
} from "@/lib/db/schema";
import { normalizeKeyword } from "@/lib/normalization/normalizer";
import { providerRegistry } from "@/lib/providers/registry";
import { z } from "zod";

const MarketplaceImportRowSchema = z.object({
  keyword: z.string().min(1),
  searches30d: z.number().min(0),
  listingCount: z.number().min(0),
  trendPercentage: z.number().optional(),
  observedAt: z.string().optional(),
});

const MarketplaceImportSchema = z.object({
  workspaceId: z.string().default("ws_craft_timber"),
  entries: z.array(MarketplaceImportRowSchema),
  sourceLabel: z.string().default("Etsy Shop Manager Marketplace Insights Import"),
});

export async function POST(request: Request) {
  await initializeDatabase();

  try {
    const json = await request.json();
    const data = MarketplaceImportSchema.parse(json);

    // Ensure source exists
    const sourceId = "src_marketplace_insights";
    await db.insert(keywordSources).values({
      id: sourceId,
      providerName: "Etsy Marketplace Insights (Imported)",
      sourceType: "ETSY_MARKETPLACE_INSIGHTS",
      qualityLevel: 1, // Level 1 direct data
      isDirect: true,
      isEstimated: false,
      isAi: false,
      isSynthetic: false,
      documentationUrl: "https://help.etsy.com/hc/en-us/articles/360000344268",
    }).onConflictDoNothing();

    // Create import record
    const importId = `imp_${Date.now()}`;
    await db.insert(imports).values({
      id: importId,
      workspaceId: data.workspaceId,
      importType: "MARKETPLACE_INSIGHTS",
      filename: "Direct Entry / CSV Paste",
      sourceName: data.sourceLabel,
      rowCount: data.entries.length,
      importedCount: data.entries.length,
      errorCount: 0,
    });

    const ingestedForProvider = [];

    for (let i = 0; i < data.entries.length; i++) {
      const entry = data.entries[i];
      const normalized = normalizeKeyword(entry.keyword);
      const keywordId = `kw_${Buffer.from(normalized.canonicalText).toString("hex").substring(0, 16)}`;

      // Insert keyword
      await db.insert(keywords).values({
        id: keywordId,
        canonicalText: normalized.canonicalText,
        displayText: normalized.displayText,
        tokenCount: normalized.tokenCount,
        characterCount: normalized.characterCount,
        language: "en",
        country: "US",
      }).onConflictDoNothing();

      // Insert Observation (Level 1: direct, 95% confidence)
      const observationDate = entry.observedAt ? new Date(entry.observedAt) : new Date();
      await db.insert(keywordObservations).values({
        id: `obs_${keywordId}_${Date.now()}_${i}`,
        keywordId,
        sourceId,
        metricType: "SEARCHES_30D",
        rawValue: entry.searches30d.toString(),
        normalizedValue: (entry.searches30d / 10000).toFixed(4),
        unit: "searches/month",
        observedAt: observationDate,
        confidence: 95,
        metadataJson: JSON.stringify({
          listingCount: entry.listingCount,
          trendPercentage: entry.trendPercentage ?? 0,
          provenance: "ETSY_DIRECT_MARKETPLACE_INSIGHTS",
          importedAt: new Date().toISOString(),
        }),
      });

      // Record import row
      await db.insert(importRows).values({
        id: `impr_${importId}_${i}`,
        importId,
        rowNumber: i + 1,
        rawContentJson: JSON.stringify(entry),
        status: "success",
      });

      ingestedForProvider.push({
        keyword: normalized.canonicalText,
        searches30d: entry.searches30d,
        listingCount: entry.listingCount,
        trendPercentage: entry.trendPercentage,
        observedAt: observationDate.toISOString(),
      });
    }

    // Ingest into in-memory provider cache as well
    providerRegistry.marketplaceInsights.ingestEntries(ingestedForProvider);

    return NextResponse.json({
      success: true,
      importId,
      importedCount: data.entries.length,
      message: `Successfully imported ${data.entries.length} Marketplace Insights direct observations with high confidence.`,
    });
  } catch (err: any) {
    console.error("Marketplace import error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
