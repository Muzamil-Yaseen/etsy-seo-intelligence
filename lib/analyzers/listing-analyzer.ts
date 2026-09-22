import { validateEtsyTitle } from "../optimizers/title-optimizer";
import { validateEtsyTag, ETSY_MAX_TAGS } from "../optimizers/tag-optimizer";
import { normalizeKeyword, detectKeywordRelationship } from "../normalization/normalizer";

export interface ListingAuditInput {
  title: string;
  tags: string[];
  description: string;
  category?: string;
  materials?: string[];
  price?: number;
  attributes?: Record<string, string>;
  targetKeywords?: string[];
}

export interface ListingAuditResult {
  searchMatchReadiness: number; // 0 to 100
  titleQuality: number; // 0 to 100
  tagDiversityScore: number; // 0 to 100
  tagSlotUtilization: number; // 0 to 13
  descriptionQuality: number; // 0 to 100
  attributeCompleteness: number; // 0 to 100
  keywordCoverageRatio: number; // 0 to 1
  opportunities: string[];
  problems: string[];
  tagAudit: Array<{
    tag: string;
    isValid: boolean;
    characterCount: number;
    issue?: string;
  }>;
}

/**
 * Performs comprehensive audit of an Etsy listing's search match readiness.
 */
export function auditListing(input: ListingAuditInput): ListingAuditResult {
  const opportunities: string[] = [];
  const problems: string[] = [];

  // 1. Title Audit
  const titleValidation = validateEtsyTitle(input.title);
  const titleQuality = titleValidation.titleQualityScore;
  if (titleValidation.warnings.length > 0) {
    problems.push(...titleValidation.warnings);
  }

  // 2. Tag Audit
  const tagAudit: ListingAuditResult["tagAudit"] = [];
  const rawTags = input.tags || [];
  const normalizedTags: string[] = [];

  for (const raw of rawTags) {
    const norm = normalizeKeyword(raw).canonicalText;
    normalizedTags.push(norm);
    const valid = validateEtsyTag(norm);
    tagAudit.push({
      tag: norm,
      isValid: valid.isValid,
      characterCount: norm.length,
      issue: valid.reason,
    });
    if (!valid.isValid) {
      problems.push(`Tag "${raw}": ${valid.reason}`);
    }
  }

  // Tag count check
  const tagSlotUtilization = Math.min(ETSY_MAX_TAGS, rawTags.length);
  if (tagSlotUtilization < ETSY_MAX_TAGS) {
    const missing = ETSY_MAX_TAGS - tagSlotUtilization;
    opportunities.push(`You have ${missing} unused tag slot(s). Maximize visibility by utilizing all 13 slots.`);
  }

  // Tag redundancy & diversity
  let redundantPairs = 0;
  for (let i = 0; i < normalizedTags.length; i++) {
    for (let j = i + 1; j < normalizedTags.length; j++) {
      const rel = detectKeywordRelationship(normalizedTags[i], normalizedTags[j]);
      if (rel.relationType === "EXACT_DUPLICATE" || rel.relationType === "PLURAL_VARIANT" || rel.relationType === "WORD_ORDER_VARIANT") {
        redundantPairs++;
        problems.push(`Redundant tags detected: "${normalizedTags[i]}" and "${normalizedTags[j]}" compete for identical search queries.`);
      }
    }
  }

  const tagDiversityScore = Math.max(20, Math.round(100 - redundantPairs * 25));

  // 3. Description Audit
  const desc = input.description || "";
  let descriptionQuality = 80;
  if (desc.length < 150) {
    descriptionQuality = 40;
    problems.push("Listing description is too short; comprehensive details boost buyer confidence and conversion.");
  } else if (desc.length > 4000) {
    descriptionQuality = 70;
  }

  // 4. Attribute Completeness
  let attributeCompleteness = 50;
  const hasMaterials = input.materials && input.materials.length > 0;
  const hasCategory = !!input.category;
  if (hasMaterials) attributeCompleteness += 25;
  if (hasCategory) attributeCompleteness += 25;
  if (!hasMaterials) {
    opportunities.push("Fill out item materials in listing attributes; Etsy uses attributes as free search matching signals.");
  }

  // 5. Keyword Coverage
  const targets = input.targetKeywords || [];
  let matchedCount = 0;
  const combinedText = (input.title + " " + normalizedTags.join(" ") + " " + desc).toLowerCase();
  for (const kw of targets) {
    if (combinedText.includes(kw.toLowerCase())) {
      matchedCount++;
    }
  }
  const keywordCoverageRatio = targets.length > 0 ? matchedCount / targets.length : 1.0;

  // Composite Search Match Readiness
  const searchMatchReadiness = Math.round(
    0.35 * titleQuality +
    0.30 * (tagSlotUtilization / ETSY_MAX_TAGS * 100) +
    0.15 * tagDiversityScore +
    0.10 * descriptionQuality +
    0.10 * attributeCompleteness
  );

  if (searchMatchReadiness >= 85) {
    opportunities.push("Excellent search match readiness. Listing leverages concise title structure and diverse tag coverage.");
  } else if (searchMatchReadiness < 60) {
    opportunities.push("Consider running Title and Tag Optimization to resolve redundancy and fill missing tag slots.");
  }

  return {
    searchMatchReadiness,
    titleQuality,
    tagDiversityScore,
    tagSlotUtilization,
    descriptionQuality,
    attributeCompleteness,
    keywordCoverageRatio: Math.round(keywordCoverageRatio * 100) / 100,
    opportunities,
    problems,
    tagAudit,
  };
}

export type ReadinessStatus = "complete" | "needs_attention" | "cannot_evaluate";

export interface ReadinessCheck {
  id: string;
  label: string;
  status: ReadinessStatus;
  category: "title" | "tags" | "attributes" | "pricing" | "media" | "policy" | "description";
  recommendation?: string;
}

export interface ListingReadinessReport {
  completedCount: number;
  needsAttentionCount: number;
  cannotEvaluateCount: number;
  totalChecks: number;
  summary: string;
  overallStatus: "ready" | "needs_attention" | "incomplete";
  status: "ready" | "needs_attention" | "incomplete";
  checks: ReadinessCheck[];
}

export function evaluateListingReadiness(params: {
  title: string;
  leadKeyword: string;
  tags: string[];
  materials?: string;
  primaryColor?: string;
  dimensions?: string;
  careInstructions?: string;
  targetPrice?: number;
  marketMin?: number;
  marketMax?: number;
  competitorCount?: number;
  photoSlotsCount?: number;
  hasFaqs?: boolean;
}): ListingReadinessReport {
  const t = (params.title || "").trim();
  const leadKw = (params.leadKeyword || "").toLowerCase().trim();
  const tags = params.tags || [];
  const compCount = params.competitorCount || 0;

  const checks: ReadinessCheck[] = [
    {
      id: "title_length",
      label: t.length > 0 && t.length <= 140 ? `Title under 140 characters (${t.length} chars)` : `Title length exceeds 140 chars (${t.length}/140)`,
      status: t.length > 0 && t.length <= 140 ? "complete" : "needs_attention",
      category: "title",
      recommendation: t.length > 140 ? `Title is ${t.length} chars. Shorten to under 140 chars to comply with Etsy search limits.` : undefined,
    },
    {
      id: "title_frontloaded",
      label: leadKw && t.slice(0, 45).toLowerCase().includes(leadKw.slice(0, 15))
        ? "Lead search phrase front-loaded in first 45 chars"
        : "Lead search phrase not detected in first 45 chars",
      status: leadKw && t.slice(0, 45).toLowerCase().includes(leadKw.slice(0, 15)) ? "complete" : "needs_attention",
      category: "title",
      recommendation: "Place your primary keyword near the beginning of the title for maximum mobile click-through rate.",
    },
    {
      id: "tag_count",
      label: tags.length === 13 ? "All 13 of 13 tag slots filled" : `${tags.length} of 13 tag slots filled (${13 - tags.length} remaining)`,
      status: tags.length === 13 ? "complete" : "needs_attention",
      category: "tags",
      recommendation: tags.length < 13 ? `You have ${13 - tags.length} unused tag slot(s). Fill all 13 slots to maximize search reach.` : undefined,
    },
    {
      id: "tag_multiword",
      label: tags.length > 0 && tags.every((tag) => tag.trim().includes(" "))
        ? "Multi-word tag phrases (no single-word tags)"
        : "Some tags are single words",
      status: tags.length > 0 && tags.every((tag) => tag.trim().includes(" ")) ? "complete" : "needs_attention",
      category: "tags",
      recommendation: "Replace single-word tags with 2–3 word specific phrases under 20 characters.",
    },
    {
      id: "tag_character_limit",
      label: tags.length > 0 && tags.every((tag) => tag.trim().length <= 20)
        ? "All tags strictly under 20 characters"
        : "Some tags exceed 20 characters",
      status: tags.length > 0 && tags.every((tag) => tag.trim().length <= 20) ? "complete" : "needs_attention",
      category: "tags",
      recommendation: "Ensure each tag is 20 characters or fewer for Etsy API acceptance.",
    },
    {
      id: "price_market_range",
      label: compCount === 0
        ? "Competitive pricing benchmark"
        : params.targetPrice !== undefined &&
          params.targetPrice > 0 &&
          (params.marketMin === undefined || params.targetPrice >= params.marketMin * 0.7) &&
          (params.marketMax === undefined || params.targetPrice <= params.marketMax * 1.6)
        ? "Pricing aligned with competitor benchmarks"
        : params.targetPrice !== undefined && params.targetPrice > 0
        ? "Pricing outside competitor benchmark range"
        : "Target retail price not set",
      status: compCount === 0
        ? "cannot_evaluate"
        : params.targetPrice !== undefined &&
          params.targetPrice > 0 &&
          (params.marketMin === undefined || params.targetPrice >= params.marketMin * 0.7) &&
          (params.marketMax === undefined || params.targetPrice <= params.marketMax * 1.6)
        ? "complete"
        : "needs_attention",
      category: "pricing",
      recommendation: compCount === 0
        ? "Add 1 to 3 competitor listings to benchmark pricing against active market competitors."
        : params.targetPrice === undefined || params.targetPrice <= 0
        ? "Set your retail listing price in the pricing calculator."
        : "Position retail price within or close to the competitor median sweet spot.",
    },
    {
      id: "material_specified",
      label: Boolean(params.materials && params.materials.trim().length > 2)
        ? "Confirmed physical materials specified"
        : "Materials not specified in product facts",
      status: Boolean(params.materials && params.materials.trim().length > 2) ? "complete" : "needs_attention",
      category: "attributes",
      recommendation: "Specify exact materials in Product Facts (e.g. Stoneware Ceramic, Solid Hardwood, 925 Silver).",
    },
    {
      id: "color_specified",
      label: Boolean(params.primaryColor && params.primaryColor.trim().length > 1)
        ? "Primary color or finish specified"
        : "Primary color not specified",
      status: Boolean(params.primaryColor && params.primaryColor.trim().length > 1) ? "complete" : "needs_attention",
      category: "attributes",
      recommendation: "Fill primary color in listing attributes to appear in Etsy filter navigation.",
    },
    {
      id: "care_instructions",
      label: Boolean(params.careInstructions && params.careInstructions.trim().length > 15)
        ? "Dedicated product care instructions provided"
        : "Care guidelines missing or incomplete",
      status: Boolean(params.careInstructions && params.careInstructions.trim().length > 15) ? "complete" : "needs_attention",
      category: "description",
      recommendation: "Include step-by-step cleaning and care instructions to minimize buyer disputes.",
    },
    {
      id: "specs_or_dimensions",
      label: Boolean(params.dimensions && params.dimensions.trim().length > 2)
        ? "Dimensions, sizing, or capacity provided"
        : "Dimensions or sizing not provided",
      status: Boolean(params.dimensions && params.dimensions.trim().length > 2) ? "complete" : "needs_attention",
      category: "attributes",
      recommendation: "Provide exact height, width, depth, or liquid capacity to avoid return disputes.",
    },
    {
      id: "photo_plan",
      label: (params.photoSlotsCount || 0) >= 5
        ? "Comprehensive photo plan (10 slots planned)"
        : "Incomplete photo plan",
      status: (params.photoSlotsCount || 0) >= 5 ? "complete" : "needs_attention",
      category: "media",
      recommendation: "Plan at least 5 to 10 distinct photo angles (hero, scale, macro, lifestyle, packaging).",
    },
    {
      id: "buyer_reassurance",
      label: Boolean(params.hasFaqs)
        ? "Buyer FAQs covering dispatch and policies"
        : "Buyer FAQs not provided",
      status: Boolean(params.hasFaqs) ? "complete" : "needs_attention",
      category: "policy",
      recommendation: "Add FAQ answers addressing common pre-purchase questions.",
    },
  ];

  const completedCount = checks.filter((c) => c.status === "complete").length;
  const needsAttentionCount = checks.filter((c) => c.status === "needs_attention").length;
  const cannotEvaluateCount = checks.filter((c) => c.status === "cannot_evaluate").length;
  const totalChecks = checks.length;

  let overallStatus: ListingReadinessReport["overallStatus"] = "incomplete";
  if (completedCount >= 10) overallStatus = "ready";
  else if (completedCount >= 6) overallStatus = "needs_attention";

  return {
    completedCount,
    needsAttentionCount,
    cannotEvaluateCount,
    totalChecks,
    summary: `${completedCount} of ${totalChecks} checks complete${cannotEvaluateCount > 0 ? ` (${cannotEvaluateCount} cannot evaluate)` : ""}`,
    overallStatus,
    status: overallStatus,
    checks,
  };
}
