import { db, initializeDatabase } from "@/lib/db";
import { projects, products, keywords, keywordScores, keywordClusters, keywordClusterMembers } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { TagOptimizerView } from "./tag-optimizer-view";
import { seedDatabase } from "@/lib/db/seed";

export const dynamic = "force-dynamic";

export default async function TagOptimizerPage() {
  await initializeDatabase();

  let proj = (await db.select().from(projects).limit(1))[0];
  if (!proj) {
    await seedDatabase();
    proj = (await db.select().from(projects).limit(1))[0];
  }

  const prods = await db.select().from(products).where(eq(products.projectId, proj.id));
  const product = prods[0];

  // Fetch scored keywords as tag candidates
  const scores = await db
    .select({
      score: keywordScores,
      keyword: keywords,
    })
    .from(keywordScores)
    .innerJoin(keywords, eq(keywordScores.keywordId, keywords.id))
    .where(eq(keywordScores.projectId, proj.id))
    .orderBy(desc(keywordScores.opportunityScore));

  const candidates = await Promise.all(
    scores.map(async (row: any) => {
      const member = await db
        .select({ cluster: keywordClusters })
        .from(keywordClusterMembers)
        .innerJoin(keywordClusters, eq(keywordClusterMembers.clusterId, keywordClusters.id))
        .where(eq(keywordClusterMembers.keywordId, row.keyword.id))
        .limit(1);

      return {
        keyword: row.keyword.displayText,
        cluster: member[0]?.cluster.name || "General",
        opportunityScore: Number(row.score.opportunityScore),
        relevanceScore: Number(row.score.relevanceScore),
        intentScore: Number(row.score.intentScore),
        demandScore: row.score.demandScore ? Number(row.score.demandScore) : null,
        intentType: row.score.intentType,
        isContradictory: row.score.relevanceState === "BLOCKED" || row.score.relevanceState === "CONTRADICTORY",
      };
    })
  );

  return (
    <TagOptimizerView
      initialCandidates={candidates}
      productName={product ? product.name : "Handmade Item"}
    />
  );
}
