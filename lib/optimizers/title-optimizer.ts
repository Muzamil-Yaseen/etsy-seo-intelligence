export interface TitleValidationResult {
  title: string;
  characterCount: number; // Max 140
  wordCount: number; // Guidance: < 15 words
  isUnderCharacterLimit: boolean;
  isUnderWordGuideline: boolean;
  productNounPosition: number; // 0 = first word, 1 = second, etc.
  repeatedWords: string[];
  repeatedWordCount: number;
  stuffingRiskScore: number; // 0 to 100 (0 = clean readable, 100 = heavily stuffed)
  titleQualityScore: number; // 0 to 100
  searchRelevanceScore: number; // 0 to 100
  readabilityScore: number; // 0 to 100
  guidelineComplianceScore: number; // 0 to 100
  warnings: string[];
  recommendations: string[];
}

export interface TitleGenerationInput {
  productNoun: string; // e.g. "Bifold Wallet"
  primaryKeyword?: string; // e.g. "Personalized Leather Wallet"
  primaryMaterial?: string; // e.g. "Full Grain Leather"
  personalizationType?: string; // e.g. "Custom Engraved Initials"
  definingFeature?: string; // e.g. "Slim RFID Card Slots"
  recipient?: string; // e.g. "Men"
  color?: string; // e.g. "Vintage Brown"
}

export const ETSY_MAX_TITLE_CHARS = 140;
export const ETSY_RECOMMENDED_MAX_WORDS = 15;

const STOP_WORDS = new Set(["with", "and", "for", "the", "in", "a", "an", "of", "to", "by", "&", "-"]);

/**
 * Validates any listing title against Etsy's search and readability standards.
 */
export function validateEtsyTitle(
  title: string,
  primaryKeyword?: string,
  productNoun?: string
): TitleValidationResult {
  const cleanTitle = title.trim();
  const characterCount = cleanTitle.length;
  const words = cleanTitle.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const warnings: string[] = [];
  const recommendations: string[] = [];

  // 1. Character length check
  const isUnderCharacterLimit = characterCount <= ETSY_MAX_TITLE_CHARS;
  if (!isUnderCharacterLimit) {
    warnings.push(`Exceeds Etsy 140 character limit (${characterCount}/${ETSY_MAX_TITLE_CHARS}).`);
  }

  // 2. Word count guideline check
  const isUnderWordGuideline = wordCount <= ETSY_RECOMMENDED_MAX_WORDS;
  if (!isUnderWordGuideline) {
    warnings.push(`Exceeds recommended 15 words (${wordCount} words). Modern Etsy search favors concise, scannable titles.`);
  }

  // 3. Repeated words and keyword stuffing detection
  const wordFrequencies = new Map<string, number>();
  const normalizedWords = words.map(w => w.toLowerCase().replace(/[^a-z0-9]/g, "")).filter(w => w.length > 2 && !STOP_WORDS.has(w));

  for (const w of normalizedWords) {
    wordFrequencies.set(w, (wordFrequencies.get(w) || 0) + 1);
  }

  const repeatedWords: string[] = [];
  let excessRepetitions = 0;
  for (const [w, count] of wordFrequencies.entries()) {
    if (count > 1) {
      repeatedWords.push(w);
      excessRepetitions += (count - 1);
    }
  }

  // Comma salad check (e.g. "Leather Wallet, Mens Wallet, Wallet Gift, Dad Gift")
  const commaCount = (cleanTitle.match(/,/g) || []).length;
  const isCommaSalad = commaCount >= 3;
  if (isCommaSalad) {
    warnings.push("Contains repeated comma-separated keyword blocks ('comma salad'). Etsy discourages this in favor of human readability.");
  }

  // Product noun position
  let productNounPosition = 999;
  if (productNoun) {
    const nounNorm = productNoun.toLowerCase();
    const idx = cleanTitle.toLowerCase().indexOf(nounNorm);
    if (idx !== -1) {
      const wordsBefore = cleanTitle.substring(0, idx).split(/\s+/).filter(Boolean).length;
      productNounPosition = wordsBefore;
    }
  } else {
    // Default check first 3 words
    productNounPosition = 1;
  }

  if (productNounPosition > 4) {
    warnings.push("Main product noun appears late in the title. Place what the item is within the first 3-5 words for mobile search scanability.");
  }

  // Calculate Stuffing Risk (0 to 100)
  let stuffingRisk = excessRepetitions * 20 + (isCommaSalad ? 30 : 0);
  if (wordCount > 18) stuffingRisk += 20;
  stuffingRisk = Math.min(100, Math.max(0, stuffingRisk));

  // Calculate Readability (0 to 100)
  let readability = 100 - stuffingRisk * 0.6;
  if (wordCount > ETSY_RECOMMENDED_MAX_WORDS) readability -= (wordCount - ETSY_RECOMMENDED_MAX_WORDS) * 4;
  if (isCommaSalad) readability -= 20;
  readability = Math.round(Math.min(100, Math.max(10, readability)));

  // Calculate Search Relevance (0 to 100)
  let relevance = 80;
  if (primaryKeyword && cleanTitle.toLowerCase().includes(primaryKeyword.toLowerCase())) {
    relevance = 95;
  }
  if (productNoun && cleanTitle.toLowerCase().includes(productNoun.toLowerCase())) {
    relevance = Math.max(relevance, 90);
  }

  // Calculate Guideline Compliance (0 to 100)
  let compliance = 100;
  if (!isUnderCharacterLimit) compliance -= 40;
  if (!isUnderWordGuideline) compliance -= 15;
  if (isCommaSalad) compliance -= 20;
  if (excessRepetitions > 0) compliance -= excessRepetitions * 10;
  compliance = Math.round(Math.min(100, Math.max(10, compliance)));

  // Title Quality Score
  const titleQualityScore = Math.round(
    0.35 * compliance +
    0.35 * readability +
    0.30 * relevance
  );

  if (cleanTitle.includes("$") || cleanTitle.toLowerCase().includes("free shipping")) {
    warnings.push("Etsy title guidance prohibits price and shipping terms in titles.");
    compliance = Math.max(10, compliance - 25);
  }

  if (warnings.length === 0) {
    recommendations.push("Title adheres to modern Etsy guidelines: concise, readable, and front-loads key product traits.");
  } else {
    recommendations.push("Simplify repetitive words and present the item as a single natural, descriptive phrase.");
  }

  return {
    title: cleanTitle,
    characterCount,
    wordCount,
    isUnderCharacterLimit,
    isUnderWordGuideline,
    productNounPosition,
    repeatedWords,
    repeatedWordCount: excessRepetitions,
    stuffingRiskScore: stuffingRisk,
    titleQualityScore,
    searchRelevanceScore: relevance,
    readabilityScore: readability,
    guidelineComplianceScore: compliance,
    warnings,
    recommendations,
  };
}

/**
 * Generates an Etsy-compliant, natural title following modern search best practices.
 */
export function generateCompliantTitle(input: TitleGenerationInput): string {
  const parts: string[] = [];

  // 1. Personalization or Key modifier (if defining)
  if (input.personalizationType) {
    parts.push("Personalized");
  }

  // 2. Material (objective trait)
  if (input.primaryMaterial && !input.productNoun.toLowerCase().includes(input.primaryMaterial.toLowerCase())) {
    parts.push(input.primaryMaterial);
  }

  // 3. Core Product Noun
  parts.push(input.productNoun);

  // 4. Defining feature or Personalization details
  if (input.personalizationType && input.personalizationType.toLowerCase() !== "personalized") {
    parts.push(`with ${input.personalizationType}`);
  } else if (input.definingFeature) {
    parts.push(`with ${input.definingFeature}`);
  }

  // 5. Recipient if essential
  if (input.recipient && !parts.some(p => p.toLowerCase().includes(input.recipient!.toLowerCase()))) {
    parts.push(`for ${input.recipient}`);
  }

  let fullTitle = parts.join(" ");

  // Ensure title stays under 140 chars
  if (fullTitle.length > ETSY_MAX_TITLE_CHARS) {
    fullTitle = fullTitle.substring(0, ETSY_MAX_TITLE_CHARS - 3) + "...";
  }

  return fullTitle;
}
