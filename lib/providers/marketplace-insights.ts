import { DataProvider, ProviderMetadata, KeywordMarketplaceObservation } from "./types";

export interface MarketplaceInsightsEntry {
  keyword: string;
  searches30d: number;
  listingCount: number;
  trendPercentage?: number;
  similarTerms?: string[];
  observedAt?: Date | string;
}

export class EtsyMarketplaceInsightsProvider implements DataProvider {
  public metadata: ProviderMetadata = {
    id: "etsy-marketplace-insights",
    name: "Etsy Marketplace Insights (User Import)",
    sourceType: "ETSY_MARKETPLACE_INSIGHTS",
    qualityLevel: 1, // Highest marketplace quality
    isDirect: true,
    isEstimated: false,
    isAi: false,
    isSynthetic: false,
    documentationUrl: "https://help.etsy.com/hc/en-us/articles/360000344268-Marketplace-Insights",
    supportedCapabilities: [
      "GET_KEYWORD_DEMAND",
      "GET_KEYWORD_COMPETITION",
      "GET_RELATED_KEYWORDS",
      "GET_KEYWORD_TREND",
    ],
  };

  private importedData = new Map<string, KeywordMarketplaceObservation>();

  public hasCapability(capability: any): boolean {
    return this.metadata.supportedCapabilities.includes(capability);
  }

  /**
   * Ingests validated entries from Etsy Shop Manager Marketplace Insights
   * entered manually or imported via CSV/paste.
   */
  public ingestEntries(entries: MarketplaceInsightsEntry[]) {
    for (const entry of entries) {
      const normalized = entry.keyword.toLowerCase().trim();
      this.importedData.set(normalized, {
        keyword: normalized,
        searches30d: entry.searches30d,
        listingCount: entry.listingCount,
        trendMomentum: entry.trendPercentage ? entry.trendPercentage / 100 : null,
        observedAt: entry.observedAt || new Date().toISOString(),
        sourceType: "ETSY_MARKETPLACE_INSIGHTS",
        sourceName: "Etsy Marketplace Insights",
        isDirect: true,
        isEstimated: false,
        isSynthetic: false,
        confidence: 95,
      });
    }
  }

  public async getKeywordData(keyword: string): Promise<KeywordMarketplaceObservation | null> {
    const norm = keyword.toLowerCase().trim();
    return this.importedData.get(norm) || null;
  }
}
