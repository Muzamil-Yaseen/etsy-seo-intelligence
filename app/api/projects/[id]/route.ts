import { NextResponse } from "next/server";
import { db, initializeDatabase } from "@/lib/db";
import {
  projects,
  products,
  keywords,
  keywordScores,
  projectKeywords,
  keywordClusters,
  keywordClusterMembers,
  keywordObservations,
  keywordSources,
} from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await initializeDatabase();
  const { id: projectId } = await params;

  const proj = (await db.select().from(projects).where(eq(projects.id, projectId)))[0];
  if (!proj) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const prods = await db.select().from(products).where(eq(products.projectId, projectId));
  const product = prods[0] || null;

  const clusters = await db.select().from(keywordClusters).where(eq(keywordClusters.projectId, projectId));

  // Fetch scored keywords for this project
  const scores = await db
    .select({
      score: keywordScores,
      keyword: keywords,
      projectKeyword: projectKeywords,
    })
    .from(keywordScores)
    .innerJoin(keywords, eq(keywordScores.keywordId, keywords.id))
    .leftJoin(
      projectKeywords,
      eq(projectKeywords.keywordId, keywords.id)
    )
    .where(eq(keywordScores.projectId, projectId))
    .orderBy(desc(keywordScores.opportunityScore));

  // Enrich with observations & cluster
  const enrichedKeywords = await Promise.all(
    scores.map(async (row: any) => {
      // Find primary cluster
      const member = await db
        .select({
          cluster: keywordClusters,
        })
        .from(keywordClusterMembers)
        .innerJoin(keywordClusters, eq(keywordClusterMembers.clusterId, keywordClusters.id))
        .where(eq(keywordClusterMembers.keywordId, row.keyword.id))
        .limit(1);

      // Find latest observation
      const obs = await db
        .select({
          observation: keywordObservations,
          source: keywordSources,
        })
        .from(keywordObservations)
        .leftJoin(keywordSources, eq(keywordObservations.sourceId, keywordSources.id))
        .where(eq(keywordObservations.keywordId, row.keyword.id))
        .orderBy(desc(keywordObservations.observedAt))
        .limit(1);

      let parsedExplanation = null;
      try {
        parsedExplanation = JSON.parse(row.score.explanationJson);
      } catch (e) {
        parsedExplanation = { summary: row.score.explanationJson };
      }

      let parsedWeights = null;
      try {
        parsedWeights = JSON.parse(row.score.weightsJson);
      } catch (e) {}

      return {
        id: row.keyword.id,
        keyword: row.keyword.displayText,
        canonicalText: row.keyword.canonicalText,
        tokenCount: row.keyword.tokenCount,
        characterCount: row.keyword.characterCount,
        cluster: member[0]?.cluster.name || "General",
        clusterType: member[0]?.cluster.clusterType || "GENERAL",
        scores: {
          opportunityScore: Number(row.score.opportunityScore),
          confidenceScore: Number(row.score.confidenceScore),
          confidenceLevel: row.score.confidenceLevel,
          demandScore: row.score.demandScore ? Number(row.score.demandScore) : null,
          competitionScore: row.score.competitionScore ? Number(row.score.competitionScore) : null,
          relevanceScore: Number(row.score.relevanceScore),
          intentScore: Number(row.score.intentScore),
          trendScore: row.score.trendScore ? Number(row.score.trendScore) : null,
          serpScore: row.score.serpScore ? Number(row.score.serpScore) : null,
          sellerFitScore: row.score.sellerFitScore ? Number(row.score.sellerFitScore) : null,
          relevanceState: row.score.relevanceState,
          intentType: row.score.intentType,
          scoringVersion: row.score.scoringVersion,
          weights: parsedWeights,
          explanation: parsedExplanation,
          calculatedAt: row.score.calculatedAt,
        },
        observation: obs[0]
          ? {
              metricType: obs[0].observation.metricType,
              rawValue: Number(obs[0].observation.rawValue),
              unit: obs[0].observation.unit,
              observedAt: obs[0].observation.observedAt,
              sourceName: obs[0].source?.providerName || "Imported",
              sourceType: obs[0].source?.sourceType || "UNKNOWN",
              isDirect: obs[0].source?.isDirect ?? false,
              isEstimated: obs[0].source?.isEstimated ?? false,
              isSynthetic: obs[0].source?.isSynthetic ?? false,
              metadata: obs[0].observation.metadataJson ? JSON.parse(obs[0].observation.metadataJson) : null,
            }
          : null,
        userState: {
          isSelected: row.projectKeyword?.isSelected ?? false,
          isRejected: row.projectKeyword?.isRejected ?? false,
          rejectionReason: row.projectKeyword?.rejectionReason ?? null,
          userNotes: row.projectKeyword?.userNotes ?? null,
        },
      };
    })
  );

  return NextResponse.json({
    project: proj,
    product,
    clusters,
    keywords: enrichedKeywords,
  });
}
