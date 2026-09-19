import { CandidateGenerationOutput, ExplanationOutput } from "./types";
import { ProductRelevanceContext } from "../scoring/relevance";
import { normalizeKeyword } from "../normalization/normalizer";

/**
 * Keyword Candidate Generator.
 * Expands a seed keyword across genuine semantic dimensions based on product context:
 * - Product terms
 * - Material terms
 * - Personalization terms
 * - Recipient terms
 * - Occasion terms
 * - Style terms
 * - Feature terms
 * - Color terms
 */
export async function generateKeywordCandidates(
  seedKeyword: string,
  product: ProductRelevanceContext
): Promise<CandidateGenerationOutput> {
  const normSeed = normalizeKeyword(seedKeyword).canonicalText;
  const words = normSeed.split(/\s+/).filter(Boolean);
  const primaryNoun = words.length > 2 ? words.slice(-2).join(" ") : normSeed;

  const rawMaterials = (product.materials || "").toLowerCase().split(",").map(s => s.trim()).filter(Boolean);
  const rawRecipients = (product.recipient || "").toLowerCase().split(",").map(s => s.trim()).filter(Boolean);
  const rawOccasions = (product.occasion || "").toLowerCase().split(",").map(s => s.trim()).filter(Boolean);
  const rawStyles = (product.styles || "").toLowerCase().split(",").map(s => s.trim()).filter(Boolean);
  const rawFeatures = (product.features || "").toLowerCase().split(",").map(s => s.trim()).filter(Boolean);
  const rawColors = (product.colors || "").toLowerCase().split(",").map(s => s.trim()).filter(Boolean);

  const candidates: CandidateGenerationOutput["candidates"] = [];
  const seen = new Set<string>();

  const addCandidate = (
    kw: string,
    cluster: string,
    dimension: CandidateGenerationOutput["candidates"][0]["dimension"],
    rationale: string
  ) => {
    const norm = normalizeKeyword(kw).canonicalText;
    if (norm && !seen.has(norm) && norm.length >= 3) {
      seen.add(norm);
      candidates.push({ keyword: norm, cluster, dimension, rationale });
    }
  };

  // 1. Direct Seed & Base Form
  addCandidate(normSeed, "Core Product", "PRODUCT_TERMS", "Direct seed keyword expressing core product intent.");
  if (primaryNoun !== normSeed) {
    addCandidate(primaryNoun, "Core Product", "PRODUCT_TERMS", "Core product noun.");
  }

  // 2. Custom & Crafting Variations
  addCandidate(`handmade ${primaryNoun}`, "Craftsmanship", "PRODUCT_TERMS", "Handcrafted artisan specifier.");
  addCandidate(`custom ${primaryNoun}`, "Personalization", "PERSONALIZATION_TERMS", "Customizable product variation.");
  if (product.personalization && !product.personalization.toLowerCase().includes("none") && !product.personalization.toLowerCase().includes("no")) {
    addCandidate(`personalized ${primaryNoun}`, "Personalization", "PERSONALIZATION_TERMS", "Personalized order search phrase.");
    addCandidate(`engraved ${primaryNoun}`, "Personalization", "PERSONALIZATION_TERMS", "Engraved customization search.");
  }

  // 3. Material Terms (dynamic from product materials)
  for (const mat of rawMaterials) {
    const cleanMat = mat.replace(/[^a-zA-Z\s]/g, "").trim().split(/\s+/)[0];
    if (cleanMat && cleanMat.length > 2 && !cleanMat.includes("material") && !cleanMat.includes("quality")) {
      addCandidate(`${cleanMat} ${primaryNoun}`, "Material", "MATERIAL_TERMS", `Material-specific ${cleanMat} item.`);
      if (primaryNoun !== normSeed) {
        addCandidate(`${cleanMat} ${normSeed}`, "Material", "MATERIAL_TERMS", `Full seed combined with ${cleanMat}.`);
      }
    }
  }

  // 4. Style Terms
  const stylesToUse = rawStyles.length > 0 ? rawStyles : ["vintage", "rustic", "minimalist", "classic"];
  for (const st of stylesToUse) {
    const cleanSt = st.replace(/[^a-zA-Z\s]/g, "").trim();
    if (cleanSt && cleanSt.length > 2) {
      addCandidate(`${cleanSt} ${primaryNoun}`, "Style", "STYLE_TERMS", `Aesthetic style descriptor: ${cleanSt}.`);
    }
  }

  // 5. Feature Terms
  for (const feat of rawFeatures) {
    const cleanFeat = feat.replace(/[^a-zA-Z\s]/g, "").trim();
    if (cleanFeat && cleanFeat.length > 2 && !cleanFeat.includes("design") && !cleanFeat.includes("finish")) {
      addCandidate(`${cleanFeat} ${primaryNoun}`, "Feature", "FEATURE_TERMS", `Functional feature descriptor: ${cleanFeat}.`);
    }
  }

  // 6. Color Terms
  for (const col of rawColors) {
    const cleanCol = col.replace(/[^a-zA-Z\s]/g, "").trim();
    if (cleanCol && cleanCol.length > 2) {
      addCandidate(`${cleanCol} ${primaryNoun}`, "Color", "COLOR_TERMS", `Color specific query: ${cleanCol}.`);
    }
  }

  // 7. Recipient Terms (ONLY IF relevant and specified)
  for (const rec of rawRecipients) {
    const cleanRec = rec.replace(/[^a-zA-Z\s]/g, "").trim();
    if (cleanRec && cleanRec.length > 2) {
      addCandidate(`${primaryNoun} for ${cleanRec}`, "Recipient", "RECIPIENT_TERMS", `Targeted gifting search for ${cleanRec}.`);
    }
  }

  // 8. Occasion Terms (ONLY IF relevant and specified)
  for (const occ of rawOccasions) {
    const cleanOcc = occ.replace(/[^a-zA-Z\s]/g, "").trim();
    if (cleanOcc && cleanOcc.length > 2) {
      addCandidate(`${cleanOcc} ${primaryNoun}`, "Occasion", "OCCASION_TERMS", `Occasion search for ${cleanOcc}.`);
    }
  }

  // 9. Natural descriptive combinations
  addCandidate(`unique ${primaryNoun}`, "Style", "STYLE_TERMS", "Uniqueness and bespoke craft modifier.");
  addCandidate(`gift for ${primaryNoun}`, "Gift Search", "RECIPIENT_TERMS", "Gifting search variation.");

  return { candidates };
}

/**
 * Keyword Explanation Generator.
 * Produces transparent, evidence-based reasoning for every scored keyword.
 * NEVER produces generic hype ("this keyword is amazing for SEO").
 */
export function generateKeywordExplanation(
  keyword: string,
  scores: {
    opportunityScore: number;
    confidenceScore: number;
    demandScore: number | null;
    competitionOpportunityScore: number | null;
    relevanceScore: number;
    intentScore: number;
    trendScore: number | null;
  },
  evidence: {
    searches30d?: number | null;
    listingCount?: number | null;
    sourceName?: string;
    isSynthetic?: boolean;
    contradictions?: string[];
  }
): ExplanationOutput {
  const warnings: string[] = [];

  // 1. Contradiction or Blocked check
  if (evidence.contradictions && evidence.contradictions.length > 0) {
    return {
      summary: `High risk: contradicts item traits. ${evidence.contradictions[0]}`,
      relevanceExplanation: "Fails product integrity test. Misleading keywords lead to bad reviews, high return rates, and search ranking penalties.",
      competitionExplanation: "Irrelevant to product specifications regardless of competitor counts.",
      recommendationAction: "AVOID",
      warnings: evidence.contradictions,
    };
  }

  // 2. Marketplace evidence evaluation
  let compSummary = "";
  if (evidence.listingCount !== null && evidence.listingCount !== undefined) {
    if (evidence.listingCount > 50000) {
      compSummary = `Heavy competition (${evidence.listingCount.toLocaleString()} active listings). Requires strong listing authority and exact-phrase title placement to break through.`;
    } else if (evidence.listingCount > 15000) {
      compSummary = `Moderate competition (${evidence.listingCount.toLocaleString()} listings). Healthy marketplace with room for well-optimized products.`;
    } else {
      compSummary = `Low competition (${evidence.listingCount.toLocaleString()} listings). Excellent opportunity for targeted long-tail ranking.`;
    }
  } else {
    compSummary = "Competition data pending real-time marketplace sync.";
  }

  let demandSummary = "";
  if (evidence.searches30d !== null && evidence.searches30d !== undefined) {
    if (evidence.searches30d > 5000) {
      demandSummary = `High shopper volume (${evidence.searches30d.toLocaleString()} estimated 30d searches).`;
    } else if (evidence.searches30d > 1000) {
      demandSummary = `Solid shopper interest (${evidence.searches30d.toLocaleString()} estimated 30d searches).`;
    } else {
      demandSummary = `Niche long-tail volume (${evidence.searches30d.toLocaleString()} estimated 30d searches).`;
    }
  } else {
    demandSummary = "Search demand estimated from seed clustering and marketplace averages.";
  }

  const scoreFormatted = Math.round(scores.opportunityScore);
  const action = scoreFormatted >= 60 ? "USE_IN_TAGS" : scoreFormatted >= 40 ? "SECONDARY_TARGET" : "AVOID";

  return {
    summary: `${demandSummary} ${compSummary}`,
    relevanceExplanation: `Deterministic relevance calculated at ${Math.round(scores.relevanceScore)}% based on product traits and core tokens.`,
    competitionExplanation: compSummary,
    recommendationAction: action,
    warnings,
  };
}
