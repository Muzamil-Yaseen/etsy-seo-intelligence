"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  DollarSign,
  Info,
  TrendingUp,
  Percent,
  Calculator,
  ShieldCheck,
  AlertCircle,
  Globe,
  ArrowRight,
  CheckCircle2,
  Truck,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react";
import {
  calculateEtsyFees,
  calculatePriceQuartiles,
  calculateTargetPriceFromMargin,
  ETSY_REGIONS,
  EtsyRegion,
  OffsiteAdsTier,
  PriceQuartiles,
} from "@/lib/fees/etsy-fees";

interface PricingCalculatorProps {
  prices?: (string | number)[];
  productNoun?: string;
  initialCogs?: number;
  initialPrice?: number;
}

export function PricingCalculator({
  prices = [],
  productNoun = "Item",
  initialCogs,
  initialPrice,
}: PricingCalculatorProps) {
  // Selected Region / Market Currency
  const [selectedRegion, setSelectedRegion] = useState<EtsyRegion>("US");

  // Parse numeric values from input competitor prices
  const parsedPrices = useMemo(() => {
    return prices
      .map((p) => {
        if (typeof p === "number") return p > 0 ? p : null;
        if (!p) return null;
        const cleaned = String(p).replace(/[^0-9.]/g, "");
        const num = parseFloat(cleaned);
        return isNaN(num) || num <= 0 ? null : num;
      })
      .filter((n): n is number => n !== null);
  }, [prices]);

  // Compute Statistical / Competitor Benchmarks (supports 1, 2, 3, or more listings)
  const quartiles = useMemo<PriceQuartiles | null>(() => {
    return calculatePriceQuartiles(parsedPrices, ETSY_REGIONS[selectedRegion].currencyCode);
  }, [parsedPrices, selectedRegion]);

  const isQuartilesAvailable = Boolean(quartiles && quartiles.isSufficient);
  const medianPrice = isQuartilesAvailable && quartiles?.marketMedian !== undefined
    ? quartiles.marketMedian
    : (initialPrice || 25.0);
  const p25Price = isQuartilesAvailable && quartiles?.lowerMarketRange !== undefined
    ? quartiles.lowerMarketRange
    : null;
  const p75Price = isQuartilesAvailable && quartiles?.upperMarketRange !== undefined
    ? quartiles.upperMarketRange
    : null;

  // Active positioning tier selection
  const [activeTier, setActiveTier] = useState<"low" | "median" | "premium" | "custom">("median");
  
  // Retail price state: defaults to competitor median if available, otherwise initialPrice or $25
  const [targetPrice, setTargetPrice] = useState<number>(() => {
    if (initialPrice && initialPrice > 0) return initialPrice;
    if (isQuartilesAvailable && quartiles?.marketMedian) return quartiles.marketMedian;
    return 25.0;
  });

  // If quartiles become available and initialPrice was not explicitly provided, align to median
  useEffect(() => {
    if (isQuartilesAvailable && quartiles?.marketMedian && !initialPrice) {
      setTargetPrice(quartiles.marketMedian);
    }
  }, [isQuartilesAvailable, quartiles?.marketMedian, initialPrice]);

  // Shipping charged to buyer (revenue to seller)
  const [shippingChargedInput, setShippingChargedInput] = useState<string>("0.00");
  const numShippingCharged = useMemo(() => {
    const val = parseFloat(shippingChargedInput);
    return isNaN(val) || val < 0 ? 0 : val;
  }, [shippingChargedInput]);

  // Cost of Goods Sold (COGS)
  const [cogsInput, setCogsInput] = useState<string>(
    initialCogs !== undefined && initialCogs !== null ? String(initialCogs) : ""
  );
  const numCogs = useMemo(() => {
    if (!cogsInput.trim()) return null;
    const val = parseFloat(cogsInput);
    return isNaN(val) || val < 0 ? null : val;
  }, [cogsInput]);

  // Actual shipping / postage cost paid by seller
  const [shippingCostInput, setShippingCostInput] = useState<string>("0.00");
  const numShippingCost = useMemo(() => {
    const val = parseFloat(shippingCostInput);
    return isNaN(val) || val < 0 ? 0 : val;
  }, [shippingCostInput]);

  // Offsite Ads Tier (none 0%, under10k 15%, over10k 12%)
  const [offsiteAdsTier, setOffsiteAdsTier] = useState<OffsiteAdsTier>("none");

  // Onsite Etsy Ads spend per sale
  const [etsyAdsInput, setEtsyAdsInput] = useState<string>("0.00");
  const numEtsyAds = useMemo(() => {
    const val = parseFloat(etsyAdsInput);
    return isNaN(val) || val < 0 ? 0 : val;
  }, [etsyAdsInput]);

  // Reverse Target Margin State
  const [targetMarginInput, setTargetMarginInput] = useState<number>(50);
  const [showAdvancedFees, setShowAdvancedFees] = useState<boolean>(false);

  // Quick price adjuster
  const adjustPrice = (delta: number) => {
    setActiveTier("custom");
    setTargetPrice((prev) => Math.max(1, Math.round((prev + delta) * 100) / 100));
  };

  // Run region-aware Etsy fee calculation
  const feeDetails = useMemo(() => {
    return calculateEtsyFees(targetPrice, numCogs, selectedRegion, {
      shippingCharged: numShippingCharged,
      shippingCost: numShippingCost,
      offsiteAdsTier,
      etsyAdsSpend: numEtsyAds,
    });
  }, [targetPrice, numCogs, selectedRegion, numShippingCharged, numShippingCost, offsiteAdsTier, numEtsyAds]);

  const regionConfig = ETSY_REGIONS[selectedRegion];
  const sym = regionConfig.currencySymbol;

  // Suggested price based on reverse margin calculator
  const reverseSuggestedPrice = useMemo(() => {
    if (numCogs === null || numCogs <= 0) return null;
    return calculateTargetPriceFromMargin({
      targetMarginPercent: targetMarginInput,
      cogs: numCogs,
      shippingCost: numShippingCost,
      shippingCharged: numShippingCharged,
      region: selectedRegion,
      offsiteAdsTier,
      etsyAdsSpend: numEtsyAds,
    });
  }, [numCogs, targetMarginInput, numShippingCost, numShippingCharged, selectedRegion, offsiteAdsTier, numEtsyAds]);

  return (
    <div className="bg-[#0F1621] border border-[#263244] rounded-[14px] p-6 sm:p-7 space-y-6 text-[#F8FAFC]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#263244] pb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] bg-[#14B8A6]/10 text-[#14B8A6] flex items-center justify-center font-bold">
            <DollarSign className="w-4 h-4 text-[#14B8A6]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-[#F8FAFC] tracking-tight">
                Pricing &amp; Margins
              </h3>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#131C29] text-[#94A3B8] border border-[#263244]">
                Official {regionConfig.countryName} Schedule
              </span>
            </div>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Grounded in real competitor price quartiles and official regional commission schedules.
            </p>
          </div>
        </div>

        {/* Region / Currency Switcher */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <Globe className="w-4 h-4 text-[#64748B]" />
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value as EtsyRegion)}
            className="h-9 px-2.5 bg-[#111827] border border-[#263244] rounded-[8px] text-xs font-semibold text-[#F8FAFC] outline-none focus:border-[#14B8A6]"
          >
            <option value="US">United States (USD $)</option>
            <option value="UK">United Kingdom (GBP £)</option>
            <option value="CA">Canada (CAD CA$)</option>
            <option value="AU">Australia (AUD A$)</option>
            <option value="EU">European Union (EUR €)</option>
          </select>
        </div>
      </div>

      {/* Competitor Price Benchmarks Ribbon */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#14B8A6]" />
            <span className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider">
              Competitor Price Benchmarks
            </span>
          </div>
          <span className="text-[11px] font-medium text-[#94A3B8]">
            {quartiles && quartiles.isSufficient
              ? `${quartiles.sampleSize} competitor${quartiles.sampleSize === 1 ? "" : "s"} benchmarked`
              : "No competitor prices found"}
          </span>
        </div>

        {quartiles && quartiles.isSufficient ? (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {/* Min */}
            <div className="p-3.5 rounded-[10px] bg-[#131C29] border border-[#263244] space-y-1">
              <span className="text-[11px] font-semibold text-[#94A3B8] block uppercase tracking-wider">
                Lowest Competitor
              </span>
              <div className="text-lg sm:text-xl font-bold text-[#F8FAFC]">
                {sym}{quartiles.marketMin !== undefined ? quartiles.marketMin.toFixed(2) : "—"}
              </div>
              <p className="text-[10px] text-[#64748B]">Lowest active price</p>
            </div>

            {/* P25 / Lower */}
            <div className="p-3.5 rounded-[10px] bg-[#131C29] border border-[#263244] space-y-1">
              <span className="text-[11px] font-semibold text-[#94A3B8] block uppercase tracking-wider">
                Entry Tier (P25)
              </span>
              <div className="text-lg sm:text-xl font-bold text-[#F8FAFC]">
                {sym}{quartiles.lowerMarketRange !== undefined ? quartiles.lowerMarketRange.toFixed(2) : "—"}
              </div>
              <p className="text-[10px] text-[#64748B]">Volume &amp; fast reviews</p>
            </div>

            {/* Median Sweet Spot */}
            <div className="p-3.5 rounded-[10px] bg-[#14B8A6]/10 border-2 border-[#14B8A6] space-y-1 relative shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#2DD4BF] block uppercase tracking-wider">
                  Market Median (P50)
                </span>
                <span className="px-1.5 py-0.2 bg-[#14B8A6] text-[#021A17] text-[9px] font-bold rounded">
                  Sweet Spot
                </span>
              </div>
              <div className="text-lg sm:text-xl font-bold text-[#F8FAFC]">
                {sym}{quartiles.marketMedian !== undefined ? quartiles.marketMedian.toFixed(2) : "—"}
              </div>
              <p className="text-[10px] text-[#2DD4BF] font-medium">Equilibrium pricing</p>
            </div>

            {/* P75 / Upper */}
            <div className="p-3.5 rounded-[10px] bg-[#131C29] border border-[#263244] space-y-1">
              <span className="text-[11px] font-semibold text-[#94A3B8] block uppercase tracking-wider">
                Upper Tier (P75)
              </span>
              <div className="text-lg sm:text-xl font-bold text-[#F8FAFC]">
                {sym}{quartiles.upperMarketRange !== undefined ? quartiles.upperMarketRange.toFixed(2) : "—"}
              </div>
              <p className="text-[10px] text-[#64748B]">Custom / Artisan craft</p>
            </div>

            {/* Max */}
            <div className="p-3.5 rounded-[10px] bg-[#131C29] border border-[#263244] space-y-1 col-span-2 sm:col-span-1">
              <span className="text-[11px] font-semibold text-[#94A3B8] block uppercase tracking-wider">
                Highest Competitor
              </span>
              <div className="text-lg sm:text-xl font-bold text-[#F8FAFC]">
                {sym}{quartiles.marketMax !== undefined ? quartiles.marketMax.toFixed(2) : "—"}
              </div>
              <p className="text-[10px] text-[#64748B]">Luxury / High-end cap</p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-[10px] bg-[#131C29] border border-[#263244] text-xs text-[#94A3B8] space-y-1.5">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-[#14B8A6] shrink-0" />
              <span className="font-bold text-[#F8FAFC]">
                Add 1 to 3 Competitors for Instant Price Benchmarking
              </span>
            </div>
            <p className="text-[11px] text-[#94A3B8]">
              When you add competitor listings using the browser extension or manual slots, real market min, median sweet spot, and upper tiers populate here automatically. You can enter your retail price and material costs below anytime.
            </p>
          </div>
        )}
      </div>

      {/* Strategic Positioning Quick-Select Buttons */}
      {quartiles && quartiles.isSufficient && quartiles.lowerMarketRange && quartiles.marketMedian && quartiles.upperMarketRange && (
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
            Positioning Strategies:
          </span>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Low Tier */}
            <button
              type="button"
              onClick={() => {
                setActiveTier("low");
                setTargetPrice(quartiles.lowerMarketRange!);
              }}
              className={`p-3.5 rounded-[10px] text-left border transition flex flex-col justify-between gap-2.5 cursor-pointer ${
                activeTier === "low"
                  ? "bg-[#14B8A6]/10 text-[#F8FAFC] border-[#14B8A6] shadow-xs"
                  : "bg-[#131C29] border-[#263244] text-[#F8FAFC] hover:border-[#36445A]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold uppercase tracking-wider ${activeTier === "low" ? "text-[#2DD4BF]" : "text-[#94A3B8]"}`}>
                    Volume Entry (P25)
                  </span>
                  <span className="text-base font-bold">
                    {sym}{quartiles.lowerMarketRange.toFixed(2)}
                  </span>
                </div>
                <p className={`text-xs mt-1.5 leading-relaxed ${activeTier === "low" ? "text-[#E2E8F0]" : "text-[#94A3B8]"}`}>
                  Priced to gain immediate sales velocity and early 5-star customer reviews.
                </p>
              </div>
              <div className="pt-2 border-t border-[#263244] text-xs font-medium">
                <span className={activeTier === "low" ? "text-[#2DD4BF] font-semibold" : "text-[#64748B]"}>
                  {activeTier === "low" ? "✓ Selected" : "Use Entry Tier"}
                </span>
              </div>
            </button>

            {/* Median Tier */}
            <button
              type="button"
              onClick={() => {
                setActiveTier("median");
                setTargetPrice(quartiles.marketMedian!);
              }}
              className={`p-3.5 rounded-[10px] text-left border-2 transition flex flex-col justify-between gap-2.5 cursor-pointer ${
                activeTier === "median"
                  ? "bg-[#14B8A6]/15 text-[#F8FAFC] border-[#14B8A6] shadow-xs"
                  : "bg-[#131C29] border-[#14B8A6]/40 text-[#F8FAFC] hover:border-[#14B8A6]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold uppercase tracking-wider ${activeTier === "median" ? "text-[#2DD4BF]" : "text-[#14B8A6]"}`}>
                    Market Median (P50)
                  </span>
                  <span className="text-base font-bold">
                    {sym}{quartiles.marketMedian.toFixed(2)}
                  </span>
                </div>
                <p className={`text-xs mt-1.5 leading-relaxed ${activeTier === "median" ? "text-[#E2E8F0]" : "text-[#94A3B8]"}`}>
                  Market equilibrium sweet spot. Matches top competitors while preserving solid margins.
                </p>
              </div>
              <div className="pt-2 border-t border-[#263244] text-xs font-medium">
                <span className={activeTier === "median" ? "text-[#2DD4BF] font-semibold" : "text-[#14B8A6] font-semibold"}>
                  {activeTier === "median" ? "✓ Selected (Recommended)" : "Use Market Median"}
                </span>
              </div>
            </button>

            {/* Premium Tier */}
            <button
              type="button"
              onClick={() => {
                setActiveTier("premium");
                setTargetPrice(quartiles.upperMarketRange!);
              }}
              className={`p-3.5 rounded-[10px] text-left border transition flex flex-col justify-between gap-2.5 cursor-pointer ${
                activeTier === "premium"
                  ? "bg-[#14B8A6]/10 text-[#F8FAFC] border-[#14B8A6] shadow-xs"
                  : "bg-[#131C29] border-[#263244] text-[#F8FAFC] hover:border-[#36445A]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold uppercase tracking-wider ${activeTier === "premium" ? "text-[#2DD4BF]" : "text-[#94A3B8]"}`}>
                    Artisan Premium (P75)
                  </span>
                  <span className="text-base font-bold">
                    {sym}{quartiles.upperMarketRange.toFixed(2)}
                  </span>
                </div>
                <p className={`text-xs mt-1.5 leading-relaxed ${activeTier === "premium" ? "text-[#E2E8F0]" : "text-[#94A3B8]"}`}>
                  High-margin tier for bespoke personalization, luxury unboxing, or rare materials.
                </p>
              </div>
              <div className="pt-2 border-t border-[#263244] text-xs font-medium">
                <span className={activeTier === "premium" ? "text-[#2DD4BF] font-semibold" : "text-[#64748B]"}>
                  {activeTier === "premium" ? "✓ Selected" : "Use Premium Tier"}
                </span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Pricing, Shipping & Cost Inputs Panel */}
      <div className="bg-[#131C29] border border-[#263244] rounded-[14px] p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#263244] pb-3">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-[#14B8A6]" />
            <span className="text-sm font-bold text-[#F8FAFC]">
              Etsy Listing Revenue &amp; Seller Cost Inputs
            </span>
          </div>
          <span className="text-[11px] text-[#94A3B8]">
            Etsy fee formulas updated June 2026 ({regionConfig.countryName})
          </span>
        </div>

        {/* 4 Input Controls: Retail Price, Shipping Charged, COGS, Shipping Cost */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Retail Price */}
          <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                Item Retail Price
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => adjustPrice(-1)}
                  className="w-5 h-5 flex items-center justify-center text-xs font-bold text-slate-600 hover:bg-slate-100 rounded"
                  title="Decrease $1"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={() => adjustPrice(1)}
                  className="w-5 h-5 flex items-center justify-center text-xs font-bold text-emerald-700 hover:bg-emerald-50 rounded"
                  title="Increase $1"
                >
                  +
                </button>
              </div>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
                {sym}
              </span>
              <input
                type="number"
                step="0.5"
                min="0"
                value={targetPrice}
                onChange={(e) => {
                  setActiveTier("custom");
                  setTargetPrice(Math.max(0, parseFloat(e.target.value) || 0));
                }}
                className="w-full h-9 bg-[#111827] border border-[#263244] rounded-md pl-7 pr-3 text-xs font-mono font-bold text-[#F8FAFC] focus:border-[#14B8A6] outline-none transition"
              />
            </div>
            <p className="text-[10px] text-[#64748B]">Product listing price</p>
          </div>

          {/* 2. Shipping Charged to Buyer */}
          <div className="bg-[#131C29] p-3.5 rounded-lg border border-[#263244] space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#F8FAFC]">
                Shipping Charged (Buyer)
              </label>
              {numShippingCharged > 0 && (
                <button
                  type="button"
                  onClick={() => setShippingChargedInput("0.00")}
                  className="text-[10px] font-semibold text-[#14B8A6] hover:underline"
                >
                  Free Shipping
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[#64748B]">
                {sym}
              </span>
              <input
                type="number"
                step="0.5"
                min="0"
                value={shippingChargedInput}
                onChange={(e) => setShippingChargedInput(e.target.value)}
                placeholder="0.00 (Free Shipping)"
                className="w-full h-9 bg-[#111827] border border-[#263244] rounded-md pl-7 pr-3 text-xs font-mono font-bold text-[#F8FAFC] focus:border-[#14B8A6] outline-none transition placeholder:text-[#64748B]"
              />
            </div>
            <p className="text-[10px] text-[#64748B]">
              Etsy takes 6.5% transaction + processing on this too
            </p>
          </div>

          {/* 3. Cost of Goods Sold (COGS) */}
          <div className="bg-[#131C29] p-3.5 rounded-lg border border-[#263244] space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#F8FAFC]">
                Materials &amp; Labor (COGS)
              </label>
              {feeDetails.hasCogs && (
                <span className="text-[10px] font-bold text-[#14B8A6]">✓ Set</span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[#64748B]">
                {sym}
              </span>
              <input
                type="number"
                step="0.5"
                min="0"
                value={cogsInput}
                onChange={(e) => setCogsInput(e.target.value)}
                placeholder="e.g. 8.50"
                className="w-full h-9 bg-[#111827] border border-[#263244] rounded-md pl-7 pr-3 text-xs font-mono font-bold text-[#F8FAFC] focus:border-[#14B8A6] outline-none transition placeholder:text-[#64748B]"
              />
            </div>
            <p className="text-[10px] text-[#64748B]">Raw materials &amp; packaging</p>
          </div>

          {/* 4. Seller Actual Shipping Cost (Postage) */}
          <div className="bg-[#131C29] p-3.5 rounded-lg border border-[#263244] space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#F8FAFC]">
                Actual Postage Cost (Seller)
              </label>
              <Truck className="w-3.5 h-3.5 text-[#64748B]" />
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[#64748B]">
                {sym}
              </span>
              <input
                type="number"
                step="0.5"
                min="0"
                value={shippingCostInput}
                onChange={(e) => setShippingCostInput(e.target.value)}
                placeholder="0.00"
                className="w-full h-9 bg-[#111827] border border-[#263244] rounded-md pl-7 pr-3 text-xs font-mono font-bold text-[#F8FAFC] focus:border-[#14B8A6] outline-none transition placeholder:text-[#64748B]"
              />
            </div>
            <p className="text-[10px] text-[#64748B]">Courier label cost paid by you</p>
          </div>
        </div>

        {/* Advanced Fee Toggles (Offsite Ads & Etsy Ads) */}
        <div className="pt-2 border-t border-[#263244]">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowAdvancedFees(!showAdvancedFees)}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#94A3B8] hover:text-[#F8FAFC] cursor-pointer transition"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#14B8A6]" />
              <span>Advertising &amp; Additional Commission Controls</span>
              <span className="text-[11px] text-[#64748B]">
                ({offsiteAdsTier === "none" ? "Offsite Ads: None" : offsiteAdsTier === "under10k" ? "Offsite Ads: 15%" : "Offsite Ads: 12%"} • {showAdvancedFees ? "Hide" : "Customize"})
              </span>
            </button>

            <span className="text-[11px] text-[#94A3B8] font-mono">
              Total Buyer Pays: <strong className="text-[#F8FAFC]">{sym}{feeDetails.totalBuyerPays.toFixed(2)}</strong>
            </span>
          </div>

          {showAdvancedFees && (
            <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#131C29] p-4 rounded-lg border border-[#263244]">
              {/* Offsite Ads Tier */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#F8FAFC] block">
                  Etsy Offsite Ads Fee
                </label>
                <select
                  value={offsiteAdsTier}
                  onChange={(e) => setOffsiteAdsTier(e.target.value as OffsiteAdsTier)}
                  className="w-full h-9 px-3 bg-[#111827] border border-[#263244] rounded-lg text-xs font-semibold text-[#F8FAFC] outline-none focus:border-[#14B8A6] transition"
                >
                  <option value="none">0% — Opted Out / Direct Organic Sale</option>
                  <option value="under10k">15% — Standard Tier (Shop sales &lt; $10k/yr, optional)</option>
                  <option value="over10k">12% — High-Volume Tier (Shop sales &gt; $10k/yr, mandatory)</option>
                </select>
                <p className="text-[10px] text-[#64748B]">
                  Offsite Ads fee is capped at $100 per attributed order.
                </p>
              </div>

              {/* Onsite Etsy Ads Spend */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#F8FAFC] block">
                  Etsy Onsite Ads Spend per Sale
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[#64748B]">
                    {sym}
                  </span>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    value={etsyAdsInput}
                    onChange={(e) => setEtsyAdsInput(e.target.value)}
                    placeholder="0.00"
                    className="w-full h-9 bg-[#111827] border border-[#263244] rounded-lg pl-7 pr-3 text-xs font-mono font-bold text-[#F8FAFC] focus:border-[#14B8A6] outline-none transition placeholder:text-[#64748B]"
                  />
                </div>
                <p className="text-[10px] text-[#64748B]">
                  Estimated promoted listings CPC budget per unit sold.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Reverse Target Margin Helper Card */}
        <div className="bg-[#14B8A6]/10 border border-[#14B8A6]/30 rounded-lg p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#14B8A6]" />
              <span className="text-xs font-bold text-[#14B8A6] uppercase tracking-wider">
                Target Margin Reverse Pricing Tool
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {[35, 45, 50, 60].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setTargetMarginInput(pct)}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition cursor-pointer ${
                    targetMarginInput === pct
                      ? "bg-[#14B8A6] text-[#021A17]"
                      : "bg-[#131C29] text-[#94A3B8] border border-[#263244] hover:bg-[#172231] hover:text-[#F8FAFC]"
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              {reverseSuggestedPrice !== null ? (
                <p className="text-[#94A3B8] text-xs">
                  To achieve your desired <strong className="text-[#14B8A6] font-bold">{targetMarginInput}% profit margin</strong> after all Etsy fees and shipping, list at:
                </p>
              ) : (
                <p className="text-[#64748B] text-xs">
                  Enter your <strong className="text-[#F8FAFC]">Materials Cost (COGS)</strong> in the field above to calculate the exact retail price needed for a {targetMarginInput}% net margin.
                </p>
              )}
            </div>

            {reverseSuggestedPrice !== null && (
              <div className="flex items-center gap-2">
                <span className="font-heading text-lg font-bold text-[#F8FAFC]">
                  {sym}{reverseSuggestedPrice.toFixed(2)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTier("custom");
                    setTargetPrice(reverseSuggestedPrice);
                  }}
                  className="px-3 py-1 bg-[#14B8A6] hover:bg-[#2DD4BF] text-[#021A17] rounded-md text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Apply Suggested Price
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 4 Official Etsy Fee Breakdown Cards */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">
              Exact Fee Deductions ({regionConfig.countryName})
            </span>
            <span className="text-[11px] font-mono font-bold text-[#F8FAFC]">
              Total Order: {sym}{feeDetails.totalBuyerPays.toFixed(2)}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* 1. Listing Fee */}
            <div className="bg-[#131C29] p-3.5 rounded-lg border border-[#263244] space-y-1">
              <span className="text-xs font-medium text-[#64748B] block">Listing Fee</span>
              <span className="font-mono font-bold text-[#F8FAFC] text-base">
                {sym}{feeDetails.listingFee.toFixed(2)}
              </span>
              <span className="text-[10px] text-[#64748B] block">Per 4-mo renewal or sale</span>
            </div>

            {/* 2. Transaction Fee */}
            <div className="bg-[#131C29] p-3.5 rounded-lg border border-[#263244] space-y-1">
              <span className="text-xs font-medium text-[#64748B] block">Transaction (6.5%)</span>
              <span className="font-mono font-bold text-[#F8FAFC] text-base">
                {sym}{feeDetails.transactionFee.toFixed(2)}
              </span>
              <span className="text-[10px] text-[#64748B] block">Item + shipping commission</span>
            </div>

            {/* 3. Payment Processing Fee */}
            <div className="bg-[#131C29] p-3.5 rounded-lg border border-[#263244] space-y-1">
              <span className="text-xs font-medium text-[#64748B] block">
                Processing ({(regionConfig.paymentPercent * 100).toFixed(0)}% + {sym}{regionConfig.paymentFixed.toFixed(2)})
              </span>
              <span className="font-mono font-bold text-[#F8FAFC] text-base">
                {sym}{feeDetails.paymentFee.toFixed(2)}
              </span>
              <span className="text-[10px] text-[#64748B] block">Etsy Payments gateway</span>
            </div>

            {/* 4. Ads & Additional Fees */}
            <div className="bg-[#131C29] p-3.5 rounded-lg border border-[#263244] space-y-1">
              <span className="text-xs font-medium text-[#64748B] block">
                Ads &amp; Regulatory
              </span>
              <span className="font-mono font-bold text-[#F8FAFC] text-base">
                {sym}{(feeDetails.offsiteAdsFee + feeDetails.etsyAdsSpend + feeDetails.regulatoryOperatingFee).toFixed(2)}
              </span>
              <span className="text-[10px] text-[#64748B] block">
                {feeDetails.offsiteAdsTier !== "none" ? `Offsite ${feeDetails.offsiteAdsTier === "under10k" ? "15%" : "12%"}` : "0% Offsite Ads"}
                {feeDetails.regulatoryOperatingFee > 0 ? ` • Reg ${(regionConfig.regulatoryOperatingPercent! * 100).toFixed(2)}%` : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Total Etsy Cut Banner */}
        <div className="flex items-center justify-between bg-[#111827] border border-[#263244] text-[#F8FAFC] px-4 py-3 rounded-lg text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold uppercase tracking-wider text-[#94A3B8]">
              Total Etsy Commission &amp; Fees:
            </span>
            <span className="font-mono font-bold text-base text-[#14B8A6]">
              -{sym}{feeDetails.totalFees.toFixed(2)}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-[#94A3B8]">
            {feeDetails.effectiveFeePercent}% of total buyer payment
          </span>
        </div>

        {/* Take-Home Net Payout & Profit Summary */}
        <div className="p-5 rounded-xl bg-[#0F1621] border border-[#263244] flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left: Etsy Net Payout */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
              Etsy Net Bank Deposit
            </span>
            <div className="font-heading text-2xl sm:text-3xl font-bold text-[#F8FAFC]">
              {sym}{feeDetails.netPayout.toFixed(2)}
            </div>
            <p className="text-xs text-[#94A3B8] leading-relaxed max-w-sm">
              Deposited into your bank account after all Etsy commission and payment fees are deducted.
            </p>
          </div>

          {/* Right: Seller Net Take-Home Profit */}
          <div className="md:border-l md:border-[#263244] md:pl-6 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider">
                Seller Net Take-Home Profit
              </span>
              {feeDetails.hasCogs && feeDetails.profitMarginPercent !== null && (
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${
                    feeDetails.marginHealth === "healthy"
                      ? "bg-[#14B8A6]/20 text-[#14B8A6] border-[#14B8A6]/40"
                      : feeDetails.marginHealth === "moderate"
                      ? "bg-blue-500/20 text-blue-400 border-blue-500/40"
                      : feeDetails.marginHealth === "tight"
                      ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                      : "bg-red-500/20 text-red-400 border-red-500/40"
                  }`}
                >
                  {feeDetails.profitMarginPercent}% Margin ({feeDetails.marginHealth.toUpperCase()})
                </span>
              )}
            </div>

            <div className="font-heading text-2xl sm:text-3xl font-bold text-[#14B8A6]">
              {feeDetails.hasCogs && feeDetails.netProfit !== null
                ? `${sym}${feeDetails.netProfit.toFixed(2)}`
                : "Enter COGS"}
            </div>

            <div className="text-xs text-[#94A3B8]">
              {feeDetails.hasCogs && feeDetails.netProfit !== null ? (
                <div className="space-y-1">
                  <div>
                    <span>At 25 sales/month: </span>
                    <strong className="text-[#F8FAFC] font-mono">
                      +{sym}{(feeDetails.netProfit * 25).toFixed(2)} net profit
                    </strong>
                  </div>
                  <div className="w-48 h-1.5 bg-[#111827] rounded-full overflow-hidden mt-1 border border-[#263244]">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        feeDetails.marginHealth === "healthy"
                          ? "bg-[#14B8A6]"
                          : feeDetails.marginHealth === "moderate"
                          ? "bg-blue-500"
                          : feeDetails.marginHealth === "tight"
                          ? "bg-amber-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, feeDetails.profitMarginPercent || 0))}%` }}
                    />
                  </div>
                </div>
              ) : (
                <span>Requires production/materials cost in the field above to calculate true take-home profit.</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
