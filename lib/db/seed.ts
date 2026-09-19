import { db, initializeDatabase } from "./index";
import {
  workspaces,
  users,
  projects,
  products,
  keywords,
  keywordSources,
  keywordObservations,
  keywordClusters,
  keywordClusterMembers,
  keywordScores,
  projectKeywords,
} from "./schema";
import { SYNTHETIC_WALLET_FIXTURES } from "../providers/synthetic";
import { normalizeKeyword } from "../normalization/normalizer";
import { calculateDemandScore } from "../scoring/demand";
import { calculateCompetitionScore } from "../scoring/competition";
import { calculateProductRelevance } from "../scoring/relevance";
import { calculateBuyerIntent } from "../scoring/intent";
import { calculateTrendScore } from "../scoring/trend";
import { calculateSERPOpportunity } from "../scoring/serp";
import { calculateSellerFit } from "../scoring/seller-fit";
import { calculateOpportunityScore } from "../scoring/opportunity";
import { calculateConfidenceScore } from "../scoring/confidence";
import { generateKeywordExplanation } from "../ai/services";

export async function seedDatabase() {
  await initializeDatabase();

  const workspaceId = "ws_craft_timber";
  const userId = "usr_muzammil";
  const projectId = "proj_leather_wallet";
  const productId = "prod_wallet_bifold";

  // 1. Seed Workspace
  await db.insert(workspaces).values({
    id: workspaceId,
    name: "Craft & Timber Studio",
    slug: "craft-and-timber",
    ownerId: userId,
  }).onConflictDoNothing();

  // 2. Seed User
  await db.insert(users).values({
    id: userId,
    email: "muzammil@craftandtimber.com",
    name: "Muzammil",
    role: "owner",
  }).onConflictDoNothing();

  // 3. Seed Project
  await db.insert(projects).values({
    id: projectId,
    workspaceId,
    name: "Heritage Leather Wallets SEO",
    description: "Search optimization for handcrafted personalized full grain bifold wallets.",
    targetMarket: "US",
    language: "en",
  }).onConflictDoNothing();

  // 4. Seed Product Context
  const productContext = {
    name: "Personalized Full Grain Leather Bifold Wallet",
    description: "Handcrafted full grain cowhide leather bifold wallet with custom laser engraved initials, 6 card slots, cash compartment, and slim minimalist profile. Made from genuine full grain leather, not vegan or synthetic.",
    category: "Bags & Purses > Wallets & Money Clips > Wallets",
    materials: "Full Grain Leather, Waxed Thread",
    colors: "Vintage Brown, Rustic Black",
    sizes: "4.3\" x 3.3\"",
    styles: "Minimalist, Rustic, Vintage",
    features: "Bifold, 6 card slots, cash sleeve, slim profile",
    personalization: "Laser engraved initials, monogram, or custom text",
    recipient: "Husband, boyfriend, dad, groomsmen, men",
    occasion: "Anniversary, birthday, wedding, Father's Day, Christmas",
    useCases: "Everyday carry, travel, front pocket",
    price: "48.00",
    currency: "USD",
    hasRfid: false,
    isDigital: false,
    isAdult: true,
    isGenuineLeather: true,
    currentTitle: "Personalized Leather Wallet Men, Custom Engraved Wallet for Husband, Mens Bifold Wallet Gift, Anniversary Gift for Him",
    currentTags: JSON.stringify([
      "personalized wallet",
      "leather wallet men",
      "custom wallet",
      "mens wallet",
      "leather wallet",
      "wallet for husband",
      "gift for dad",
      "bifold wallet",
      "anniversary gift",
      "groomsmen gift",
    ]),
    currentDescription: "Our custom leather wallets are handcrafted with care. Personalized with your initials.",
  };

  await db.insert(products).values({
    id: productId,
    projectId,
    ...productContext,
  }).onConflictDoNothing();

  // 5. Seed Keyword Sources
  const syntheticSourceId = "src_synthetic_dev";
  await db.insert(keywordSources).values([
    {
      id: "src_marketplace_insights",
      providerName: "Etsy Marketplace Insights (Imported)",
      sourceType: "ETSY_MARKETPLACE_INSIGHTS",
      qualityLevel: 1,
      isDirect: true,
      isEstimated: false,
      isAi: false,
      isSynthetic: false,
      documentationUrl: "https://help.etsy.com/hc/en-us/articles/360000344268",
    },
    {
      id: "src_etsy_api",
      providerName: "Etsy Open API v3",
      sourceType: "ETSY_OPEN_API",
      qualityLevel: 2,
      isDirect: true,
      isEstimated: false,
      isAi: false,
      isSynthetic: false,
      documentationUrl: "https://developers.etsy.com",
    },
    {
      id: syntheticSourceId,
      providerName: "Synthetic Demo Fixtures",
      sourceType: "SYNTHETIC_DEMO",
      qualityLevel: 6,
      isDirect: false,
      isEstimated: false,
      isAi: false,
      isSynthetic: true,
      documentationUrl: "Demo fixture for development and offline testing",
    },
  ]).onConflictDoNothing();

  // 6. Seed Keyword Clusters
  const clusterNames = [
    "Core Product",
    "Material",
    "Personalization",
    "Recipient",
    "Occasion",
    "Style",
    "Feature",
    "Color",
  ];

  const clusterIdMap = new Map<string, string>();
  for (const name of clusterNames) {
    const clusterId = `clus_${name.toLowerCase().replace(/\s+/g, "_")}`;
    clusterIdMap.set(name, clusterId);
    await db.insert(keywordClusters).values({
      id: clusterId,
      projectId,
      name,
      clusterType: name.toUpperCase().replace(/\s+/g, "_"),
      description: `Targeting phrases related to ${name.toLowerCase()}`,
    }).onConflictDoNothing();
  }

  // 7. Process Synthetic Fixtures
  const cohortSearches = SYNTHETIC_WALLET_FIXTURES.map(f => f.searches30d);
  const cohortListings = SYNTHETIC_WALLET_FIXTURES.map(f => f.listingCount);

  for (const item of SYNTHETIC_WALLET_FIXTURES) {
    const normalized = normalizeKeyword(item.keyword);
    const keywordId = `kw_${Buffer.from(normalized.canonicalText).toString("hex").substring(0, 16)}`;

    // Insert Keyword
    await db.insert(keywords).values({
      id: keywordId,
      canonicalText: normalized.canonicalText,
      displayText: normalized.displayText,
      tokenCount: normalized.tokenCount,
      characterCount: normalized.characterCount,
      language: "en",
      country: "US",
    }).onConflictDoNothing();

    // Insert Observation (Level 6: Synthetic)
    const observationId = `obs_${keywordId}_${syntheticSourceId}`;
    await db.insert(keywordObservations).values({
      id: observationId,
      keywordId,
      sourceId: syntheticSourceId,
      metricType: "SEARCHES_30D",
      rawValue: item.searches30d.toString(),
      normalizedValue: (item.searches30d / 10000).toFixed(4),
      unit: "searches/month",
      observedAt: new Date("2026-09-15"),
      confidence: 0, // Zero production confidence
      metadataJson: JSON.stringify({
        listingCount: item.listingCount,
        trendPercentage: item.trendPercentage,
        notice: "SYNTHETIC DEMO DATA",
      }),
      projectId,
    }).onConflictDoNothing();

    // Map Cluster Member
    const clusterId = clusterIdMap.get(item.cluster);
    if (clusterId) {
      await db.insert(keywordClusterMembers).values({
        id: `clm_${clusterId}_${keywordId}`,
        clusterId,
        keywordId,
        isPrimary: true,
      }).onConflictDoNothing();
    }

    // Calculate Deterministic Scores
    const demandRes = calculateDemandScore(item.searches30d, cohortSearches);
    const compRes = calculateCompetitionScore(item.listingCount, null, cohortListings);
    const relRes = calculateProductRelevance(normalized.canonicalText, productContext);
    const intentRes = calculateBuyerIntent(normalized.canonicalText);
    const trendRes = calculateTrendScore([
      { observedAt: new Date("2026-08-01"), searches: Math.round(item.searches30d * (1 - item.trendPercentage / 100)) },
      { observedAt: new Date("2026-09-01"), searches: item.searches30d },
    ]);
    const serpRes = calculateSERPOpportunity(null); // Unavailable
    const sellerFitRes = calculateSellerFit(item.cluster, productContext.category, 48, null); // Unavailable

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
      primarySourceType: "SYNTHETIC_DEMO",
      observationDate: new Date("2026-09-15"),
      availableSignalsCount: oppRes.availableSignalsCount,
      sampleSize: 10,
      isSynthetic: true, // PRODUCTION CONFIDENCE = 0
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
        searches30d: item.searches30d,
        listingCount: item.listingCount,
        sourceName: "Synthetic Demo Fixtures",
        isSynthetic: true,
        contradictions: relRes.contradictionsFound,
      }
    );

    // Insert Keyword Score Record
    await db.insert(keywordScores).values({
      id: `scr_${projectId}_${keywordId}`,
      keywordId,
      projectId,
      productId,
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

    // Link Project Keyword
    await db.insert(projectKeywords).values({
      id: `pkw_${projectId}_${keywordId}`,
      projectId,
      keywordId,
      isSelected: oppRes.opportunityScore >= 70 && relRes.state === "HIGHLY_RELEVANT",
      isRejected: relRes.state === "BLOCKED" || relRes.state === "CONTRADICTORY",
      rejectionReason: relRes.contradictionsFound.length > 0 ? "MISLEADING" : null,
      userNotes: item.isContradictory ? "Blocked: contradicts genuine leather trait" : null,
    }).onConflictDoNothing();
  }

  console.log("Database seeded successfully with realistic demonstration dataset!");
}
