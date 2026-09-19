import { SERPScoreResult } from "./types";

export interface SERPSampleItem {
  title: string;
  shopId: string;
  reviewCount?: number;
  isRelevant?: boolean;
}

/**
 * Calculates SERP Opportunity Score (0-100).
 * SERP Strength reflects how tightly dominated the top search results are.
 * SERP Opportunity = 100 - SERP Strength.
 * High SERP Opportunity means competitor listings have weak keyword relevance,
 * low exact-phrase usage, or fragmented seller presence.
 */
export function calculateSERPOpportunity(
  items?: SERPSampleItem[] | null,
  keyword?: string
): SERPScoreResult {
  if (!items || items.length === 0) {
    return {
      serpOpportunityScore: null,
      serpStrength: null,
      sampleSize: 0,
      exactPhraseUsageRatio: 0,
      dominantSellerRatio: 0,
      isAvailable: false,
    };
  }

  const sampleSize = items.length;
  const kw = (keyword || "").toLowerCase().trim();

  // 1. Exact phrase usage in titles
  let exactMatchCount = 0;
  for (const item of items) {
    if (kw && item.title.toLowerCase().includes(kw)) {
      exactMatchCount++;
    }
  }
  const exactPhraseUsageRatio = exactMatchCount / sampleSize;

  // 2. Seller concentration (top shop share)
  const shopCounts = new Map<string, number>();
  for (const item of items) {
    shopCounts.set(item.shopId, (shopCounts.get(item.shopId) || 0) + 1);
  }
  let maxShopListings = 0;
  for (const count of shopCounts.values()) {
    if (count > maxShopListings) maxShopListings = count;
  }
  const dominantSellerRatio = maxShopListings / sampleSize;

  // 3. Relevant listings ratio
  const relevantCount = items.filter(i => i.isRelevant !== false).length;
  const relevantRatio = relevantCount / sampleSize;

  // SERP Strength composite
  const serpStrength = (
    relevantRatio * 45 +
    exactPhraseUsageRatio * 35 +
    dominantSellerRatio * 20
  );

  const serpOpportunity = Math.round(Math.max(0, Math.min(100, 100 - serpStrength)) * 100) / 100;

  return {
    serpOpportunityScore: serpOpportunity,
    serpStrength: Math.round(serpStrength * 100) / 100,
    sampleSize,
    exactPhraseUsageRatio: Math.round(exactPhraseUsageRatio * 100) / 100,
    dominantSellerRatio: Math.round(dominantSellerRatio * 100) / 100,
    isAvailable: true,
  };
}
