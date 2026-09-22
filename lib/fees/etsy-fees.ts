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
  lowerMarketRange?: number; // P25 / Entry
  marketMedian?: number;     // P50 / Sweet spot
  upperMarketRange?: number; // P75 / Premium
  marketMax?: number;
  currencyCode: string;
  message?: string;
}

/**
 * Computes competitor price benchmarks and statistical percentiles.
 * Fully supports 1, 2, 3, or more competitor listings.
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

  if (n === 1) {
    const single = validPrices[0];
    return {
      sampleSize: 1,
      isSufficient: true,
      marketMin: single,
      lowerMarketRange: single,
      marketMedian: single,
      upperMarketRange: single,
      marketMax: single,
      currencyCode,
      message: "Direct competitor price benchmark (1 listing)",
    };
  }

  if (n === 2) {
    const min = validPrices[0];
    const max = validPrices[1];
    const median = Math.round(((min + max) / 2) * 100) / 100;
    return {
      sampleSize: 2,
      isSufficient: true,
      marketMin: min,
      lowerMarketRange: min,
      marketMedian: median,
      upperMarketRange: max,
      marketMax: max,
      currencyCode,
      message: "Competitor price benchmark (2 listings)",
    };
  }

  if (n === 3) {
    const min = validPrices[0];
    const median = validPrices[1];
    const max = validPrices[2];
    const lower = Math.round((min * 0.5 + median * 0.5) * 100) / 100;
    const upper = Math.round((median * 0.5 + max * 0.5) * 100) / 100;
    return {
      sampleSize: 3,
      isSufficient: true,
      marketMin: min,
      lowerMarketRange: lower,
      marketMedian: median,
      upperMarketRange: upper,
      marketMax: max,
      currencyCode,
      message: "Competitor 3-listing market benchmark",
    };
  }

  // For n >= 4: Standard statistical percentile interpolation
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
    message: `Market quartile benchmark (${n} listings)`,
  };
}

export type OffsiteAdsTier = "none" | "under10k" | "over10k";

export interface CalculateFeesOptions {
  shippingCharged?: number;
  shippingCost?: number;
  offsiteAdsTier?: OffsiteAdsTier;
  etsyAdsSpend?: number;
}

export interface FeeCalculationBreakdown {
  region: EtsyRegion;
  countryName: string;
  currencySymbol: string;
  currencyCode: string;
  targetPrice: number;
  shippingCharged: number;
  totalBuyerPays: number;
  cogs: number | null;
  shippingCost: number;
  hasCogs: boolean;
  hasCosts: boolean;
  
  // Fee Breakdown
  listingFee: number;
  transactionFee: number;
  paymentFee: number;
  regulatoryOperatingFee: number;
  offsiteAdsTier: OffsiteAdsTier;
  offsiteAdsFee: number;
  etsyAdsSpend: number;
  totalFees: number;
  effectiveFeePercent: number;

  // Bottom Line
  netPayout: number; // Deposited to bank after Etsy fees (totalBuyerPays - totalFees)
  totalSellerCosts: number; // cogs + shippingCost
  netProfit: number | null; // Net take-home profit after all fees, shipping & COGS
  profitMarginPercent: number | null;
  marginHealth: "healthy" | "moderate" | "tight" | "negative" | "unknown";
}

/**
 * Calculates exact Etsy fees, seller payouts, and net profit margins according to official 2026 Etsy fee schedules.
 * Supports shipping charged, shipping cost, offsite ads tiers (0%, 15%, 12%), and onsite Etsy Ads spend.
 */
export function calculateEtsyFees(
  targetPrice: number,
  cogs?: number | null | undefined,
  region: EtsyRegion = "US",
  options?: CalculateFeesOptions
): FeeCalculationBreakdown {
  const config = ETSY_REGIONS[region] || ETSY_REGIONS.US;
  const price = Math.max(0, targetPrice);
  const shippingCharged = Math.max(0, options?.shippingCharged ?? 0);
  const shippingCost = Math.max(0, options?.shippingCost ?? 0);
  const offsiteAdsTier = options?.offsiteAdsTier ?? "none";
  const etsyAdsSpend = Math.max(0, options?.etsyAdsSpend ?? 0);

  // Total amount paid by buyer (item price + shipping charged)
  const totalBuyerPays = Math.round((price + shippingCharged) * 100) / 100;

  // 1. Listing fee ($0.20 USD equivalent fixed per item/renewal)
  const listingFee = config.listingFee;

  // 2. Transaction fee: 6.5% of total amount paid by buyer (price + shipping charged)
  const transactionFee = Math.round(totalBuyerPays * config.transactionPercent * 100) / 100;

  // 3. Payment processing fee: regional % + fixed fee on total amount paid by buyer
  const paymentFee = totalBuyerPays > 0
    ? Math.round((totalBuyerPays * config.paymentPercent + config.paymentFixed) * 100) / 100
    : 0;

  // 4. Regulatory Operating Fee / Digital Services fee where applicable
  const regulatoryOperatingFee = config.regulatoryOperatingPercent
    ? Math.round(totalBuyerPays * config.regulatoryOperatingPercent * 100) / 100
    : 0;

  // 5. Offsite Ads Fee: 0% (opted out/none), 15% (<$10k/yr), or 12% (>$10k/yr), capped at $100 per order
  let offsiteAdsRate = 0;
  if (offsiteAdsTier === "under10k") offsiteAdsRate = 0.15;
  else if (offsiteAdsTier === "over10k") offsiteAdsRate = 0.12;

  const rawOffsiteAdsFee = totalBuyerPays * offsiteAdsRate;
  const offsiteAdsFee = Math.min(100, Math.round(rawOffsiteAdsFee * 100) / 100);

  // Total Etsy commission & processing fees
  const totalFees = Math.round(
    (listingFee + transactionFee + paymentFee + regulatoryOperatingFee + offsiteAdsFee + etsyAdsSpend) * 100
  ) / 100;

  // Net amount deposited into seller's bank account by Etsy
  const netPayout = Math.round((totalBuyerPays - totalFees) * 100) / 100;

  // Effective fee rate as % of total buyer order (2 decimal places)
  const effectiveFeePercent = totalBuyerPays > 0
    ? Math.round(((totalFees / totalBuyerPays) * 100) * 100) / 100
    : 0;

  // Seller production & fulfillment costs
  const hasCogs = typeof cogs === "number" && !isNaN(cogs) && cogs >= 0;
  const validCogs = hasCogs ? cogs! : null;
  const hasShippingCost = shippingCost > 0;
  const hasCosts = hasCogs || hasShippingCost;
  const totalSellerCosts = Math.round(((validCogs || 0) + shippingCost) * 100) / 100;

  let netProfit: number | null = null;
  let profitMarginPercent: number | null = null;
  let marginHealth: FeeCalculationBreakdown["marginHealth"] = "unknown";

  if (hasCosts && hasCogs && validCogs !== null) {
    netProfit = Math.round((netPayout - totalSellerCosts) * 100) / 100;
    profitMarginPercent = totalBuyerPays > 0
      ? Math.round(((netProfit / totalBuyerPays) * 100) * 100) / 100
      : 0;

    if (profitMarginPercent >= 50) {
      marginHealth = "healthy";
    } else if (profitMarginPercent >= 30) {
      marginHealth = "moderate";
    } else if (profitMarginPercent > 0) {
      marginHealth = "tight";
    } else {
      marginHealth = "negative";
    }
  }

  return {
    region,
    countryName: config.countryName,
    currencySymbol: config.currencySymbol,
    currencyCode: config.currencyCode,
    targetPrice: price,
    shippingCharged,
    totalBuyerPays,
    cogs: validCogs,
    shippingCost,
    hasCogs,
    hasCosts,
    listingFee,
    transactionFee,
    paymentFee,
    regulatoryOperatingFee,
    offsiteAdsTier,
    offsiteAdsFee,
    etsyAdsSpend,
    totalFees,
    effectiveFeePercent,
    netPayout,
    totalSellerCosts,
    netProfit,
    profitMarginPercent,
    marginHealth,
  };
}

/**
 * Reverse Margin Pricing Calculator:
 * Calculates the exact retail price required to achieve a target profit margin percentage.
 */
export function calculateTargetPriceFromMargin(params: {
  targetMarginPercent: number; // e.g. 50 for 50%
  cogs: number;
  shippingCost?: number;
  shippingCharged?: number;
  region?: EtsyRegion;
  offsiteAdsTier?: OffsiteAdsTier;
  etsyAdsSpend?: number;
}): number {
  const {
    targetMarginPercent,
    cogs,
    shippingCost = 0,
    shippingCharged = 0,
    region = "US",
    offsiteAdsTier = "none",
    etsyAdsSpend = 0,
  } = params;

  const config = ETSY_REGIONS[region] || ETSY_REGIONS.US;
  const offsiteAdsRate = offsiteAdsTier === "under10k" ? 0.15 : offsiteAdsTier === "over10k" ? 0.12 : 0;
  const regRate = config.regulatoryOperatingPercent || 0;

  // Percentage fee multiplier
  const feeRate = config.transactionPercent + config.paymentPercent + regRate + offsiteAdsRate;
  const marginRate = targetMarginPercent / 100;

  const divisor = 1 - feeRate - marginRate;
  if (divisor <= 0.05) {
    // Unrealistic margin request (fees + margin >= 95%)
    return Math.max(1, Math.round((cogs + shippingCost) * 3 * 100) / 100);
  }

  const fixedCosts = config.listingFee + config.paymentFixed + etsyAdsSpend + cogs + shippingCost;
  const requiredRevenue = fixedCosts / divisor;
  const suggestedPrice = Math.max(1, requiredRevenue - shippingCharged);

  return Math.round(suggestedPrice * 100) / 100;
}

/**
 * Reverse Profit Pricing Calculator:
 * Calculates the exact retail price required to earn a specific net dollar profit per order.
 */
export function calculateTargetPriceFromProfit(params: {
  targetProfit: number; // e.g. 20 for $20
  cogs: number;
  shippingCost?: number;
  shippingCharged?: number;
  region?: EtsyRegion;
  offsiteAdsTier?: OffsiteAdsTier;
  etsyAdsSpend?: number;
}): number {
  const {
    targetProfit,
    cogs,
    shippingCost = 0,
    shippingCharged = 0,
    region = "US",
    offsiteAdsTier = "none",
    etsyAdsSpend = 0,
  } = params;

  const config = ETSY_REGIONS[region] || ETSY_REGIONS.US;
  const offsiteAdsRate = offsiteAdsTier === "under10k" ? 0.15 : offsiteAdsTier === "over10k" ? 0.12 : 0;
  const regRate = config.regulatoryOperatingPercent || 0;
  const feeRate = config.transactionPercent + config.paymentPercent + regRate + offsiteAdsRate;

  const divisor = 1 - feeRate;
  const totalNeeded = targetProfit + config.listingFee + config.paymentFixed + etsyAdsSpend + cogs + shippingCost;
  const requiredRevenue = totalNeeded / divisor;
  const suggestedPrice = Math.max(1, requiredRevenue - shippingCharged);

  return Math.round(suggestedPrice * 100) / 100;
}
