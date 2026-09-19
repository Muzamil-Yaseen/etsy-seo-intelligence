export type EtsyRegion = "US" | "UK" | "CA" | "AU" | "EU";

export interface RegionFeeConfig {
  region: EtsyRegion;
  countryName: string;
  currencyCode: string;
  currencySymbol: string;
  listingFee: number;
  transactionPercent: number;
  paymentPercent: number;
  paymentFixed: number;
  regulatoryOperatingPercent?: number;
}

export const ETSY_REGIONS: Record<EtsyRegion, RegionFeeConfig> = {
  US: {
    region: "US",
    countryName: "United States",
    currencyCode: "USD",
    currencySymbol: "$",
    listingFee: 0.20,
    transactionPercent: 0.065, // 6.5%
    paymentPercent: 0.03,      // 3.0%
    paymentFixed: 0.25,        // $0.25
  },
  UK: {
    region: "UK",
    countryName: "United Kingdom",
    currencyCode: "GBP",
    currencySymbol: "£",
    listingFee: 0.16,
    transactionPercent: 0.065, // 6.5%
    paymentPercent: 0.04,      // 4.0%
    paymentFixed: 0.20,        // £0.20
    regulatoryOperatingPercent: 0.0032, // 0.32% UK regulatory operating fee
  },
  CA: {
    region: "CA",
    countryName: "Canada",
    currencyCode: "CAD",
    currencySymbol: "CA$",
    listingFee: 0.28,
    transactionPercent: 0.065, // 6.5%
    paymentPercent: 0.03,      // 3.0%
    paymentFixed: 0.25,        // $0.25 CAD
    regulatoryOperatingPercent: 0.0015, // 0.15% Canada regulatory operating fee
  },
  AU: {
    region: "AU",
    countryName: "Australia",
    currencyCode: "AUD",
    currencySymbol: "A$",
    listingFee: 0.30,
    transactionPercent: 0.065, // 6.5%
    paymentPercent: 0.03,      // 3.0%
    paymentFixed: 0.25,        // $0.25 AUD
  },
  EU: {
    region: "EU",
    countryName: "European Union (Eurozone)",
    currencyCode: "EUR",
    currencySymbol: "€",
    listingFee: 0.19,
    transactionPercent: 0.065, // 6.5%
    paymentPercent: 0.04,      // 4.0%
    paymentFixed: 0.30,        // €0.30
  },
};

export interface PriceQuartiles {
  sampleSize: number;
  isSufficient: boolean;
  marketMin?: number;
  lowerMarketRange?: number; // P25
  marketMedian?: number;     // P50
  upperMarketRange?: number; // P75
  marketMax?: number;
  currencyCode: string;
  message?: string;
}

/**
 * Computes statistical percentiles from a series of real prices.
 * Strictly enforces minimum evidence threshold of 5 listings.
 */
export function calculatePriceQuartiles(
  prices: number[],
  currencyCode: string = "USD"
): PriceQuartiles | null {
  const validPrices = prices
    .filter((p) => typeof p === "number" && !isNaN(p) && p > 0)
    .sort((a, b) => a - b);

  const n = validPrices.length;

  if (n === 0) {
    return null;
  }

  // Minimum evidence threshold: at least 5 competitor listings required for statistical quartiles
  if (n < 5) {
    return {
      sampleSize: n,
      isSufficient: false,
      currencyCode,
      message: `Insufficient market data (${n} listing${n === 1 ? "" : "s"} available). At least 5 listings are recommended for market pricing analysis.`,
    };
  }

  const getPercentile = (p: number): number => {
    const index = (p / 100) * (n - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    return Math.round((validPrices[lower] * (1 - weight) + validPrices[upper] * weight) * 100) / 100;
  };

  return {
    sampleSize: n,
    isSufficient: true,
    marketMin: validPrices[0],
    lowerMarketRange: getPercentile(25),
    marketMedian: getPercentile(50),
    upperMarketRange: getPercentile(75),
    marketMax: validPrices[n - 1],
    currencyCode,
  };
}

export interface FeeCalculationBreakdown {
  region: EtsyRegion;
  currencySymbol: string;
  currencyCode: string;
  targetPrice: number;
  cogs: number | null;
  hasCogs: boolean;
  
  // Fee Breakdown
  listingFee: number;
  transactionFee: number;
  paymentFee: number;
  regulatoryOperatingFee: number;
  totalFees: number;
  effectiveFeePercent: number;

  // Bottom Line
  netPayout: number; // After Etsy fees
  netProfit: number | null; // After COGS
  profitMarginPercent: number | null;
  marginHealth: "healthy" | "moderate" | "tight" | "negative" | "unknown";
}

/**
 * Calculates exact Etsy fees and net seller payouts with region-specific rates.
 */
export function calculateEtsyFees(
  targetPrice: number,
  cogs: number | null | undefined,
  region: EtsyRegion = "US"
): FeeCalculationBreakdown {
  const config = ETSY_REGIONS[region] || ETSY_REGIONS.US;
  const price = Math.max(0, targetPrice);

  const listingFee = config.listingFee;
  const transactionFee = Math.round(price * config.transactionPercent * 100) / 100;
  const paymentFee = price > 0 ? Math.round((price * config.paymentPercent + config.paymentFixed) * 100) / 100 : 0;
  const regulatoryOperatingFee = config.regulatoryOperatingPercent
    ? Math.round(price * config.regulatoryOperatingPercent * 100) / 100
    : 0;

  const totalFees = Math.round((listingFee + transactionFee + paymentFee + regulatoryOperatingFee) * 100) / 100;
  const netPayout = Math.round((price - totalFees) * 100) / 100;
  const effectiveFeePercent = price > 0 ? Math.round((totalFees / price) * 1000) / 10 : 0;

  const hasCogs = typeof cogs === "number" && !isNaN(cogs) && cogs >= 0;
  const validCogs = hasCogs ? cogs! : null;

  let netProfit: number | null = null;
  let profitMarginPercent: number | null = null;
  let marginHealth: FeeCalculationBreakdown["marginHealth"] = "unknown";

  if (hasCogs && validCogs !== null) {
    netProfit = Math.round((netPayout - validCogs) * 100) / 100;
    profitMarginPercent = price > 0 ? Math.round((netProfit / price) * 1000) / 10 : 0;

    if (profitMarginPercent >= 55) {
      marginHealth = "healthy";
    } else if (profitMarginPercent >= 35) {
      marginHealth = "moderate";
    } else if (profitMarginPercent > 0) {
      marginHealth = "tight";
    } else {
      marginHealth = "negative";
    }
  }

  return {
    region,
    currencySymbol: config.currencySymbol,
    currencyCode: config.currencyCode,
    targetPrice: price,
    cogs: validCogs,
    hasCogs,
    listingFee,
    transactionFee,
    paymentFee,
    regulatoryOperatingFee,
    totalFees,
    effectiveFeePercent,
    netPayout,
    netProfit,
    profitMarginPercent,
    marginHealth,
  };
}
