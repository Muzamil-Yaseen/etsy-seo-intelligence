import { OpportunityScoreResult } from "./types";
import { CURRENT_SCORING_VERSION } from "./version";

export interface ComponentScoresInput {
  demand: number | null; // 0-100 or null
  competition: number | null; // 0-100 or null
  relevance: number; // 0-100
  intent: number; // 0-100
  trend: number | null; // 0-100 or null
  serp: number | null; // 0-100 or null
  sellerFit: number | null; // 0-100 or null
}

const BASE_WEIGHTS = {
  demand: 0.26,
  competition: 0.17,
  relevance: 0.18,
  intent: 0.14,
  trend: 0.10,
  serp: 0.09,
  sellerFit: 0.06,
};

/**
 * Calculates Final Opportunity Score (0-100).
 * Dynamically re-normalizes weights when components are missing or unavailable.
 * Never inserts fake default numbers (like 50 or 0) for missing marketplace signals.
 */
export function calculateOpportunityScore(
  components: ComponentScoresInput
): OpportunityScoreResult {
  const activeWeights = {
    demand: components.demand !== null ? BASE_WEIGHTS.demand : 0,
    competition: components.competition !== null ? BASE_WEIGHTS.competition : 0,
    relevance: BASE_WEIGHTS.relevance,
    intent: BASE_WEIGHTS.intent,
    trend: components.trend !== null ? BASE_WEIGHTS.trend : 0,
    serp: components.serp !== null ? BASE_WEIGHTS.serp : 0,
    sellerFit: components.sellerFit !== null ? BASE_WEIGHTS.sellerFit : 0,
  };

  const totalAvailableWeight =
    activeWeights.demand +
    activeWeights.competition +
    activeWeights.relevance +
    activeWeights.intent +
    activeWeights.trend +
    activeWeights.serp +
    activeWeights.sellerFit;

  // Re-normalize weights to sum to 1.0
  const normalizedWeights = {
    demand: activeWeights.demand / totalAvailableWeight,
    competition: activeWeights.competition / totalAvailableWeight,
    relevance: activeWeights.relevance / totalAvailableWeight,
    intent: activeWeights.intent / totalAvailableWeight,
    trend: activeWeights.trend / totalAvailableWeight,
    serp: activeWeights.serp / totalAvailableWeight,
    sellerFit: activeWeights.sellerFit / totalAvailableWeight,
  };

  let opportunity = 0;
  let availableSignalsCount = 0;

  if (components.demand !== null) {
    opportunity += normalizedWeights.demand * components.demand;
    availableSignalsCount++;
  }
  if (components.competition !== null) {
    opportunity += normalizedWeights.competition * components.competition;
    availableSignalsCount++;
  }
  opportunity += normalizedWeights.relevance * components.relevance;
  availableSignalsCount++;
  opportunity += normalizedWeights.intent * components.intent;
  availableSignalsCount++;
  if (components.trend !== null) {
    opportunity += normalizedWeights.trend * components.trend;
    availableSignalsCount++;
  }
  if (components.serp !== null) {
    opportunity += normalizedWeights.serp * components.serp;
    availableSignalsCount++;
  }
  if (components.sellerFit !== null) {
    opportunity += normalizedWeights.sellerFit * components.sellerFit;
    availableSignalsCount++;
  }

  const finalScore = Math.round(Math.max(0, Math.min(100, opportunity)) * 100) / 100;

  return {
    opportunityScore: finalScore,
    formulaVersion: CURRENT_SCORING_VERSION,
    weightsUsed: {
      demand: Math.round(normalizedWeights.demand * 1000) / 1000,
      competition: Math.round(normalizedWeights.competition * 1000) / 1000,
      relevance: Math.round(normalizedWeights.relevance * 1000) / 1000,
      intent: Math.round(normalizedWeights.intent * 1000) / 1000,
      trend: Math.round(normalizedWeights.trend * 1000) / 1000,
      serp: Math.round(normalizedWeights.serp * 1000) / 1000,
      sellerFit: Math.round(normalizedWeights.sellerFit * 1000) / 1000,
    },
    components,
    availableSignalsCount,
    totalSignalsCount: 7,
  };
}
