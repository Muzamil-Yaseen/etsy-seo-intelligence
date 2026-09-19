import { TrendScoreResult, TrendLabel } from "./types";

export interface HistoricalObservationPoint {
  observedAt: Date | string;
  searches: number;
}

/**
 * Calculates Trend Score (0-100) using historical observation momentum.
 * 50 = neutral / stable momentum.
 * > 50 = positive acceleration / rising.
 * < 50 = slowing down / declining.
 * Returns null if fewer than 2 historical points exist across distinct periods.
 * NEVER fakes 50 when data is missing.
 */
export function calculateTrendScore(
  history: HistoricalObservationPoint[]
): TrendScoreResult {
  if (!history || history.length < 2) {
    return {
      trendScore: null,
      momentum30: null,
      label: "INSUFFICIENT_DATA",
      isAvailable: false,
      historicalPointsCount: history?.length ?? 0,
    };
  }

  // Sort chronological
  const sorted = [...history].sort(
    (a, b) => new Date(a.observedAt).getTime() - new Date(b.observedAt).getTime()
  );

  const midpoint = Math.floor(sorted.length / 2);
  const previousPeriod = sorted.slice(0, midpoint);
  const recentPeriod = sorted.slice(midpoint);

  const prevAvg = previousPeriod.reduce((acc, p) => acc + p.searches, 0) / previousPeriod.length;
  const recentAvg = recentPeriod.reduce((acc, p) => acc + p.searches, 0) / recentPeriod.length;

  const momentum = (recentAvg - prevAvg) / Math.max(prevAvg, 1);

  // Scaled around 50:
  // momentum = 0 -> score 50 (Stable)
  // momentum = +0.50 (+50% growth) -> score 75 (Rising)
  // momentum = +1.0 (+100% growth or more) -> score 90-100 (Breakout)
  // momentum = -0.30 (-30% drop) -> score 35 (Declining)
  // momentum = -0.70 (-70% drop) -> score 15 (Declining)
  let rawScore = 50 + momentum * 50;
  rawScore = Math.max(0, Math.min(100, rawScore));
  const trendScore = Math.round(rawScore * 100) / 100;

  let label: TrendLabel = "STABLE";
  if (momentum >= 0.8) {
    label = "BREAKOUT";
  } else if (momentum >= 0.15) {
    label = "RISING";
  } else if (momentum <= -0.2) {
    label = "DECLINING";
  } else {
    label = "STABLE";
  }

  return {
    trendScore,
    momentum30: Math.round(momentum * 1000) / 1000,
    label,
    isAvailable: true,
    historicalPointsCount: history.length,
  };
}
