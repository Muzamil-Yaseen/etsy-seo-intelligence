import { DataProvider, KeywordMarketplaceObservation } from "./types";
import { EtsyMarketplaceInsightsProvider } from "./marketplace-insights";
import { EtsyOpenApiProvider } from "./etsy-open-api";
import { SyntheticDevelopmentProvider } from "./synthetic";

export class ProviderRegistry {
  private static instance: ProviderRegistry;
  private providers: Map<string, DataProvider> = new Map();

  public marketplaceInsights: EtsyMarketplaceInsightsProvider;
  public etsyOpenApi: EtsyOpenApiProvider;
  public syntheticProvider: SyntheticDevelopmentProvider;

  private constructor() {
    this.marketplaceInsights = new EtsyMarketplaceInsightsProvider();
    this.etsyOpenApi = new EtsyOpenApiProvider();
    this.syntheticProvider = new SyntheticDevelopmentProvider();

    this.register(this.marketplaceInsights);
    this.register(this.etsyOpenApi);
    this.register(this.syntheticProvider);
  }

  public static getInstance(): ProviderRegistry {
    if (!ProviderRegistry.instance) {
      ProviderRegistry.instance = new ProviderRegistry();
    }
    return ProviderRegistry.instance;
  }

  public register(provider: DataProvider) {
    this.providers.set(provider.metadata.id, provider);
  }

  public getProvider(id: string): DataProvider | undefined {
    return this.providers.get(id);
  }

  public getAllProviders(): DataProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Resolves marketplace observations for a keyword following the source hierarchy:
   * Level 1 (Marketplace Insights) -> Level 2 (Etsy Open API) -> Level 6 (Synthetic fallback in dev)
   * Never mixes synthetic with real data without explicit labeling.
   */
  public async resolveKeywordObservation(
    keyword: string,
    allowSyntheticFallback: boolean = false
  ): Promise<KeywordMarketplaceObservation | null> {
    // 1. Check Level 1: Marketplace Insights direct imported data
    const directInsights = await this.marketplaceInsights.getKeywordData(keyword);
    if (directInsights) {
      return directInsights;
    }

    // 2. Check Level 2: Official Etsy Open API v3
    if (this.etsyOpenApi.isConfigured()) {
      const openApiData = await this.etsyOpenApi.getKeywordData(keyword);
      if (openApiData) {
        return openApiData;
      }
    }

    // 3. Optional fallback to synthetic ONLY if explicitly allowed in isolated dev testing
    if (allowSyntheticFallback) {
      const syntheticData = await this.syntheticProvider.getKeywordData(keyword);
      if (syntheticData) {
        return syntheticData;
      }
    }

    return null;
  }
}

export const providerRegistry = ProviderRegistry.getInstance();
