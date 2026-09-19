export interface DescriptionGenerationInput {
  productName: string;
  category: string;
  materials?: string;
  features?: string;
  personalization?: string;
  dimensions?: string;
  careInstructions?: string;
  primaryKeyword?: string;
  supportingKeywords?: string[];
  shippingNotes?: string;
}

export interface DescriptionAnalysisResult {
  openingParagraph: string;
  fullDescription: string;
  keywordCoverageRatio: number; // 0 to 1
  keywordsIncluded: string[];
  keywordsMissing: string[];
  productDetailCoverageRatio: number; // 0 to 1
  readabilityScore: number; // 0 to 100
  stuffingRiskScore: number; // 0 to 100
  missingProductFacts: string[];
  warnings: string[];
}

/**
 * Generates an engaging, buyer-first Etsy description with natural keyword placement.
 */
export function generateOptimizedDescription(input: DescriptionGenerationInput): DescriptionAnalysisResult {
  const primaryKw = input.primaryKeyword || input.productName;
  const materials = input.materials || "premium quality materials";
  const features = input.features || "thoughtfully engineered compartments";
  const personalization = input.personalization || "custom engraving options";
  const dimensions = input.dimensions || "4.3\" x 3.3\" (closed)";
  const care = input.careInstructions || "Condition with natural leather balm periodically to maintain rich patina.";

  // 1. Natural, non-repetitive first paragraph for buyers & SEO
  const openingParagraph = `Handcrafted with care, this ${primaryKw.toLowerCase()} combines timeless craftsmanship with modern utility. Made from genuine ${materials.toLowerCase()}, it features ${features.toLowerCase()} and ${personalization.toLowerCase()}, creating a durable, distinctive piece built for everyday use.`;

  // 2. Structured sections
  const sections = [
    openingParagraph,
    "",
    "--- FEATURES & DETAILS ---",
    `• Material: ${materials}`,
    `• Defining Features: ${features}`,
    `• Dimensions: ${dimensions}`,
    input.personalization ? `• Personalization: ${input.personalization}` : null,
    "",
    "--- HOW TO ORDER PERSONALIZATION ---",
    "1. Select your desired color or layout options.",
    "2. Enter your custom text, name, or initials in the personalization box.",
    "3. Double-check spelling and character choices before completing your order.",
    "",
    "--- CARE INSTRUCTIONS ---",
    care,
    "",
    input.shippingNotes ? `--- SHIPPING & PROCESSING ---\n${input.shippingNotes}` : null,
  ].filter((line): line is string => line !== null);

  const fullDescription = sections.join("\n");

  // Analyze Keywords Coverage
  const checkKeywords = [primaryKw, ...(input.supportingKeywords || [])].filter(Boolean);
  const lowerDesc = fullDescription.toLowerCase();
  const keywordsIncluded: string[] = [];
  const keywordsMissing: string[] = [];

  for (const kw of checkKeywords) {
    if (lowerDesc.includes(kw.toLowerCase())) {
      keywordsIncluded.push(kw);
    } else {
      keywordsMissing.push(kw);
    }
  }

  const keywordCoverageRatio = checkKeywords.length > 0 ? keywordsIncluded.length / checkKeywords.length : 1.0;

  // Missing facts check
  const missingProductFacts: string[] = [];
  if (!input.materials) missingProductFacts.push("Specific material details");
  if (!input.dimensions) missingProductFacts.push("Exact dimensions / sizing");
  if (!input.personalization) missingProductFacts.push("Personalization guidelines");

  // Readability & stuffing check
  const wordCount = fullDescription.split(/\s+/).length;
  const primaryKwOccurrences = (lowerDesc.match(new RegExp(primaryKw.toLowerCase(), "g")) || []).length;
  const stuffingRisk = Math.min(100, Math.max(0, primaryKwOccurrences > 4 ? (primaryKwOccurrences - 4) * 20 : 0));
  const readabilityScore = Math.max(60, 100 - stuffingRisk * 0.5);

  const warnings: string[] = [];
  if (stuffingRisk > 30) {
    warnings.push("Primary keyword is repeated excessively in the description body.");
  }

  return {
    openingParagraph,
    fullDescription,
    keywordCoverageRatio: Math.round(keywordCoverageRatio * 100) / 100,
    keywordsIncluded,
    keywordsMissing,
    productDetailCoverageRatio: Math.round((1 - missingProductFacts.length / 3) * 100) / 100,
    readabilityScore,
    stuffingRiskScore: stuffingRisk,
    missingProductFacts,
    warnings,
  };
}
