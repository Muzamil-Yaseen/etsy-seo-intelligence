import { DemandScoreResult } from "./types";

/**
 * Calculates deterministic Demand Score (0-100) based on 30-day search volume.
 * Uses logarithmic transformation ln(1 + searches30d) to avoid volume skew.
 * Ranks against the cohort if provided, otherwise uses standard log reference scaling.
 */
export function calculateDemandScore(
  searches30d: number | null | undefined,
  cohortSearches?: number[]
): DemandScoreResult {
  if (searches30d === null || searches30d === undefined || isNaN(searches30d) || searches30d < 0) {
    return {
      demandScore: null,
      rawSearches30d: null,
      transformedDemand: null,
      cohortPercentile: null,
      isAvailable: false,
    };
  }

  const transformedDemand = Math.log(1 + searches30d);

  let percentile: number;

  if (cohortSearches && cohortSearches.length > 1) {
    const transformedCohort = cohortSearches.map((s) => Math.log(1 + Math.max(0, s)));
    let strictlyBelow = 0;
    let equal = 0;

    for (const val of transformedCohort) {
      if (val < transformedDemand) strictlyBelow++;
      else if (Math.abs(val - transformedDemand) < 0.0001) equal++;
    }

    percentile = ((strictlyBelow + 0.5 * equal) / transformedCohort.length) * 100;
  } else {
    // Standard baseline scale for Etsy search volume:
    // log(1 + 0) = 0 -> 0 score
    // log(1 + 10) = 2.40 -> 25 score
    // log(1 + 250) = 5.52 -> 57 score
    // log(1 + 2,000) = 7.60 -> 79 score
    // log(1 + 15,000) = 9.61 -> 100 score
    const maxReferenceLog = Math.log(1 + 15000); // ~9.615
    percentile = Math.min(100, Math.max(0, (transformedDemand / maxReferenceLog) * 100));
  }

  const demandScore = Math.round(Math.min(100, Math.max(0, percentile)) * 100) / 100;

  return {
    demandScore,
    rawSearches30d: searches30d,
    transformedDemand: Math.round(transformedDemand * 1000) / 1000,
    cohortPercentile: Math.round(percentile * 100) / 100,
    isAvailable: true,
  };
}
