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
} from "lucide-react";
import {
  calculateEtsyFees,
  calculatePriceQuartiles,
  ETSY_REGIONS,
  EtsyRegion,
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

  // Parse numeric values from input prices
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

  // Compute Statistical Quartiles from real competitor data
  const quartiles = useMemo<PriceQuartiles | null>(() => {
    return calculatePriceQuartiles(parsedPrices, ETSY_REGIONS[selectedRegion].currencyCode);
  }, [parsedPrices, selectedRegion]);

  // Pricing recommendations based on real quartiles (strictly >= 5 listings)
  const isQuartilesAvailable = Boolean(quartiles && quartiles.isSufficient);
  const medianPrice = isQuartilesAvailable && quartiles?.marketMedian !== undefined ? quartiles.marketMedian : (initialPrice || 25.0);
  const p25Price = isQuartilesAvailable && quartiles?.lowerMarketRange !== undefined ? quartiles.lowerMarketRange : null;
  const p75Price = isQuartilesAvailable && quartiles?.upperMarketRange !== undefined ? quartiles.upperMarketRange : null;

  // Active user selection
  const [activeTier, setActiveTier] = useState<"low" | "median" | "premium">("median");
  const [targetPrice, setTargetPrice] = useState<number>(initialPrice || (isQuartilesAvailable ? medianPrice : 25.0));

  // COGS is never pre-filled with a hidden guess! Default must be blank.
  const [cogsInput, setCogsInput] = useState<string>(
    initialCogs !== undefined && initialCogs !== null ? String(initialCogs) : ""
  );

  const numCogs = useMemo(() => {
    if (!cogsInput.trim()) return null;
    const val = parseFloat(cogsInput);
    return isNaN(val) || val < 0 ? null : val;
  }, [cogsInput]);

  // Update target price when tier changes or quartiles initialize (only if real quartiles exist)
  useEffect(() => {
    if (!isQuartilesAvailable) return;
    if (activeTier === "low" && p25Price !== null) setTargetPrice(p25Price);
    else if (activeTier === "median" && medianPrice !== null) setTargetPrice(medianPrice);
    else if (activeTier === "premium" && p75Price !== null) setTargetPrice(p75Price);
  }, [activeTier, p25Price, medianPrice, p75Price, isQuartilesAvailable]);

  // Quick price adjuster
  const adjustPrice = (delta: number) => {
    setTargetPrice((prev) => Math.max(1, Math.round((prev + delta) * 100) / 100));
  };

  // Run region-aware Etsy fee calculation
  const feeDetails = useMemo(() => {
    return calculateEtsyFees(targetPrice, numCogs, selectedRegion);
  }, [targetPrice, numCogs, selectedRegion]);

  const regionConfig = ETSY_REGIONS[selectedRegion];
  const sym = regionConfig.currencySymbol;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold">
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Pricing &amp; Margins
              </h3>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600">
                Official {regionConfig.countryName} Schedule
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Grounded in real competitor price quartiles and official regional commission schedules.
            </p>
          </div>
        </div>

        {/* Region / Currency Switcher */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <Globe className="w-4 h-4 text-slate-400" />
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value as EtsyRegion)}
            className="h-8 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none focus:border-slate-900"
          >
            <option value="US">United States (USD $)</option>
            <option value="UK">United Kingdom (GBP £)</option>
            <option value="CA">Canada (CAD CA$)</option>
            <option value="AU">Australia (AUD A$)</option>
            <option value="EU">European Union (EUR €)</option>
          </select>
        </div>
      </div>

      {/* Competitor Price Quartiles Strip */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
            Market Benchmark Quartiles
          </span>
          <span className="text-[11px] text-slate-500">
            {quartiles && quartiles.isSufficient
              ? `Calculated from ${quartiles.sampleSize} verified competitor listings`
              : quartiles
              ? `${quartiles.sampleSize} competitor price${quartiles.sampleSize === 1 ? "" : "s"} found`
              : "No competitor prices found"}
          </span>
        </div>

        {quartiles && quartiles.isSufficient ? (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {/* Min */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
                Market Min
              </span>
              <div className="text-lg sm:text-xl font-bold font-mono text-slate-900">
                {sym}{quartiles.marketMin !== undefined ? quartiles.marketMin.toFixed(2) : "—"}
              </div>
              <p className="text-[10px] text-slate-400">Lowest active entry</p>
            </div>

            {/* P25: Lower Market Range */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
                Lower Range (P25)
              </span>
              <div className="text-lg sm:text-xl font-bold font-mono text-slate-900">
                {sym}{quartiles.lowerMarketRange !== undefined ? quartiles.lowerMarketRange.toFixed(2) : "—"}
              </div>
              <p className="text-[10px] text-slate-400">Entry-level tier</p>
            </div>

            {/* Median: Market Median */}
            <div className="p-3.5 rounded-lg bg-emerald-50/50 border border-emerald-300 space-y-1 relative">
              <span className="text-[11px] font-bold text-emerald-800 block uppercase tracking-wider">
                Market Median (P50)
              </span>
              <div className="text-lg sm:text-xl font-bold font-mono text-emerald-900">
                {sym}{quartiles.marketMedian !== undefined ? quartiles.marketMedian.toFixed(2) : "—"}
              </div>
              <p className="text-[10px] text-emerald-700 font-medium">Sweet spot</p>
            </div>

            {/* P75: Upper Market Range */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
                Upper Range (P75)
              </span>
              <div className="text-lg sm:text-xl font-bold font-mono text-slate-900">
                {sym}{quartiles.upperMarketRange !== undefined ? quartiles.upperMarketRange.toFixed(2) : "—"}
              </div>
              <p className="text-[10px] text-slate-400">Premium craft tier</p>
            </div>

            {/* Max */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1 col-span-2 sm:col-span-1">
              <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
                Market Max
              </span>
              <div className="text-lg sm:text-xl font-bold font-mono text-slate-900">
                {sym}{quartiles.marketMax !== undefined ? quartiles.marketMax.toFixed(2) : "—"}
              </div>
              <p className="text-[10px] text-slate-400">High-end benchmark</p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
            <span className="font-semibold text-slate-800 block">
              Insufficient market data for price quartiles
            </span>
            <p className="text-[11px] text-slate-500">
              {quartiles ? quartiles.message : "At least 5 competitor listings are required to calculate statistically reliable quartiles."} You can still enter your target retail price and production costs below to calculate exact Etsy fees and take-home margins.
            </p>
          </div>
        )}
      </div>

      {/* Strategic Positioning Tier Selector: only show if quartiles are sufficient */}
      {quartiles && quartiles.isSufficient && quartiles.lowerMarketRange && quartiles.marketMedian && quartiles.upperMarketRange && (
        <div className="space-y-3">
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">
            Strategic Positioning Options:
          </span>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* Low Tier */}
            <button
              type="button"
              onClick={() => {
                setActiveTier("low");
                setTargetPrice(quartiles.lowerMarketRange!);
              }}
              className={`p-4 rounded-lg text-left border transition flex flex-col justify-between gap-3 cursor-pointer ${
                activeTier === "low"
                  ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                  : "bg-white border-slate-200 text-slate-900 hover:border-slate-400"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold uppercase tracking-wider ${activeTier === "low" ? "text-emerald-400" : "text-slate-700"}`}>
                    Lower Market Range (P25)
                  </span>
                  <span className="text-lg font-bold font-mono">
                    {sym}{quartiles.lowerMarketRange.toFixed(2)}
                  </span>
                </div>
                <p className={`text-xs mt-2 leading-relaxed ${activeTier === "low" ? "text-slate-300" : "text-slate-500"}`}>
                  Positioned at the 25th percentile. Useful for newly launched shops looking to gain initial sales velocity and buyer reviews.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-200/20 text-xs font-medium">
                <span className={activeTier === "low" ? "text-emerald-400" : "text-slate-500"}>
                  {activeTier === "low" ? "✓ Selected" : "Select Lower tier"}
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
              className={`p-4 rounded-lg text-left border-2 transition flex flex-col justify-between gap-3 cursor-pointer ${
                activeTier === "median"
                  ? "bg-slate-900 text-white border-emerald-500 shadow-xs"
                  : "bg-white border-emerald-300 text-slate-900 hover:border-emerald-500"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold uppercase tracking-wider ${activeTier === "median" ? "text-emerald-400" : "text-emerald-700"}`}>
                    Market Median (P50)
                  </span>
                  <span className="text-lg font-bold font-mono">
                    {sym}{quartiles.marketMedian.toFixed(2)}
                  </span>
                </div>
                <p className={`text-xs mt-2 leading-relaxed ${activeTier === "median" ? "text-slate-300" : "text-slate-500"}`}>
                  Center of the market. Reflects equilibrium pricing across established competitors while protecting margins.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-200/20 text-xs font-medium">
                <span className={activeTier === "median" ? "text-emerald-400" : "text-emerald-700 font-semibold"}>
                  {activeTier === "median" ? "✓ Selected (Recommended)" : "Select Market Median"}
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
              className={`p-4 rounded-lg text-left border transition flex flex-col justify-between gap-3 cursor-pointer ${
                activeTier === "premium"
                  ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                  : "bg-white border-slate-200 text-slate-900 hover:border-slate-400"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold uppercase tracking-wider ${activeTier === "premium" ? "text-emerald-400" : "text-slate-700"}`}>
                    Upper Market Range (P75)
                  </span>
                  <span className="text-lg font-bold font-mono">
                    {sym}{quartiles.upperMarketRange.toFixed(2)}
                  </span>
                </div>
                <p className={`text-xs mt-2 leading-relaxed ${activeTier === "premium" ? "text-slate-300" : "text-slate-500"}`}>
                  Priced at the 75th percentile. Supported when offering bespoke personalization, premium packaging, or rare materials.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-200/20 text-xs font-medium">
                <span className={activeTier === "premium" ? "text-emerald-400" : "text-slate-500"}>
                  {activeTier === "premium" ? "✓ Selected" : "Select Upper tier"}
                </span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Etsy Net Margin & Fee Breakdown Panel */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <span className="text-sm font-bold text-slate-900">
              Etsy Fee &amp; Payout Calculator ({regionConfig.countryName})
            </span>
            <p className="text-xs text-slate-500">
              Listing fee {sym}{regionConfig.listingFee.toFixed(2)} • Transaction {(regionConfig.transactionPercent * 100).toFixed(1)}% • Payment {(regionConfig.paymentPercent * 100).toFixed(1)}% + {sym}{regionConfig.paymentFixed.toFixed(2)}
              {regionConfig.regulatoryOperatingPercent ? ` • Regulatory ${(regionConfig.regulatoryOperatingPercent * 100).toFixed(2)}%` : ""}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Quick Adjust Buttons */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
              <button
                type="button"
                onClick={() => adjustPrice(-5)}
                className="h-7 px-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition"
                title="Decrease 5"
              >
                -5
              </button>
              <button
                type="button"
                onClick={() => adjustPrice(-1)}
                className="h-7 px-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition"
                title="Decrease 1"
              >
                -1
              </button>
              <button
                type="button"
                onClick={() => adjustPrice(1)}
                className="h-7 px-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 rounded transition"
                title="Increase 1"
              >
                +1
              </button>
              <button
                type="button"
                onClick={() => adjustPrice(5)}
                className="h-7 px-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 rounded transition"
                title="Increase 5"
              >
                +5
              </button>
            </div>

            {/* Retail Price input */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">Retail:</span>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono font-semibold text-slate-400">
                  {sym}
                </span>
                <input
                  type="number"
                  step="0.5"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(parseFloat(e.target.value) || 0)}
                  className="w-24 h-8 bg-white border border-slate-200 rounded-md pl-6 pr-2 text-xs font-mono font-bold text-slate-900 focus:border-slate-900 outline-none"
                />
              </div>
            </div>

            {/* COGS input */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">Materials Cost (COGS):</span>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono font-semibold text-slate-400">
                  {sym}
                </span>
                <input
                  type="number"
                  step="0.5"
                  value={cogsInput}
                  onChange={(e) => setCogsInput(e.target.value)}
                  placeholder="e.g. 14.00"
                  className="w-28 h-8 bg-white border border-slate-200 rounded-md pl-6 pr-2 text-xs font-mono font-bold text-slate-900 focus:border-slate-900 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 4 Fee Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-1">
            <span className="text-xs font-medium text-slate-500 block">Listing Fee</span>
            <span className="font-mono font-bold text-slate-900 text-base">
              {sym}{feeDetails.listingFee.toFixed(2)}
            </span>
            <span className="text-[11px] text-slate-400 block">Fixed per 4-month auto-renew</span>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-1">
            <span className="text-xs font-medium text-slate-500 block">Transaction (6.5%)</span>
            <span className="font-mono font-bold text-slate-900 text-base">
              {sym}{feeDetails.transactionFee.toFixed(2)}
            </span>
            <span className="text-[11px] text-slate-400 block">Etsy order commission</span>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-1">
            <span className="text-xs font-medium text-slate-500 block">
              Processing ({(regionConfig.paymentPercent * 100).toFixed(0)}% + {sym}{regionConfig.paymentFixed.toFixed(2)})
            </span>
            <span className="font-mono font-bold text-slate-900 text-base">
              {sym}{feeDetails.paymentFee.toFixed(2)}
            </span>
            <span className="text-[11px] text-slate-400 block">Payment gateway</span>
          </div>

          <div className="bg-slate-100/60 p-3.5 rounded-lg border border-slate-200 space-y-1">
            <span className="text-xs font-semibold text-slate-700 block">Total Etsy Fees</span>
            <span className="font-mono font-bold text-slate-900 text-base">
              -{sym}{feeDetails.totalFees.toFixed(2)}
            </span>
            <span className="text-[11px] font-medium text-slate-600 block">
              {feeDetails.effectiveFeePercent}% of retail
            </span>
          </div>
        </div>

        {/* Profit & COGS Assessment */}
        {feeDetails.hasCogs ? (
          <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900">Calculated Profit Margin:</span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                    feeDetails.marginHealth === "healthy"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : feeDetails.marginHealth === "moderate"
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  {feeDetails.profitMarginPercent}% Margin ({feeDetails.marginHealth.toUpperCase()})
                </span>
              </div>
              <span className="font-mono text-xs text-slate-500">
                COGS: {sym}{(feeDetails.cogs || 0).toFixed(2)} • Fees: {sym}{feeDetails.totalFees.toFixed(2)}
              </span>
            </div>

            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  feeDetails.marginHealth === "healthy"
                    ? "bg-emerald-600"
                    : feeDetails.marginHealth === "moderate"
                    ? "bg-blue-600"
                    : "bg-amber-500"
                }`}
                style={{ width: `${Math.min(100, Math.max(5, feeDetails.profitMarginPercent || 0))}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              {feeDetails.marginHealth === "healthy" && "Healthy margin with room for Etsy Ads, coupon promotions, and free shipping guarantees."}
              {feeDetails.marginHealth === "moderate" && "Sustainable production margin for custom and handmade small-batch production."}
              {feeDetails.marginHealth === "tight" && "Tight margin. Consider reducing packaging/materials cost or positioning closer to Upper Range."}
            </p>
          </div>
        ) : (
          <div className="p-3.5 rounded-lg bg-amber-50/70 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-800">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Cost of Goods Sold (COGS) not entered</span>
              <span>Enter your materials and labor cost in the field above to calculate exact net profit and margin health. We never guess your production costs.</span>
            </div>
          </div>
        )}

        {/* Take-Home Net Payout Summary Banner */}
        <div className="p-5 rounded-lg bg-white border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Etsy Net Payout
            </span>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900">
              {sym}{feeDetails.netPayout.toFixed(2)}
            </div>
            <p className="text-xs text-slate-500">
              Deposited to your bank account after all Etsy commission and payment fees are deducted.
            </p>
          </div>

          <div className="md:border-l md:border-slate-200 md:pl-6 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Seller Net Take-Home Profit
              </span>
              {feeDetails.hasCogs && feeDetails.profitMarginPercent !== null && (
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono font-bold text-xs">
                  {feeDetails.profitMarginPercent}% Margin
                </span>
              )}
            </div>

            <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-600">
              {feeDetails.hasCogs && feeDetails.netProfit !== null
                ? `${sym}${feeDetails.netProfit.toFixed(2)}`
                : "Enter COGS"}
            </div>

            <div className="text-xs text-slate-500">
              {feeDetails.hasCogs && feeDetails.netProfit !== null ? (
                <>
                  <span>At 25 orders/month: </span>
                  <strong className="text-slate-900 font-mono">
                    +{sym}{(feeDetails.netProfit * 25).toFixed(2)} net profit
                  </strong>
                </>
              ) : (
                <span>Requires materials cost above to calculate take-home profit.</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
