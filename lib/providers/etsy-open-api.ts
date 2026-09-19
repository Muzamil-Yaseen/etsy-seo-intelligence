import {
  DataProvider,
  ProviderMetadata,
  KeywordMarketplaceObservation,
  RealCompetitorListing,
  CompetitorSearchResult,
} from "./types";

export interface EtsyApiConfig {
  apiKey?: string;
  sharedSecret?: string;
}

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class EtsyOpenApiProvider implements DataProvider {
  public metadata: ProviderMetadata = {
    id: "etsy-open-api-v3",
    name: "Etsy Open API v3 (Official)",
    sourceType: "ETSY_OPEN_API",
    qualityLevel: 2,
    isDirect: true,
    isEstimated: false,
    isAi: false,
    isSynthetic: false,
    documentationUrl: "https://developers.etsy.com/documentation/reference#operation/findAllListingsActive",
    supportedCapabilities: [
      "GET_KEYWORD_COMPETITION",
      "GET_SEARCH_RESULTS",
      "GET_LISTING_DATA",
      "GET_SHOP_METRICS",
    ],
  };

  private apiKey: string;
  private sharedSecret: string;
  private baseUrl = "https://openapi.etsy.com/v3";
  private cache = new Map<string, CacheEntry<CompetitorSearchResult>>();
  private readonly CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

  constructor(config?: EtsyApiConfig) {
    this.apiKey = config?.apiKey || process.env.ETSY_API_KEY || "";
    this.sharedSecret = config?.sharedSecret || process.env.ETSY_SHARED_SECRET || "";
  }

  public hasCapability(capability: any): boolean {
    return this.metadata.supportedCapabilities.includes(capability);
  }

  public isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.trim().length > 0;
  }

  /**
   * Searches active Etsy listings using official GET /v3/application/listings/active
   * Deduplicates by shop, caches results, and handles rate limiting cleanly.
   */
  public async searchActiveCompetitors(
    keywords: string,
    limit: number = 25
  ): Promise<CompetitorSearchResult> {
    const cleanKw = keywords.toLowerCase().trim();
    const cacheKey = `${cleanKw}_${limit}`;

    // 1. Check in-memory cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return {
        ...cached.data,
        isCached: true,
      };
    }

    if (!this.isConfigured()) {
      return {
        status: "unconfigured",
        totalListingsCount: null,
        listingsAnalyzed: 0,
        uniqueShopsCount: 0,
        listings: [],
        fetchedAt: new Date().toISOString(),
        isCached: false,
        message: "Etsy API key not configured. Add ETSY_API_KEY to environment variables to fetch live listings, or enter competitor URLs manually.",
      };
    }

    try {
      const headerKey = this.sharedSecret ? `${this.apiKey}:${this.sharedSecret}` : this.apiKey;
      const url = `${this.baseUrl}/application/listings/active?keywords=${encodeURIComponent(
        keywords
      )}&limit=${Math.min(limit, 50)}&sort_on=score&sort_order=desc&includes=Images,Shop`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(url, {
        headers: {
          "x-api-key": headerKey,
          Accept: "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.status === 429) {
        const retryAfter = res.headers.get("retry-after") || "60";
        console.warn(`Etsy API rate limited. Retry after ${retryAfter}s`);
        return {
          status: "rate_limited",
          totalListingsCount: null,
          listingsAnalyzed: 0,
          uniqueShopsCount: 0,
          listings: [],
          fetchedAt: new Date().toISOString(),
          isCached: false,
          message: `Etsy API rate limit reached. Please wait ${retryAfter} seconds before trying again.`,
        };
      }

      if (!res.ok) {
        console.warn(`Etsy API error ${res.status}: ${res.statusText} for keyword "${keywords}"`);
        return {
          status: "error",
          totalListingsCount: null,
          listingsAnalyzed: 0,
          uniqueShopsCount: 0,
          listings: [],
          fetchedAt: new Date().toISOString(),
          isCached: false,
          message: `Marketplace data temporarily unavailable (status ${res.status}).`,
        };
      }

      const data = await res.json();
      const rawResults: any[] = Array.isArray(data.results) ? data.results : [];
      const totalCount = typeof data.count === "number" ? data.count : rawResults.length;

      // Deduplicate by shop: max 2 listings per shop to prevent distortion
      const shopListingCount = new Map<number | string, number>();
      const uniqueShops = new Set<number | string>();
      const processedListings: RealCompetitorListing[] = [];

      for (const item of rawResults) {
        const shopId = item.shop_id || item.Shop?.shop_id || "unknown";
        const currentCount = shopListingCount.get(shopId) || 0;
        if (currentCount >= 2 && shopId !== "unknown") {
          continue; // Skip excess listings from the same shop
        }
        shopListingCount.set(shopId, currentCount + 1);
        if (shopId !== "unknown") uniqueShops.add(shopId);

        // Price extraction
        let priceAmount = 0;
        let currencyCode = "USD";
        if (item.price) {
          if (typeof item.price.amount === "number") {
            priceAmount = item.price.amount / (item.price.divisor || 100);
            currencyCode = item.price.currency_code || "USD";
          } else if (typeof item.price === "number") {
            priceAmount = item.price;
          }
        }

        // Image extraction
        let imageUrl: string | undefined = undefined;
        if (item.Images && Array.isArray(item.Images) && item.Images.length > 0) {
          imageUrl = item.Images[0].url_570xN || item.Images[0].url_fullxfull || item.Images[0].url_170x135;
        }

        const listingUrl = item.url || (item.listing_id ? `https://www.etsy.com/listing/${item.listing_id}` : "");

        processedListings.push({
          listingId: item.listing_id,
          title: item.title || "",
          price: {
            amount: Math.round(priceAmount * 100) / 100,
            currencyCode,
          },
          url: listingUrl,
          shopName: item.Shop?.shop_name || undefined,
          shopId: typeof shopId === "number" ? shopId : undefined,
          imageUrl,
          tags: Array.isArray(item.tags) ? item.tags : [],
          materials: Array.isArray(item.materials) ? item.materials : [],
          numFavorers: item.num_favorers,
          views: item.views,
          source: "etsy_api",
          fetchedAt: new Date().toISOString(),
          confidence: 95,
        });
      }

      const searchResult: CompetitorSearchResult = {
        status: "configured",
        totalListingsCount: totalCount,
        listingsAnalyzed: processedListings.length,
        uniqueShopsCount: uniqueShops.size,
        listings: processedListings,
        fetchedAt: new Date().toISOString(),
        isCached: false,
      };

      // Store in cache
      this.cache.set(cacheKey, {
        data: searchResult,
        expiresAt: Date.now() + this.CACHE_TTL_MS,
      });

      return searchResult;
    } catch (err: any) {
      console.error("Etsy API request error:", err);
      return {
        status: "error",
        totalListingsCount: null,
        listingsAnalyzed: 0,
        uniqueShopsCount: 0,
        listings: [],
        fetchedAt: new Date().toISOString(),
        isCached: false,
        message: "Network error connecting to Etsy API. Please retry.",
      };
    }
  }

  public async getKeywordData(keyword: string): Promise<KeywordMarketplaceObservation | null> {
    const searchData = await this.searchActiveCompetitors(keyword, 10);
    if (searchData.status !== "configured" || searchData.totalListingsCount === null) {
      return null;
    }

    return {
      keyword: keyword.toLowerCase().trim(),
      listingCount: searchData.totalListingsCount,
      observedAt: searchData.fetchedAt,
      sourceType: "ETSY_OPEN_API",
      sourceName: "Etsy Open API v3",
      isDirect: true,
      isEstimated: false,
      isSynthetic: false,
      confidence: 90,
    };
  }
}
