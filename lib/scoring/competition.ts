import { CompetitionScoreResult } from "./types";

/**
 * Calculates Competition Opportunity Score (0-100).
 * High score = easier competitive environment (fewer or weaker competitors).
 * Low score = saturated, difficult competitive environment.
 * Formula:
 *   effectiveCompetition = rawListingCount * relevantResultRatio
 *   competitionDifficulty = PercentileRank(ln(1 + effectiveCompetition))
 *   competitionOpportunity = 100 - competitionDifficulty
 */
export function calculateCompetitionScore(
  rawListingCount: number | null | undefined,
  relevantResultRatio?: number | null,
  cohortListingCounts?: number[]
): CompetitionScoreResult {
  if (rawListingCount === null || rawListingCount === undefined || isNaN(rawListingCount) || rawListingCount < 0) {
    return {
      competitionOpportunityScore: null,
      competitionDifficultyScore: null,
      rawListingCount: null,
      effectiveCompetition: null,
      isDerived: false,
      isAvailable: false,
    };
  }

  const ratio = (relevantResultRatio !== null && relevantResultRatio !== undefined && relevantResultRatio > 0 && relevantResultRatio <= 1.0)
    ? relevantResultRatio
    : 1.0;

  const isDerived = ratio < 1.0;
  const effectiveCompetition = Math.max(0, rawListingCount * ratio);
  const transformedEff = Math.log(1 + effectiveCompetition);

  let difficultyPercentile: number;

  if (cohortListingCounts && cohortListingCounts.length > 1) {
    const transformedCohort = cohortListingCounts.map((c) => Math.log(1 + Math.max(0, c)));
    let strictlyBelow = 0;
    let equal = 0;

    for (const val of transformedCohort) {
      if (val < transformedEff) strictlyBelow++;
      else if (Math.abs(val - transformedEff) < 0.0001) equal++;
    }

    difficultyPercentile = ((strictlyBelow + 0.5 * equal) / transformedCohort.length) * 100;
  } else {
    // Reference Etsy scale:
    // log(1 + 50 listings) = 3.93 -> 35 difficulty -> 65 opportunity
    // log(1 + 1,000 listings) = 6.91 -> 61 difficulty -> 39 opportunity
    // log(1 + 10,000 listings) = 9.21 -> 81 difficulty -> 19 opportunity
    // log(1 + 80,000 listings) = 11.29 -> 100 difficulty -> 0 opportunity
    const maxReferenceLog = Math.log(1 + 80000); // ~11.29
    difficultyPercentile = Math.min(100, Math.max(0, (transformedEff / maxReferenceLog) * 100));
  }

  const roundedDifficulty = Math.round(difficultyPercentile * 100) / 100;
  const roundedOpportunity = Math.round(Math.max(0, 100 - roundedDifficulty) * 100) / 100;

  return {
    competitionOpportunityScore: roundedOpportunity,
    competitionDifficultyScore: roundedDifficulty,
    rawListingCount,
    effectiveCompetition: Math.round(effectiveCompetition),
    isDerived,
    isAvailable: true,
  };
}
