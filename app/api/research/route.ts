import { NextResponse } from "next/server";
import { db, initializeDatabase } from "@/lib/db";
import {
  projects,
  products,
  keywords,
  keywordSources,
  keywordObservations,
  keywordClusters,
  keywordClusterMembers,
  keywordScores,
  projectKeywords,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { generateKeywordCandidates, generateKeywordExplanation } from "@/lib/ai/services";
import { normalizeKeyword } from "@/lib/normalization/normalizer";
import { providerRegistry } from "@/lib/providers/registry";
import { calculateDemandScore } from "@/lib/scoring/demand";
import { calculateCompetitionScore } from "@/lib/scoring/competition";
import { calculateProductRelevance } from "@/lib/scoring/relevance";
import { calculateBuyerIntent } from "@/lib/scoring/intent";
import { calculateTrendScore } from "@/lib/scoring/trend";
import { calculateSERPOpportunity } from "@/lib/scoring/serp";
import { calculateSellerFit } from "@/lib/scoring/seller-fit";
import { calculateOpportunityScore } from "@/lib/scoring/opportunity";
import { calculateConfidenceScore } from "@/lib/scoring/confidence";

const ResearchRequestSchema = z.object({
  projectId: z.string(),
  seedKeyword: z.string().min(2),
  allowSyntheticFallback: z.boolean().default(true),
});

export async function POST(request: Request) {
  await initializeDatabase();

  try {
    const json = await request.json();
    const data = ResearchRequestSchema.parse(json);

    // 1. Get Project and Product Context
    const proj = (await db.select().from(projects).where(eq(projects.id, data.projectId)))[0];
    if (!proj) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const prods = await db.select().from(products).where(eq(products.projectId, data.projectId));
    const product = prods[0];
    if (!product) {
      return NextResponse.json({ error: "Product not defined for project" }, { status: 400 });
    }

    const productContext = {
      name: product.name,
      description: product.description,
      category: product.category,
      materials: product.materials || undefined,
      colors: product.colors || undefined,
      sizes: product.sizes || undefined,
      styles: product.styles || undefined,
      features: product.features || undefined,
      personalization: product.personalization || undefined,
      recipient: product.recipient || undefined,
      occasion: product.occasion || undefined,
      useCases: product.useCases || undefined,
      isGenuineLeather: (product.materials || "").toLowerCase().includes("leather"),
      hasRfid: (product.features || "").toLowerCase().includes("rfid"),
    };

    // 2. Generate Candidate Universe
    const generated = await generateKeywordCandidates(data.seedKeyword, productContext);

    // 3. Ensure Clusters exist
    const existingClusters = await db.select().from(keywordClusters).where(eq(keywordClusters.projectId, data.projectId));
    const clusterMap = new Map<string, string>();
    for (const c of existingClusters) {
      clusterMap.set(c.name.toLowerCase(), c.id);
    }

    for (const candidate of generated.candidates) {
      const clusterKey = candidate.cluster.toLowerCase();
      if (!clusterMap.has(clusterKey)) {
        const clusterId = `clus_${clusterKey.replace(/\s+/g, "_")}`;
        await db.insert(keywordClusters).values({
          id: clusterId,
          projectId: data.projectId,
          name: candidate.cluster,
          clusterType: candidate.cluster.toUpperCase().replace(/\s+/g, "_"),
          description: `Phrases targeting ${candidate.cluster.toLowerCase()}`,
        }).onConflictDoNothing();
        clusterMap.set(clusterKey, clusterId);
      }
    }

    // 4. Normalize, Deduplicate, Collect Evidence, and Score
    const results = [];

    for (const candidate of generated.candidates) {
      const normalized = normalizeKeyword(candidate.keyword);
      const keywordId = `kw_${Buffer.from(normalized.canonicalText).toString("hex").substring(0, 16)}`;

      // Insert Keyword
      await db.insert(keywords).values({
        id: keywordId,
        canonicalText: normalized.canonicalText,
        displayText: normalized.displayText,
        tokenCount: normalized.tokenCount,
        characterCount: normalized.characterCount,
        language: proj.language,
        country: proj.targetMarket,
      }).onConflictDoNothing();

      // Link Cluster Member
      const clusterId = clusterMap.get(candidate.cluster.toLowerCase());
      if (clusterId) {
        await db.insert(keywordClusterMembers).values({
          id: `clm_${clusterId}_${keywordId}`,
          clusterId,
          keywordId,
          isPrimary: true,
        }).onConflictDoNothing();
      }

      // Query Marketplace Observation
      const observation = await providerRegistry.resolveKeywordObservation(
        normalized.canonicalText,
        data.allowSyntheticFallback
      );

      // Record observation if found
      if (observation) {
        const sourceId = observation.isSynthetic ? "src_synthetic_dev" : "src_marketplace_insights";
        await db.insert(keywordObservations).values({
          id: `obs_${keywordId}_${Date.now()}`,
          keywordId,
          sourceId,
          metricType: "SEARCHES_30D",
          rawValue: (observation.searches30d ?? 0).toString(),
          unit: "searches/month",
          observedAt: new Date(observation.observedAt),
          confidence: observation.confidence,
          metadataJson: JSON.stringify({
            listingCount: observation.listingCount,
            sourceName: observation.sourceName,
            isSynthetic: observation.isSynthetic,
          }),
          projectId: data.projectId,
        }).onConflictDoNothing();
      }

      // Calculate Deterministic Scores
      const demandRes = calculateDemandScore(observation?.searches30d);
      const compRes = calculateCompetitionScore(observation?.listingCount);
      const relRes = calculateProductRelevance(normalized.canonicalText, productContext);
      const intentRes = calculateBuyerIntent(normalized.canonicalText);
      const trendRes = calculateTrendScore(
        observation?.trendMomentum !== undefined && observation.trendMomentum !== null
          ? [
              { observedAt: new Date(Date.now() - 30 * 86400000), searches: Math.round((observation.searches30d || 100) * 0.8) },
              { observedAt: new Date(), searches: observation.searches30d || 100 },
            ]
          : []
      );
      const serpRes = calculateSERPOpportunity(null);
      const sellerFitRes = calculateSellerFit(candidate.cluster, productContext.category);

      const oppRes = calculateOpportunityScore({
        demand: demandRes.demandScore,
        competition: compRes.competitionOpportunityScore,
        relevance: relRes.relevanceScore,
        intent: intentRes.intentScore,
        trend: trendRes.trendScore,
        serp: serpRes.serpOpportunityScore,
        sellerFit: sellerFitRes.sellerFitScore,
      });

      const confRes = calculateConfidenceScore({
        primarySourceType: observation?.sourceType ?? "AI_GENERATED",
        observationDate: observation?.observedAt,
        availableSignalsCount: oppRes.availableSignalsCount,
        isSynthetic: observation?.isSynthetic ?? false,
      });

      const explanation = generateKeywordExplanation(
        normalized.canonicalText,
        {
          opportunityScore: oppRes.opportunityScore,
          confidenceScore: confRes.confidenceScore,
          demandScore: demandRes.demandScore,
          competitionOpportunityScore: compRes.competitionOpportunityScore,
          relevanceScore: relRes.relevanceScore,
          intentScore: intentRes.intentScore,
          trendScore: trendRes.trendScore,
        },
        {
          searches30d: observation?.searches30d,
          listingCount: observation?.listingCount,
          sourceName: observation?.sourceName,
          isSynthetic: observation?.isSynthetic,
          contradictions: relRes.contradictionsFound,
        }
      );

      // Save Scores
      const scoreId = `scr_${data.projectId}_${keywordId}`;
      await db.insert(keywordScores).values({
        id: scoreId,
        keywordId,
        projectId: data.projectId,
        productId: product.id,
        demandScore: demandRes.demandScore?.toString(),
        competitionScore: compRes.competitionOpportunityScore?.toString(),
        relevanceScore: relRes.relevanceScore.toString(),
        intentScore: intentRes.intentScore.toString(),
        trendScore: trendRes.trendScore?.toString(),
        serpScore: serpRes.serpOpportunityScore?.toString(),
        sellerFitScore: sellerFitRes.sellerFitScore?.toString(),
        opportunityScore: oppRes.opportunityScore.toString(),
        confidenceScore: confRes.confidenceScore.toString(),
        confidenceLevel: confRes.confidenceLevel,
        relevanceState: relRes.state,
        intentType: intentRes.intentType,
        scoringVersion: oppRes.formulaVersion,
        weightsJson: JSON.stringify(oppRes.weightsUsed),
        explanationJson: JSON.stringify(explanation),
      }).onConflictDoNothing();

      // Link to Project
      await db.insert(projectKeywords).values({
        id: `pkw_${data.projectId}_${keywordId}`,
        projectId: data.projectId,
        keywordId,
        isSelected: oppRes.opportunityScore >= 75 && relRes.state === "HIGHLY_RELEVANT",
        isRejected: relRes.state === "BLOCKED" || relRes.state === "CONTRADICTORY",
        rejectionReason: relRes.contradictionsFound.length > 0 ? "MISLEADING" : null,
      }).onConflictDoNothing();

      results.push({
        id: keywordId,
        keyword: normalized.displayText,
        canonicalText: normalized.canonicalText,
        cluster: candidate.cluster,
        scores: {
          opportunityScore: oppRes.opportunityScore,
          confidenceScore: confRes.confidenceScore,
          confidenceLevel: confRes.confidenceLevel,
          demandScore: demandRes.demandScore,
          competitionScore: compRes.competitionOpportunityScore,
          relevanceScore: relRes.relevanceScore,
          intentScore: intentRes.intentScore,
          trendScore: trendRes.trendScore,
          relevanceState: relRes.state,
          intentType: intentRes.intentType,
          weights: oppRes.weightsUsed,
          explanation,
        },
        observation: observation
          ? {
              searches30d: observation.searches30d,
              listingCount: observation.listingCount,
              sourceName: observation.sourceName,
              sourceType: observation.sourceType,
              isSynthetic: observation.isSynthetic,
            }
          : null,
      });
    }

    return NextResponse.json({
      success: true,
      count: results.length,
      keywords: results,
    });
  } catch (err: any) {
    console.error("Research execution error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
