import { DataProvider, ProviderMetadata, KeywordMarketplaceObservation } from "./types";

export interface SyntheticFixtureKeyword {
  keyword: string;
  cluster: string;
  searches30d: number;
  listingCount: number;
  trendPercentage: number;
  intentType: string;
  isContradictory?: boolean;
}

export const SYNTHETIC_WALLET_FIXTURES: SyntheticFixtureKeyword[] = [
  // Primary Seed & Core Terms
  {
    keyword: "personalized leather wallet",
    cluster: "Personalization",
    searches30d: 4280,
    listingCount: 31500,
    trendPercentage: 18,
    intentType: "HIGH_PURCHASE_INTENT",
  },
  {
    keyword: "leather wallet",
    cluster: "Core Product",
    searches30d: 8900,
    listingCount: 78000,
    trendPercentage: 2,
    intentType: "CATEGORY_BROWSING",
  },
  {
    keyword: "mens leather wallet",
    cluster: "Core Product",
    searches30d: 6100,
    listingCount: 52000,
    trendPercentage: 5,
    intentType: "PRODUCT_SEARCH",
  },
  {
    keyword: "bifold wallet",
    cluster: "Core Product",
    searches30d: 2900,
    listingCount: 19400,
    trendPercentage: -3,
    intentType: "PRODUCT_SEARCH",
  },
  {
    keyword: "custom wallet",
    cluster: "Personalization",
    searches30d: 3800,
    listingCount: 28000,
    trendPercentage: 14,
    intentType: "CUSTOMIZATION_SEARCH",
  },
  {
    keyword: "engraved wallet",
    cluster: "Personalization",
    searches30d: 3450,
    listingCount: 24200,
    trendPercentage: 22,
    intentType: "CUSTOMIZATION_SEARCH",
  },
  {
    keyword: "initial wallet",
    cluster: "Personalization",
    searches30d: 1100,
    listingCount: 7900,
    trendPercentage: 11,
    intentType: "CUSTOMIZATION_SEARCH",
  },
  {
    keyword: "name wallet",
    cluster: "Personalization",
    searches30d: 840,
    listingCount: 6500,
    trendPercentage: 4,
    intentType: "CUSTOMIZATION_SEARCH",
  },

  // Material Terms
  {
    keyword: "full grain wallet",
    cluster: "Material",
    searches30d: 1450,
    listingCount: 9200,
    trendPercentage: 8,
    intentType: "PRODUCT_SEARCH",
  },
  {
    keyword: "genuine leather wallet",
    cluster: "Material",
    searches30d: 2600,
    listingCount: 34000,
    trendPercentage: -1,
    intentType: "PRODUCT_SEARCH",
  },
  {
    keyword: "cowhide wallet",
    cluster: "Material",
    searches30d: 950,
    listingCount: 8100,
    trendPercentage: 3,
    intentType: "PRODUCT_SEARCH",
  },

  // Recipient Terms
  {
    keyword: "wallet for husband",
    cluster: "Recipient",
    searches30d: 2800,
    listingCount: 18500,
    trendPercentage: 25,
    intentType: "RECIPIENT_SEARCH",
  },
  {
    keyword: "wallet for boyfriend",
    cluster: "Recipient",
    searches30d: 3100,
    listingCount: 21000,
    trendPercentage: 20,
    intentType: "RECIPIENT_SEARCH",
  },
  {
    keyword: "wallet for dad",
    cluster: "Recipient",
    searches30d: 2400,
    listingCount: 16800,
    trendPercentage: 15,
    intentType: "RECIPIENT_SEARCH",
  },
  {
    keyword: "mens gift wallet",
    cluster: "Recipient",
    searches30d: 1800,
    listingCount: 14200,
    trendPercentage: 12,
    intentType: "RECIPIENT_SEARCH",
  },

  // Occasion Terms
  {
    keyword: "anniversary wallet",
    cluster: "Occasion",
    searches30d: 2150,
    listingCount: 12400,
    trendPercentage: 30,
    intentType: "OCCASION_SEARCH",
  },
  {
    keyword: "birthday wallet",
    cluster: "Occasion",
    searches30d: 1200,
    listingCount: 9800,
    trendPercentage: 6,
    intentType: "OCCASION_SEARCH",
  },
  {
    keyword: "groomsmen wallet",
    cluster: "Occasion",
    searches30d: 1750,
    listingCount: 11500,
    trendPercentage: 28,
    intentType: "OCCASION_SEARCH",
  },
  {
    keyword: "fathers day wallet",
    cluster: "Occasion",
    searches30d: 1950,
    listingCount: 13200,
    trendPercentage: 35,
    intentType: "OCCASION_SEARCH",
  },

  // Style & Feature Terms
  {
    keyword: "minimalist wallet",
    cluster: "Style",
    searches30d: 5400,
    listingCount: 45000,
    trendPercentage: 9,
    intentType: "PRODUCT_SEARCH",
  },
  {
    keyword: "vintage wallet",
    cluster: "Style",
    searches30d: 2100,
    listingCount: 23000,
    trendPercentage: 1,
    intentType: "PRODUCT_SEARCH",
  },
  {
    keyword: "rustic leather wallet",
    cluster: "Style",
    searches30d: 1300,
    listingCount: 8700,
    trendPercentage: 7,
    intentType: "PRODUCT_SEARCH",
  },
  {
    keyword: "slim wallet",
    cluster: "Feature",
    searches30d: 4800,
    listingCount: 39000,
    trendPercentage: 10,
    intentType: "PRODUCT_SEARCH",
  },
  {
    keyword: "card wallet",
    cluster: "Feature",
    searches30d: 3600,
    listingCount: 31000,
    trendPercentage: 4,
    intentType: "PRODUCT_SEARCH",
  },
  {
    keyword: "rfid wallet",
    cluster: "Feature",
    searches30d: 4100,
    listingCount: 36000,
    trendPercentage: 12,
    intentType: "PRODUCT_SEARCH",
  },

  // Color Terms
  {
    keyword: "brown leather wallet",
    cluster: "Color",
    searches30d: 1850,
    listingCount: 17000,
    trendPercentage: 2,
    intentType: "PRODUCT_SEARCH",
  },
  {
    keyword: "black leather wallet",
    cluster: "Color",
    searches30d: 2200,
    listingCount: 24000,
    trendPercentage: 0,
    intentType: "PRODUCT_SEARCH",
  },

  // Contradictory & Low Relevance Examples
  {
    keyword: "vegan leather wallet",
    cluster: "Material",
    searches30d: 3200,
    listingCount: 21000,
    trendPercentage: 6,
    intentType: "PRODUCT_SEARCH",
    isContradictory: true,
  },
  {
    keyword: "faux leather wallet",
    cluster: "Material",
    searches30d: 1400,
    listingCount: 11000,
    trendPercentage: -5,
    intentType: "PRODUCT_SEARCH",
    isContradictory: true,
  },
  {
    keyword: "kids wallet",
    cluster: "Recipient",
    searches30d: 2600,
    listingCount: 18000,
    trendPercentage: 4,
    intentType: "RECIPIENT_SEARCH",
    isContradictory: true,
  },
];

export class SyntheticDevelopmentProvider implements DataProvider {
  public metadata: ProviderMetadata = {
    id: "synthetic-development-fixture",
    name: "Synthetic Demo Fixtures (Dev & Tests Only)",
    sourceType: "SYNTHETIC_DEMO",
    qualityLevel: 6,
    isDirect: false,
    isEstimated: false,
    isAi: false,
    isSynthetic: true, // EXPLICIT
    supportedCapabilities: [
      "GET_KEYWORD_DEMAND",
      "GET_KEYWORD_COMPETITION",
      "GET_KEYWORD_TREND",
      "GET_RELATED_KEYWORDS",
    ],
  };

  private fixtureMap = new Map<string, SyntheticFixtureKeyword>();

  constructor() {
    for (const item of SYNTHETIC_WALLET_FIXTURES) {
      this.fixtureMap.set(item.keyword.toLowerCase().trim(), item);
    }
  }

  public hasCapability(capability: any): boolean {
    return this.metadata.supportedCapabilities.includes(capability);
  }

  public async getKeywordData(keyword: string): Promise<KeywordMarketplaceObservation | null> {
    const norm = keyword.toLowerCase().trim();
    const item = this.fixtureMap.get(norm);
    if (!item) return null;

    return {
      keyword: item.keyword,
      searches30d: item.searches30d,
      listingCount: item.listingCount,
      trendMomentum: item.trendPercentage / 100,
      observedAt: new Date().toISOString(),
      sourceType: "SYNTHETIC_DEMO",
      sourceName: "Synthetic Demo Fixture",
      isDirect: false,
      isEstimated: false,
      isSynthetic: true,
      confidence: 0, // Zero production confidence
    };
  }

  public getAllFixtures(): SyntheticFixtureKeyword[] {
    return SYNTHETIC_WALLET_FIXTURES;
  }
}
