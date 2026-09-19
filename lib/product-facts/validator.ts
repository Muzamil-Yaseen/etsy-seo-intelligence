import { ProductFacts, ClaimValidationIssue, ClaimValidationResult } from "./types";

// Common material keywords grouped by category
const MATERIAL_KEYWORDS: Record<string, string[]> = {
  leather: ["leather", "cowhide", "full-grain", "top-grain", "calfskin", "suede", "horween", "distressed leather"],
  wood: ["wood", "hardwood", "walnut", "oak", "maple", "cherry", "cedar", "bamboo", "timber"],
  ceramic: ["ceramic", "pottery", "stoneware", "porcelain", "clay", "earthenware", "terracotta"],
  metal_precious: ["sterling silver", "925 silver", "14k gold", "18k gold", "gold filled", "rose gold", "platinum"],
  metal_common: ["brass", "copper", "aluminum", "stainless steel", "iron", "pewter", "titanium"],
  fabric: ["cotton", "linen", "silk", "wool", "canvas", "cashmere", "velvet", "fleece", "chiffon"],
  glass: ["glass", "stained glass", "blown glass", "crystal", "borosilicate"],
};

const PERSONALIZATION_TERMS = [
  "personalized",
  "personalization",
  "customized",
  "custom engraved",
  "engraved",
  "monogram",
  "monogrammed",
  "initials",
  "custom name",
  "name engraved",
  "custom stamped",
];

const DIGITAL_TERMS = [
  "digital download",
  "instant download",
  "printable",
  "pdf template",
  "svg cut file",
  "png bundle",
  "editable canva",
  "digital file",
];

const PHYSICAL_SHIPPING_TERMS = [
  "shipped in box",
  "bubble mailer",
  "heavy packaging",
  "dispatched in cardboard",
  "protective mailer",
  "shipped in postal tube",
];

const HIGH_RISK_UNSUBSTANTIATED_TERMS = [
  "waterproof",
  "hypoallergenic",
  "indestructible",
  "certified organic",
  "pure diamond",
  "genuine ruby",
  "medical grade",
  "anti-microbial",
];

/**
 * Normalizes text for term matching (lowercased, punctuation removed).
 */
function normalizeForCheck(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Checks if a given text contains any forbidden material or feature claims
 * that are NOT substantiated by the confirmed ProductFacts.
 */
export function validateListingClaims(
  facts: ProductFacts,
  content: {
    title?: string;
    tags?: string[];
    description?: string;
  }
): ClaimValidationResult {
  const issues: ClaimValidationIssue[] = [];

  const confirmedMaterialsStr = [
    facts.primaryMaterial,
    ...(facts.secondaryMaterials || []),
  ].join(" ").toLowerCase();

  const confirmedClaimsSet = new Set(
    (facts.confirmedClaims || []).map((c) => c.toLowerCase())
  );

  const forbiddenTerms = new Set(
    (facts.forbiddenClaims || []).map((c) => c.toLowerCase())
  );

  const titleNorm = normalizeForCheck(content.title || "");
  const descNorm = normalizeForCheck(content.description || "");
  const tagsNorm = (content.tags || []).map(normalizeForCheck);

  // Helper to test a phrase across locations
  const checkForbiddenOrUnsupported = (
    term: string,
    issueType: ClaimValidationIssue["type"],
    rationale: string,
    severity: "error" | "warning" = "error"
  ) => {
    const termRegex = new RegExp(`\\b${term}\\b`, "i");

    if (content.title && termRegex.test(titleNorm)) {
      issues.push({
        type: issueType,
        term,
        location: "title",
        message: `Title contains "${term}": ${rationale}`,
        severity,
      });
    }

    if (content.description && termRegex.test(descNorm)) {
      issues.push({
        type: issueType,
        term,
        location: "description",
        message: `Description mentions "${term}": ${rationale}`,
        severity,
      });
    }

    tagsNorm.forEach((tag, idx) => {
      if (termRegex.test(tag)) {
        issues.push({
          type: issueType,
          term,
          location: "tags",
          message: `Tag #${idx + 1} ("${content.tags?.[idx]}") contains "${term}": ${rationale}`,
          severity,
        });
      }
    });
  };

  // 1. Check Seller's explicit forbidden claims
  forbiddenTerms.forEach((forbidden) => {
    checkForbiddenOrUnsupported(
      forbidden,
      "forbidden_term",
      `Explicitly designated as forbidden by seller product facts.`,
      "error"
    );
  });

  // 2. Check Material Integrity
  // If product is NOT confirmed leather, forbid leather terms
  const isConfirmedLeather = confirmedMaterialsStr.includes("leather") || confirmedMaterialsStr.includes("cowhide");
  if (!isConfirmedLeather) {
    MATERIAL_KEYWORDS.leather.forEach((term) => {
      if (!confirmedClaimsSet.has(term)) {
        checkForbiddenOrUnsupported(
          term,
          "unsupported_material",
          `Product facts state materials as "${facts.primaryMaterial}", not leather. Avoid misleading buyers.`,
          "error"
        );
      }
    });
  }

  // If product is NOT confirmed wood, forbid wood terms
  const isConfirmedWood = confirmedMaterialsStr.includes("wood") || confirmedMaterialsStr.includes("walnut") || confirmedMaterialsStr.includes("oak");
  if (!isConfirmedWood) {
    MATERIAL_KEYWORDS.wood.forEach((term) => {
      if (!confirmedClaimsSet.has(term)) {
        checkForbiddenOrUnsupported(
          term,
          "unsupported_material",
          `Product facts state materials as "${facts.primaryMaterial}", not wood/hardwood.`,
          "error"
        );
      }
    });
  }

  // If product is NOT confirmed precious metal, forbid silver/gold hallmarks
  const isConfirmedPrecious = confirmedMaterialsStr.includes("silver") || confirmedMaterialsStr.includes("gold") || confirmedMaterialsStr.includes("925");
  if (!isConfirmedPrecious) {
    MATERIAL_KEYWORDS.metal_precious.forEach((term) => {
      if (!confirmedClaimsSet.has(term)) {
        checkForbiddenOrUnsupported(
          term,
          "unsupported_material",
          `Product facts do not confirm precious metal (${term}). Etsy strictly prohibits fake metal hallmarks.`,
          "error"
        );
      }
    });
  }

  // 3. Check Personalization Integrity
  const allowsPersonalization = facts.personalization?.isOffered ?? false;
  if (!allowsPersonalization) {
    PERSONALIZATION_TERMS.forEach((term) => {
      if (!confirmedClaimsSet.has(term)) {
        checkForbiddenOrUnsupported(
          term,
          "unsupported_personalization",
          `Seller marked personalization as Not Offered. Claiming personalization leads to buyer disputes.`,
          "error"
        );
      }
    });
  }

  // 4. Check Digital vs Physical Integrity
  if (facts.productType === "digital") {
    PHYSICAL_SHIPPING_TERMS.forEach((term) => {
      checkForbiddenOrUnsupported(
        term,
        "unsupported_dimension",
        `Item is a digital file; physical shipping terms are contradictory.`,
        "error"
      );
    });
  } else if (facts.productType === "physical") {
    DIGITAL_TERMS.forEach((term) => {
      checkForbiddenOrUnsupported(
        term,
        "unsupported_dimension",
        `Item is physical handmade; digital download terminology confuses buyers.`,
        "error"
      );
    });
  }

  // 5. High Risk Unsubstantiated Claims
  HIGH_RISK_UNSUBSTANTIATED_TERMS.forEach((term) => {
    if (!confirmedClaimsSet.has(term)) {
      checkForbiddenOrUnsupported(
        term,
        "unsupported_certification",
        `Unverified claim "${term}" requires laboratory certification or explicit seller confirmation.`,
        "warning"
      );
    }
  });

  // Generate sanitized outputs if needed
  let sanitizedTitle = content.title;
  let sanitizedTags = content.tags ? [...content.tags] : undefined;

  if (sanitizedTitle) {
    issues
      .filter((i) => i.location === "title" && i.severity === "error")
      .forEach((issue) => {
        const reg = new RegExp(`\\b${issue.term}\\b`, "gi");
        sanitizedTitle = sanitizedTitle!.replace(reg, "").replace(/\s{2,}/g, " ").trim();
      });
  }

  if (sanitizedTags) {
    sanitizedTags = sanitizedTags.filter((tag) => {
      const tagNorm = normalizeForCheck(tag);
      return !issues.some(
        (i) => i.location === "tags" && i.severity === "error" && tagNorm.includes(i.term)
      );
    });
  }

  return {
    isValid: issues.filter((i) => i.severity === "error").length === 0,
    issues,
    sanitizedTitle,
    sanitizedTags,
  };
}
