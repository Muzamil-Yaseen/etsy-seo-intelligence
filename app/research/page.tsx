import { db, initializeDatabase } from "@/lib/db";
import {
  projects,
  products,
  keywords,
  keywordScores,
  keywordClusters,
  keywordClusterMembers,
  keywordObservations,
  keywordSources,
  projectKeywords,
} from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { ResearchView } from "./research-view";
import { seedDatabase } from "@/lib/db/seed";

export const dynamic = "force-dynamic";

export default async function ResearchPage() {
  await initializeDatabase();

  let proj = (await db.select().from(projects).limit(1))[0];
  if (!proj) {
    await seedDatabase();
    proj = (await db.select().from(projects).limit(1))[0];
  }

  const prods = await db.select().from(products).where(eq(products.projectId, proj.id));
  const product = prods[0];

  // Fetch scored keywords
  const scores = await db
    .select({
      score: keywordScores,
      keyword: keywords,
      projectKeyword: projectKeywords,
    })
    .from(keywordScores)
    .innerJoin(keywords, eq(keywordScores.keywordId, keywords.id))
    .leftJoin(projectKeywords, eq(projectKeywords.keywordId, keywords.id))
    .where(eq(keywordScores.projectId, proj.id))
    .orderBy(desc(keywordScores.opportunityScore));

  const enrichedKeywords = await Promise.all(
    scores.map(async (row: any) => {
      const member = await db
        .select({ cluster: keywordClusters })
        .from(keywordClusterMembers)
        .innerJoin(keywordClusters, eq(keywordClusterMembers.clusterId, keywordClusters.id))
        .where(eq(keywordClusterMembers.keywordId, row.keyword.id))
        .limit(1);

      const obs = await db
        .select({ observation: keywordObservations, source: keywordSources })
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
        cluster: member[0]?.cluster.name || "General",
        scores: {
          opportunityScore: Number(row.score.opportunityScore),
          confidenceScore: Number(row.score.confidenceScore),
          confidenceLevel: row.score.confidenceLevel,
          demandScore: row.score.demandScore ? Number(row.score.demandScore) : null,
          competitionScore: row.score.competitionScore ? Number(row.score.competitionScore) : null,
          relevanceScore: Number(row.score.relevanceScore),
          intentScore: Number(row.score.intentScore),
          trendScore: row.score.trendScore ? Number(row.score.trendScore) : null,
          relevanceState: row.score.relevanceState,
          intentType: row.score.intentType,
          weights: parsedWeights,
          explanation: parsedExplanation,
        },
        observation: obs[0]
          ? {
              searches30d: Number(obs[0].observation.rawValue),
              listingCount: obs[0].observation.metadataJson ? JSON.parse(obs[0].observation.metadataJson).listingCount : null,
              sourceName: obs[0].source?.providerName || "Marketplace Observation",
              sourceType: obs[0].source?.sourceType || "UNKNOWN",
              isSynthetic: obs[0].source?.isSynthetic ?? false,
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

  return (
    <ResearchView
      initialKeywords={enrichedKeywords}
      projectId={proj.id}
      product={{
        id: product.id,
        name: product.name,
        category: product.category,
        materials: product.materials,
        features: product.features,
      }}
    />
  );
}
