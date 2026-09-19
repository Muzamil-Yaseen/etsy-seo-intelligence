import { ConfidenceScoreResult, ConfidenceLevel, DataSourceType } from "./types";

export interface ConfidenceInput {
  primarySourceType: DataSourceType;
  observationDate?: Date | string | null;
  availableSignalsCount: number; // 1 to 7
  sampleSize?: number; // e.g. SERP sample or search cohort count
  hasConflictingSources?: boolean;
  isSynthetic?: boolean;
}

const SOURCE_QUALITY_MAP: Record<DataSourceType, number> = {
  ETSY_MARKETPLACE_INSIGHTS: 100, // Level 1 direct Etsy search data
  SHOP_ANALYTICS: 95,            // Level 3 direct seller performance
  ETSY_OPEN_API: 90,             // Level 2 official Etsy API endpoints
  DERIVED_COMPETITOR_OVERLAP: 80, // Deterministic cross-listing evidence
  THIRD_PARTY: 60,               // Level 4 estimates
  AI_GENERATED: 30,              // Level 5 semantic derivation
  SYNTHETIC_DEMO: 0,             // Level 6 demo fixtures (0 production confidence)
};

/**
 * Calculates Confidence Score (0-100) independent of Opportunity Score.
 * Formula:
 *   Confidence = 0.35 * SourceQuality + 0.20 * Freshness + 0.20 * Coverage + 0.15 * SampleQuality + 0.10 * CrossSourceAgreement
 */
export function calculateConfidenceScore(input: ConfidenceInput): ConfidenceScoreResult {
  // If synthetic data, production confidence is strictly 0
  if (input.isSynthetic || input.primarySourceType === "SYNTHETIC_DEMO") {
    return {
      confidenceScore: 0,
      confidenceLevel: "VERY_LOW",
      breakdown: {
        sourceQuality: 0,
        freshness: 0,
        coverage: 0,
        sampleQuality: 0,
        crossSourceAgreement: 0,
      },
    };
  }

  // 1. Source Quality (35%)
  const sourceQuality = SOURCE_QUALITY_MAP[input.primarySourceType] ?? 40;

  // 2. Freshness (20%)
  let freshness = 50;
  if (input.observationDate) {
    const ageDays = (Date.now() - new Date(input.observationDate).getTime()) / (1000 * 60 * 60 * 24);
    if (ageDays <= 3) freshness = 100;
    else if (ageDays <= 14) freshness = 85;
    else if (ageDays <= 30) freshness = 70;
    else if (ageDays <= 60) freshness = 45;
    else freshness = 20;
  }

  // 3. Coverage (20%) - ratio of available signals out of 7
  const coverage = Math.min(100, (Math.max(1, input.availableSignalsCount) / 7) * 100);

  // 4. Sample Quality (15%)
  let sampleQuality = 70;
  if (input.sampleSize !== undefined) {
    if (input.sampleSize >= 100) sampleQuality = 100;
    else if (input.sampleSize >= 25) sampleQuality = 85;
    else if (input.sampleSize >= 5) sampleQuality = 60;
    else sampleQuality = 30;
  }

  // 5. Cross-Source Agreement (10%)
  const crossSourceAgreement = input.hasConflictingSources ? 30 : 100;

  const rawConfidence = (
    0.35 * sourceQuality +
    0.20 * freshness +
    0.20 * coverage +
    0.15 * sampleQuality +
    0.10 * crossSourceAgreement
  );

  const confidenceScore = Math.round(Math.max(0, Math.min(100, rawConfidence)) * 100) / 100;

  let confidenceLevel: ConfidenceLevel = "MEDIUM";
  if (confidenceScore >= 90) confidenceLevel = "VERY_HIGH";
  else if (confidenceScore >= 75) confidenceLevel = "HIGH";
  else if (confidenceScore >= 55) confidenceLevel = "MEDIUM";
  else if (confidenceScore >= 35) confidenceLevel = "LOW";
  else confidenceLevel = "VERY_LOW";

  return {
    confidenceScore,
    confidenceLevel,
    breakdown: {
      sourceQuality: Math.round(sourceQuality),
      freshness: Math.round(freshness),
      coverage: Math.round(coverage),
      sampleQuality: Math.round(sampleQuality),
      crossSourceAgreement: Math.round(crossSourceAgreement),
    },
  };
}
