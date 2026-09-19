export type RelevanceState =
  | "HIGHLY_RELEVANT"
  | "RELEVANT"
  | "WEAK"
  | "QUESTIONABLE"
  | "CONTRADICTORY"
  | "BLOCKED";

export type IntentType =
  | "BROAD_DISCOVERY"
  | "CATEGORY_BROWSING"
  | "PRODUCT_SEARCH"
  | "HIGH_PURCHASE_INTENT"
  | "RECIPIENT_SEARCH"
  | "OCCASION_SEARCH"
  | "CUSTOMIZATION_SEARCH";

export type ConfidenceLevel =
  | "VERY_HIGH"
  | "HIGH"
  | "MEDIUM"
  | "LOW"
  | "VERY_LOW";

export type TrendLabel =
  | "RISING"
  | "STABLE"
  | "DECLINING"
  | "SEASONAL"
  | "BREAKOUT"
  | "VOLATILE"
  | "INSUFFICIENT_DATA";

export type DataSourceType =
  | "ETSY_MARKETPLACE_INSIGHTS"
  | "ETSY_OPEN_API"
  | "SHOP_ANALYTICS"
  | "THIRD_PARTY"
  | "AI_GENERATED"
  | "DERIVED_COMPETITOR_OVERLAP"
  | "SYNTHETIC_DEMO";

export interface DemandScoreResult {
  demandScore: number | null; // 0-100 or null
  rawSearches30d: number | null;
  transformedDemand: number | null;
  cohortPercentile: number | null;
  isAvailable: boolean;
}

export interface CompetitionScoreResult {
  competitionOpportunityScore: number | null; // 0-100 or null (higher = less competitive)
  competitionDifficultyScore: number | null;
  rawListingCount: number | null;
  effectiveCompetition: number | null;
  isDerived: boolean;
  isAvailable: boolean;
}

export interface RelevanceScoreResult {
  relevanceScore: number; // 0-100
  state: RelevanceState;
  semanticSimilarity: number;
  categoryConsistency: number;
  attributeConsistency: number;
  lexicalAlignment: number;
  contradictionPenalty: number;
  contradictionsFound: string[];
  reason: string;
}

export interface IntentScoreResult {
  intentScore: number; // 0-100
  intentType: IntentType;
  commercialModifierFound: boolean;
  reasoning: string;
}

export interface TrendScoreResult {
  trendScore: number | null; // 0-100 (50 neutral) or null
  momentum30: number | null;
  label: TrendLabel;
  isAvailable: boolean;
  historicalPointsCount: number;
}

export interface SERPScoreResult {
  serpOpportunityScore: number | null; // 0-100 or null
  serpStrength: number | null;
  sampleSize: number;
  exactPhraseUsageRatio: number;
  dominantSellerRatio: number;
  isAvailable: boolean;
}

export interface SellerFitScoreResult {
  sellerFitScore: number | null; // 0-100 or null
  categoryMatch: boolean;
  priceBandMatch: boolean;
  historicalClusterPerformance: number | null;
  isAvailable: boolean;
}

export interface OpportunityScoreResult {
  opportunityScore: number; // 0-100
  formulaVersion: string;
  weightsUsed: {
    demand: number;
    competition: number;
    relevance: number;
    intent: number;
    trend: number;
    serp: number;
    sellerFit: number;
  };
  components: {
    demand: number | null;
    competition: number | null;
    relevance: number;
    intent: number;
    trend: number | null;
    serp: number | null;
    sellerFit: number | null;
  };
  availableSignalsCount: number;
  totalSignalsCount: number;
}

export interface ConfidenceScoreResult {
  confidenceScore: number; // 0-100
  confidenceLevel: ConfidenceLevel;
  breakdown: {
    sourceQuality: number; // 0-100 (35%)
    freshness: number; // 0-100 (20%)
    coverage: number; // 0-100 (20%)
    sampleQuality: number; // 0-100 (15%)
    crossSourceAgreement: number; // 0-100 (10%)
  };
}
