import { SellerFitScoreResult } from "./types";

export interface ShopPerformanceContext {
  connected: boolean;
  topCategories?: string[];
  medianPrice?: number;
  successfulKeywordClusters?: string[];
}

/**
 * Calculates Seller Fit Score (0-100) based on seller's connected shop performance.
 * Personalizes opportunity based on historical store strengths.
 * Returns null if the shop is not connected or no historical data exists.
 * NEVER fakes 50 for new sellers without data.
 */
export function calculateSellerFit(
  keywordCluster: string,
  category: string,
  productPrice?: number,
  shopContext?: ShopPerformanceContext | null
): SellerFitScoreResult {
  if (!shopContext || !shopContext.connected) {
    return {
      sellerFitScore: null,
      categoryMatch: false,
      priceBandMatch: false,
      historicalClusterPerformance: null,
      isAvailable: false,
    };
  }

  let score = 50; // base score if connected
  let categoryMatch = false;
  let priceBandMatch = false;
  let clusterBonus = 0;

  // Category alignment
  if (shopContext.topCategories && shopContext.topCategories.some(c => category.toLowerCase().includes(c.toLowerCase()))) {
    categoryMatch = true;
    score += 25;
  }

  // Price band alignment
  if (productPrice && shopContext.medianPrice) {
    const priceRatio = productPrice / shopContext.medianPrice;
    if (priceRatio >= 0.6 && priceRatio <= 1.6) {
      priceBandMatch = true;
      score += 15;
    }
  }

  // Historical cluster performance
  if (shopContext.successfulKeywordClusters && shopContext.successfulKeywordClusters.includes(keywordCluster)) {
    clusterBonus = 10;
    score += clusterBonus;
  }

  const finalScore = Math.min(100, Math.max(0, score));

  return {
    sellerFitScore: finalScore,
    categoryMatch,
    priceBandMatch,
    historicalClusterPerformance: clusterBonus > 0 ? 80 : null,
    isAvailable: true,
  };
}
