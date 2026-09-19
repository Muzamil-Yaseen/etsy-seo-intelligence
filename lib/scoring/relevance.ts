import { RelevanceScoreResult, RelevanceState } from "./types";

export interface ProductRelevanceContext {
  name: string;
  description?: string;
  category: string;
  materials?: string; // e.g. "Full grain leather, brass hardware"
  colors?: string;
  styles?: string;
  features?: string; // e.g. "Bifold, 6 card slots, money clip"
  personalization?: string; // e.g. "Laser engraved initials"
  recipient?: string; // e.g. "Husband, boyfriend, groomsmen, dad"
  occasion?: string; // e.g. "Anniversary, Father's Day, wedding"
  useCases?: string; // e.g. "Everyday carry, travel"
  hasRfid?: boolean;
  isDigital?: boolean;
  isAdult?: boolean;
  isGenuineLeather?: boolean;
}

/**
 * Checks for hard contradictions between product features and keyword phrase.
 */
function detectContradictions(
  normalizedKeyword: string,
  product: ProductRelevanceContext
): { contradictions: string[]; penalty: number } {
  const contradictions: string[] = [];
  let penalty = 0;

  const kw = normalizedKeyword.toLowerCase();
  const materials = (product.materials || "").toLowerCase();
  const desc = (product.description || "").toLowerCase();
  const name = product.name.toLowerCase();

  const isGenuineLeather = product.isGenuineLeather ?? (materials.includes("leather") && !materials.includes("faux") && !materials.includes("vegan"));

  // 1. Material Contradiction: Leather vs Vegan/Faux
  if (isGenuineLeather && (kw.includes("vegan") || kw.includes("faux leather") || kw.includes("pu leather") || kw.includes("cork"))) {
    contradictions.push("Product is genuine animal leather; keyword specifies vegan/faux material.");
    penalty += 85;
  }

  // 2. Material Contradiction: Vegan product vs Genuine Leather keyword
  if (materials.includes("vegan") && kw.includes("genuine leather")) {
    contradictions.push("Product is vegan/cruelty-free; keyword specifies genuine leather.");
    penalty += 85;
  }

  // 3. Feature Contradiction: RFID
  const hasRfid = product.hasRfid ?? (desc.includes("rfid") || (product.features || "").toLowerCase().includes("rfid"));
  if (!hasRfid && kw.includes("rfid")) {
    contradictions.push("Product does not feature RFID blocking protection; keyword claims RFID.");
    penalty += 80;
  }

  // 4. Physical vs Digital
  const isDigital = product.isDigital ?? (desc.includes("digital download") || desc.includes("pdf pattern") || desc.includes("svg cut file"));
  if (!isDigital && (kw.includes("digital download") || kw.includes("pdf pattern") || kw.includes("svg cut file") || kw.includes("printable"))) {
    contradictions.push("Product is a physical item; keyword specifies digital download / pattern.");
    penalty += 90;
  }

  // 5. Age group contradiction: Adult vs Kids/Baby
  const isAdult = product.isAdult ?? (!desc.includes("baby") && !desc.includes("toddler") && !desc.includes("kids"));
  if (isAdult && (kw.includes("baby wallet") || kw.includes("toddler wallet") || kw.includes("kids wallet"))) {
    contradictions.push("Product is designed for adults; keyword targets children/babies.");
    penalty += 60;
  }

  return { contradictions, penalty };
}

/**
 * Calculates deterministic Product Relevance Score (0-100) using multi-factor analysis
 * and contradiction detection.
 * Weights:
 *   Semantic similarity: 55%
 *   Category consistency: 20%
 *   Attribute consistency: 20%
 *   Lexical alignment: 5%
 */
export function calculateProductRelevance(
  keyword: string,
  product: ProductRelevanceContext,
  semanticSimOverride?: number // 0-1 if embedding cosine similarity is pre-computed
): RelevanceScoreResult {
  const normKw = keyword.toLowerCase().trim();
  const kwTokens = normKw.split(/\s+/).filter(Boolean);

  // 1. Contradiction Check
  const { contradictions, penalty } = detectContradictions(normKw, product);

  // 2. Category Consistency (20%)
  const cat = product.category.toLowerCase();
  let categoryConsistency = 30; // base score
  if (cat.includes("wallet") && normKw.includes("wallet")) categoryConsistency = 100;
  else if (cat.includes("accessories") && (normKw.includes("card holder") || normKw.includes("money clip"))) categoryConsistency = 90;
  else if (kwTokens.some(t => cat.includes(t))) categoryConsistency = 75;

  // 3. Attribute Consistency (20%)
  // Check match against materials, features, personalization, recipient, occasion, useCases
  const attributesText = [
    product.materials,
    product.colors,
    product.styles,
    product.features,
    product.personalization,
    product.recipient,
    product.occasion,
    product.useCases,
  ].filter(Boolean).join(" ").toLowerCase();

  let attributeMatches = 0;
  for (const token of kwTokens) {
    if (token.length > 2 && attributesText.includes(token)) {
      attributeMatches++;
    }
  }
  const attributeConsistency = Math.min(100, Math.round((attributeMatches / Math.max(1, kwTokens.length)) * 110));

  // 4. Lexical Alignment (5%)
  const nameDesc = (product.name + " " + (product.description || "")).toLowerCase();
  let lexicalMatches = 0;
  for (const token of kwTokens) {
    if (token.length > 2 && nameDesc.includes(token)) {
      lexicalMatches++;
    }
  }
  const lexicalAlignment = Math.min(100, Math.round((lexicalMatches / Math.max(1, kwTokens.length)) * 100));

  // 5. Semantic Similarity (55%)
  // Use provided embedding similarity (0 to 1) or compute token-overlap proxy
  let semanticSimilarity = 50;
  if (semanticSimOverride !== undefined && semanticSimOverride !== null) {
    semanticSimilarity = Math.min(100, Math.max(0, Math.round(semanticSimOverride * 100)));
  } else {
    // Deterministic lexical/semantic proxy based on matched product noun + attribute overlap
    const fullText = (product.name + " " + product.category + " " + attributesText).toLowerCase();
    let score = 20;
    if (kwTokens.some(t => (product.name.toLowerCase()).includes(t))) score += 35;
    if (kwTokens.every(t => (product.name.toLowerCase()).includes(t))) score += 20;
    if (kwTokens.some(t => attributesText.includes(t))) score += 20;
    if (kwTokens.every(t => fullText.includes(t))) score += 15;
    semanticSimilarity = Math.min(100, score);
  }

  // Base raw score
  const baseScore = (
    0.55 * semanticSimilarity +
    0.20 * categoryConsistency +
    0.20 * attributeConsistency +
    0.05 * lexicalAlignment
  );

  // Apply contradiction penalty
  const finalRelevance = Math.round(Math.max(0, Math.min(100, baseScore - penalty)) * 100) / 100;

  // Determine State
  let state: RelevanceState;
  if (contradictions.length > 0 && finalRelevance < 30) {
    state = "BLOCKED";
  } else if (contradictions.length > 0) {
    state = "CONTRADICTORY";
  } else if (finalRelevance >= 85) {
    state = "HIGHLY_RELEVANT";
  } else if (finalRelevance >= 65) {
    state = "RELEVANT";
  } else if (finalRelevance >= 40) {
    state = "WEAK";
  } else {
    state = "QUESTIONABLE";
  }

  // Human-readable explanation
  let reason = "";
  if (state === "BLOCKED" || state === "CONTRADICTORY") {
    reason = `Contradiction detected: ${contradictions.join("; ")}. This keyword misrepresents the item and must not be used.`;
  } else if (state === "HIGHLY_RELEVANT") {
    reason = "Directly describes the product identity, category, and core attributes with high accuracy.";
  } else if (state === "RELEVANT") {
    reason = "Consistent with product category and features with good buyer alignment.";
  } else if (state === "WEAK") {
    reason = "Only loosely relates to product features or describes an adjacent category.";
  } else {
    reason = "Questionable relevance to the item specifications; review before targeting.";
  }

  return {
    relevanceScore: finalRelevance,
    state,
    semanticSimilarity,
    categoryConsistency,
    attributeConsistency,
    lexicalAlignment,
    contradictionPenalty: penalty,
    contradictionsFound: contradictions,
    reason,
  };
}
