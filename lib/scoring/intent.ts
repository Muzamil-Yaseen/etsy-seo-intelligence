import { IntentScoreResult, IntentType } from "./types";

const CUSTOMIZATION_WORDS = ["personalized", "personalize", "custom", "engraved", "engrave", "initial", "monogram", "name", "customized"];
const RECIPIENT_WORDS = ["for husband", "for boyfriend", "for dad", "for men", "for him", "for brother", "for groomsmen", "for father", "mens gift", "gift for"];
const OCCASION_WORDS = ["anniversary", "birthday", "wedding", "christmas", "fathers day", "father's day", "graduation", "valentine", "valentines"];
const SPECIFIC_PRODUCT_WORDS = ["bifold", "trifold", "card holder", "money clip", "slim wallet", "minimalist", "rfid", "coin pocket", "front pocket"];

/**
 * Calculates Buyer Intent Score (0-100) and classifies query purchase intention.
 */
export function calculateBuyerIntent(keyword: string): IntentScoreResult {
  const normKw = keyword.toLowerCase().trim();
  const tokens = normKw.split(/\s+/).filter(Boolean);

  let intentScore = 40; // baseline
  let intentType: IntentType = "PRODUCT_SEARCH";
  let commercialModifierFound = false;
  const reasons: string[] = [];

  // Check Customization
  const hasCustomization = CUSTOMIZATION_WORDS.some(w => normKw.includes(w));
  if (hasCustomization) {
    intentScore += 25;
    commercialModifierFound = true;
    intentType = "CUSTOMIZATION_SEARCH";
    reasons.push("Explicit customization intent indicates high readiness to purchase a tailored item.");
  }

  // Check Recipient
  const hasRecipient = RECIPIENT_WORDS.some(w => normKw.includes(w));
  if (hasRecipient) {
    intentScore += 20;
    commercialModifierFound = true;
    if (intentType === "PRODUCT_SEARCH") intentType = "RECIPIENT_SEARCH";
    reasons.push("Targeted recipient phrase ('for husband', 'for dad') signals gift-buying mission.");
  }

  // Check Occasion
  const hasOccasion = OCCASION_WORDS.some(w => normKw.includes(w));
  if (hasOccasion) {
    intentScore += 18;
    commercialModifierFound = true;
    if (intentType === "PRODUCT_SEARCH") intentType = "OCCASION_SEARCH";
    reasons.push("Specific event or celebration intent points to time-sensitive buyer intent.");
  }

  // Check Specific Product Structure
  const hasSpecificFeature = SPECIFIC_PRODUCT_WORDS.some(w => normKw.includes(w));
  if (hasSpecificFeature) {
    intentScore += 15;
    reasons.push("Detailed feature descriptor indicates mature search filtering.");
  }

  // Length and Specificity Analysis
  if (tokens.length === 1) {
    intentScore = Math.min(intentScore, 35);
    intentType = "BROAD_DISCOVERY";
    reasons.push("Single-word query indicates high-funnel exploratory browsing.");
  } else if (tokens.length === 2 && !commercialModifierFound && !hasSpecificFeature) {
    intentScore = Math.min(intentScore, 60);
    if (intentType === "PRODUCT_SEARCH") intentType = "CATEGORY_BROWSING";
    reasons.push("Two-word category term with general exploratory intent.");
  } else if (tokens.length >= 3 && (hasCustomization || hasRecipient || hasSpecificFeature)) {
    if (intentScore >= 80) intentType = "HIGH_PURCHASE_INTENT";
    reasons.push("Multi-word long-tail query with multiple high-intent purchase modifiers.");
  }

  const finalScore = Math.min(100, Math.max(10, intentScore));

  return {
    intentScore: finalScore,
    intentType,
    commercialModifierFound,
    reasoning: reasons.join(" ") || "Query represents standard transactional search behavior.",
  };
}
