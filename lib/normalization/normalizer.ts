export interface NormalizedKeywordResult {
  originalText: string;
  canonicalText: string;
  displayText: string;
  tokenCount: number;
  characterCount: number;
  tokens: string[];
}

export type VariantRelationType =
  | "EXACT_DUPLICATE"
  | "PLURAL_VARIANT"
  | "WORD_ORDER_VARIANT"
  | "SPELLING_VARIANT"
  | "RELATED"
  | "DISTINCT";

/**
 * Normalizes keyword according to Etsy SEO standards:
 * - Unicode NFKC normalization
 * - Lowercases for matching
 * - Cleans and standardizes apostrophes (’ -> ') and hyphens (– — -> -)
 * - Collapses duplicate whitespace
 * - Preserves essential intent words (does not strip 'for', 'with', 'and')
 */
export function normalizeKeyword(rawText: string): NormalizedKeywordResult {
  if (!rawText) {
    return {
      originalText: "",
      canonicalText: "",
      displayText: "",
      tokenCount: 0,
      characterCount: 0,
      tokens: [],
    };
  }

  const originalText = rawText.trim();

  // 1. Unicode normalization
  let cleaned = originalText.normalize("NFKC");

  // 2. Standardize quotation marks, apostrophes, dashes
  cleaned = cleaned
    .replace(/[\u2018\u2019\u201B\u2032]/g, "'")
    .replace(/[\u201C\u201D\u2033]/g, '"')
    .replace(/[\u2013\u2014\u2015]/g, "-");

  // 3. Remove accidental noise punctuation (like trailing periods, exclamation marks, excessive commas)
  cleaned = cleaned.replace(/[!?;:#$%&*+=\\^~]/g, " ");

  // 4. Lowercase and collapse whitespace
  cleaned = cleaned.toLowerCase().replace(/\s+/g, " ").trim();

  // 5. Build display text (proper capitalization or clean lowercase)
  const displayText = cleaned;
  const canonicalText = cleaned;

  const tokens = canonicalText.split(" ").filter(Boolean);

  return {
    originalText,
    canonicalText,
    displayText,
    tokenCount: tokens.length,
    characterCount: canonicalText.length,
    tokens,
  };
}

/**
 * Compares two keywords to determine their relationship:
 * EXACT_DUPLICATE, PLURAL_VARIANT, WORD_ORDER_VARIANT, SPELLING_VARIANT, RELATED, or DISTINCT.
 */
export function detectKeywordRelationship(
  kw1: string,
  kw2: string
): { relationType: VariantRelationType; similarityScore: number } {
  const norm1 = normalizeKeyword(kw1);
  const norm2 = normalizeKeyword(kw2);

  if (norm1.canonicalText === norm2.canonicalText) {
    return { relationType: "EXACT_DUPLICATE", similarityScore: 1.0 };
  }

  // Check Word Order Variant: e.g. "wallet leather" vs "leather wallet"
  const sorted1 = [...norm1.tokens].sort().join(" ");
  const sorted2 = [...norm2.tokens].sort().join(" ");
  if (sorted1 === sorted2) {
    return { relationType: "WORD_ORDER_VARIANT", similarityScore: 0.95 };
  }

  // Check Plural / Singular Variant: e.g. "mens leather wallet" vs "mens leather wallets"
  const singular1 = norm1.tokens.map(t => t.endsWith("s") && t.length > 3 ? t.slice(0, -1) : t).sort().join(" ");
  const singular2 = norm2.tokens.map(t => t.endsWith("s") && t.length > 3 ? t.slice(0, -1) : t).sort().join(" ");
  if (singular1 === singular2) {
    return { relationType: "PLURAL_VARIANT", similarityScore: 0.90 };
  }

  // Check Token Overlap (Jaccard)
  const set1 = new Set(norm1.tokens);
  const set2 = new Set(norm2.tokens);
  let intersection = 0;
  for (const t of set1) {
    if (set2.has(t)) intersection++;
  }
  const union = new Set([...norm1.tokens, ...norm2.tokens]).size;
  const jaccard = union > 0 ? intersection / union : 0;

  if (jaccard >= 0.65) {
    return { relationType: "RELATED", similarityScore: Math.round(jaccard * 100) / 100 };
  }

  return { relationType: "DISTINCT", similarityScore: Math.round(jaccard * 100) / 100 };
}
