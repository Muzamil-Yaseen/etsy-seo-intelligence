import { DataSourceType } from "../scoring/types";

export type ProviderCapability =
  | "GET_KEYWORD_DEMAND"
  | "GET_KEYWORD_COMPETITION"
  | "GET_RELATED_KEYWORDS"
  | "GET_KEYWORD_TREND"
  | "GET_SEARCH_RESULTS"
  | "GET_SHOP_METRICS"
  | "GET_LISTING_DATA";

export interface ProviderMetadata {
  id: string;
  name: string;
  sourceType: DataSourceType;
  qualityLevel: number; // 1 (highest) to 6 (synthetic)
  isDirect: boolean;
  isEstimated: boolean;
  isAi: boolean;
  isSynthetic: boolean;
  documentationUrl?: string;
  supportedCapabilities: ProviderCapability[];
}

export interface KeywordMarketplaceObservation {
  keyword: string;
  searches30d?: number | null;
  listingCount?: number | null;
  trendMomentum?: number | null;
  observedAt: Date | string;
  sourceType: DataSourceType;
  sourceName: string;
  isDirect: boolean;
  isEstimated: boolean;
  isSynthetic: boolean;
  confidence: number;
}

export interface RealCompetitorListing {
  listingId: number | string;
  title: string;
  price: {
    amount: number;
    currencyCode: string;
  };
  url: string;
  shopName?: string;
  shopId?: number;
  imageUrl?: string;
  tags: string[];
  materials?: string[];
  numFavorers?: number;
  views?: number;
  source: "etsy_api" | "manual_url" | "marketplace_insights";
  fetchedAt: string;
  confidence: number;
}

export interface CompetitorSearchResult {
  status: "configured" | "unconfigured" | "error" | "rate_limited";
  totalListingsCount?: number | null;
  listingsAnalyzed: number;
  uniqueShopsCount: number;
  listings: RealCompetitorListing[];
  fetchedAt: string;
  isCached: boolean;
  message?: string;
}

export interface DataProvider {
  metadata: ProviderMetadata;
  hasCapability(capability: ProviderCapability): boolean;
  getKeywordData?(keyword: string): Promise<KeywordMarketplaceObservation | null>;
}
