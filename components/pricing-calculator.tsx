"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Calculator } from "lucide-react";

interface PricingCalculatorProps {
  prices?: (string | number)[];
  productNoun?: string;
  initialCogs?: number;
  initialPrice?: number;
}

interface CountryConfig {
  label: string;
  pct: number;
  fixed: number;
}

const COUNTRIES: Record<string, CountryConfig> = {
  US: { label: "United States", pct: 0.03, fixed: 0.25 },
  GB: { label: "United Kingdom", pct: 0.04, fixed: 0.2 },
  CA: { label: "Canada", pct: 0.03, fixed: 0.25 },
  AU: { label: "Australia", pct: 0.03, fixed: 0.25 },
  DE: { label: "Germany", pct: 0.04, fixed: 0.3 },
  FR: { label: "France", pct: 0.04, fixed: 0.3 },
  IN: { label: "India", pct: 0.03, fixed: 0.25 },
  OTHER: { label: "Other / not listed", pct: 0.04, fixed: 0.3 },
};

const CIRCUMFERENCE = 2 * Math.PI * 42; // ~263.89378

const r = (val: number): number => (Number.isFinite(val) && val > 0 ? val : 0);

const parseNum = (val: string): number => {
  const s = parseFloat(val);
  return Number.isFinite(s) ? s : 0;
};

const formatMoney = (val: number): string => {
  const num = Number.isFinite(val) ? val : 0;
  return "$" + num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

interface MoneyFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  hint?: string;
}

function MoneyField({ label, value, onChange, hint }: MoneyFieldProps) {
  return (
    <label className="fc-field">
      <span className="fc-label">
        {label}
        {hint && (
          <span className="fc-hint" title={hint} aria-hidden="true">
            ?
          </span>
        )}
      </span>
      <span className="fc-money">
        <span className="fc-unit">$</span>
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0"
        />
      </span>
    </label>
  );
}

export function PricingCalculator({
  prices = [],
  productNoun,
  initialCogs,
  initialPrice,
}: PricingCalculatorProps) {
  // Determine sensible default sale price from competitor benchmark or props
  const defaultSalePrice = useMemo(() => {
    if (initialPrice && initialPrice > 0) return String(initialPrice);
    if (prices && prices.length > 0) {
      const parsed = prices
        .map((p) => {
          if (typeof p === "number") return p > 0 ? p : null;
          const cleaned = String(p).replace(/[^0-9.]/g, "");
          const num = parseFloat(cleaned);
          return isNaN(num) || num <= 0 ? null : num;
        })
        .filter((n): n is number => n !== null);
      if (parsed.length > 0) {
        parsed.sort((a, b) => a - b);
        const mid = parsed[Math.floor(parsed.length / 2)];
        return String(mid.toFixed(2));
      }
    }
    return "25";
  }, [prices, initialPrice]);

  // Form Inputs
  const [salePrice, setSalePrice] = useState<string>(defaultSalePrice);
  const [shippingPrice, setShippingPrice] = useState<string>("5");
  const [discountValue, setDiscountValue] = useState<string>("");
  const [discountType, setDiscountType] = useState<"amount" | "percent">("amount");
  const [costOfItem, setCostOfItem] = useState<string>(
    initialCogs !== undefined && initialCogs !== null && initialCogs > 0 ? String(initialCogs) : "6"
  );
  const [shippingCost, setShippingCost] = useState<string>("4");
  const [advertising, setAdvertising] = useState<"none" | "offsite">("none");
  const [country, setCountry] = useState<string>("US");

  // Keep synced if initialPrice / initialCogs changes externally
  useEffect(() => {
    if (initialPrice && initialPrice > 0) {
      setSalePrice(String(initialPrice));
    }
  }, [initialPrice]);

  useEffect(() => {
    if (initialCogs !== undefined && initialCogs !== null && initialCogs > 0) {
      setCostOfItem(String(initialCogs));
    }
  }, [initialCogs]);

  // Calculation Engine matching exact EverBee math
  const calc = useMemo(() => {
    const rawSale = r(parseNum(salePrice));
    const rawShipCharged = r(parseNum(shippingPrice));
    const rawDiscount = r(parseNum(discountValue));

    const discountAmount =
      discountType === "percent"
        ? rawSale * (rawDiscount / 100)
        : Math.min(rawDiscount, rawSale);

    const discountedSales = Math.max(0, rawSale - discountAmount);
    const totalRev = discountedSales + rawShipCharged;

    // Fees
    const listingFee = 0.2;
    const transactionFee = 0.065 * totalRev;
    const cConfig = COUNTRIES[country] ?? COUNTRIES.US;
    const processingFee = totalRev > 0 ? cConfig.pct * totalRev + cConfig.fixed : 0;
    const advertisingFee = advertising === "offsite" ? 0.15 * totalRev : 0;
    const totalFees = listingFee + transactionFee + processingFee + advertisingFee;

    // Costs
    const cogs = r(parseNum(costOfItem));
    const shipCost = r(parseNum(shippingCost));
    const totalCosts = cogs + shipCost;

    // Net Profit & Margin
    const netProfit = totalRev - totalFees - totalCosts;
    const margin = totalRev > 0 ? netProfit / totalRev : 0;

    return {
      revenue: {
        sales: rawSale,
        shipping: rawShipCharged,
        discount: discountAmount,
        total: totalRev,
      },
      fees: {
        listing: listingFee,
        transaction: transactionFee,
        processing: processingFee,
        advertising: advertisingFee,
        total: totalFees,
      },
      costs: {
        cogs,
        shipping: shipCost,
        total: totalCosts,
      },
      netProfit,
      margin,
    };
  }, [
    salePrice,
    shippingPrice,
    discountValue,
    discountType,
    costOfItem,
    shippingCost,
    advertising,
    country,
  ]);

  // Donut Segments
  const segments = useMemo(() => {
    const rawSegments = [
      { key: "profit", label: "Net profit", value: Math.max(0, calc.netProfit), color: "var(--eb-green)" },
      { key: "fees", label: "Etsy fees", value: calc.fees.total, color: "var(--eb-accent)" },
      { key: "cogs", label: "Cost of goods", value: calc.costs.cogs, color: "var(--eb-brand)" },
      { key: "ship", label: "Shipping cost", value: calc.costs.shipping, color: "var(--eb-brand-2)" },
    ];

    const totalVal = rawSegments.reduce((acc, s) => acc + s.value, 0);
    let cumulative = 0;

    return rawSegments.map((s) => {
      const share = totalVal > 0 ? s.value / totalVal : 0;
      const dash = share * CIRCUMFERENCE;
      const offset = -cumulative * CIRCUMFERENCE;
      cumulative += share;
      return {
        ...s,
        dash,
        offset,
      };
    });
  }, [calc]);

  const isLoss = calc.netProfit < 0;

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-[#263244]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-[#F8FAFC]">
              Etsy Fee & Profit Calculator
            </h2>
            <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
              {productNoun
                ? `Simulate real margins, payment processing, and listing fees for "${productNoun}".`
                : "See official Etsy transaction fees, payment processing, and real net profit."}
            </p>
          </div>
        </div>
      </div>

      {/* EverBee Fee Calculator Layout */}
      <div className="fee-calc">
        {/* Left Inputs Card */}
        <div className="fc-card fc-inputs">
          {/* Group 1: Revenue */}
          <fieldset className="fc-group">
            <legend>Revenue</legend>
            <MoneyField
              label="Sale price"
              value={salePrice}
              onChange={setSalePrice}
              hint="Item price the buyer pays"
            />
            <MoneyField
              label="Shipping charged"
              value={shippingPrice}
              onChange={setShippingPrice}
              hint="Shipping you charge the buyer"
            />
            <label className="fc-field">
              <span className="fc-label">Discount</span>
              <span className="fc-money fc-discount">
                <span className="fc-unit">{discountType === "amount" ? "$" : "%"}</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                />
                <span className="fc-seg" role="group" aria-label="Discount type">
                  <button
                    type="button"
                    className={discountType === "amount" ? "on" : ""}
                    onClick={() => setDiscountType("amount")}
                    aria-pressed={discountType === "amount"}
                  >
                    $
                  </button>
                  <button
                    type="button"
                    className={discountType === "percent" ? "on" : ""}
                    onClick={() => setDiscountType("percent")}
                    aria-pressed={discountType === "percent"}
                  >
                    %
                  </button>
                </span>
              </span>
            </label>
          </fieldset>

          {/* Group 2: Your costs */}
          <fieldset className="fc-group">
            <legend>Your costs</legend>
            <MoneyField
              label="Cost of item"
              value={costOfItem}
              onChange={setCostOfItem}
              hint="What the product costs you to make/buy"
            />
            <MoneyField
              label="Shipping cost"
              value={shippingCost}
              onChange={setShippingCost}
              hint="What you pay to ship the order"
            />
          </fieldset>

          {/* Group 3: Fees & ads */}
          <fieldset className="fc-group">
            <legend>Fees &amp; ads</legend>
            <label className="fc-field">
              <span className="fc-label">Seller country</span>
              <span className="fc-select">
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  aria-label="Seller country"
                >
                  {Object.entries(COUNTRIES).map(([code, item]) => (
                    <option key={code} value={code}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </span>
            </label>
            <label className="fc-field">
              <span className="fc-label">Advertising</span>
              <span className="fc-select">
                <select
                  value={advertising}
                  onChange={(e) => setAdvertising(e.target.value as "none" | "offsite")}
                  aria-label="Advertising"
                >
                  <option value="none">None</option>
                  <option value="offsite">Offsite Ads (15%)</option>
                </select>
              </span>
            </label>
          </fieldset>
        </div>

        {/* Right Summary Card */}
        <div className="fc-card fc-summary">
          {/* Top: Donut Chart & Legend */}
          <div className="fc-top">
            <div
              className="fc-donut"
              role="img"
              aria-label={`Net profit ${formatMoney(calc.netProfit)} of ${formatMoney(calc.revenue.total)} revenue`}
            >
              <svg viewBox="0 0 100 100">
                <circle className="fc-donut-track" cx="50" cy="50" r="42" />
                {segments.map((s) => (
                  <circle
                    key={s.key}
                    cx="50"
                    cy="50"
                    r="42"
                    stroke={s.color}
                    strokeDasharray={`${s.dash} ${CIRCUMFERENCE - s.dash}`}
                    strokeDashoffset={s.offset}
                  />
                ))}
              </svg>
              <div className="fc-donut-center">
                <span className="fc-donut-k">Net profit</span>
                <b className={`num ${isLoss ? "loss" : ""}`}>{formatMoney(calc.netProfit)}</b>
                <span className={`fc-donut-m ${isLoss ? "loss" : ""}`}>
                  {(calc.margin * 100).toFixed(1)}% margin
                </span>
              </div>
            </div>

            <ul className="fc-legend">
              <li>
                <span className="fc-dot" style={{ background: "var(--eb-green)" }} aria-hidden="true" />
                Net profit
                <b className="num">{formatMoney(calc.netProfit)}</b>
              </li>
              <li>
                <span className="fc-dot" style={{ background: "var(--eb-accent)" }} aria-hidden="true" />
                Etsy fees
                <b className="num">{formatMoney(calc.fees.total)}</b>
              </li>
              <li>
                <span className="fc-dot" style={{ background: "var(--eb-brand)" }} aria-hidden="true" />
                Cost of goods
                <b className="num">{formatMoney(calc.costs.cogs)}</b>
              </li>
              <li>
                <span className="fc-dot" style={{ background: "var(--eb-brand-2)" }} aria-hidden="true" />
                Shipping cost
                <b className="num">{formatMoney(calc.costs.shipping)}</b>
              </li>
            </ul>
          </div>

          {/* 3-Column Breakdown */}
          <div className="fc-breakdown">
            <div className="fc-col">
              <h3>Revenue</h3>
              <div className="fc-row">
                <span>Sales</span>
                <span className="num">{formatMoney(calc.revenue.sales)}</span>
              </div>
              <div className="fc-row">
                <span>Shipping</span>
                <span className="num">{formatMoney(calc.revenue.shipping)}</span>
              </div>
              <div className="fc-row">
                <span>Discount</span>
                <span className="num">
                  {calc.revenue.discount > 0 ? `-${formatMoney(calc.revenue.discount)}` : "$0.00"}
                </span>
              </div>
              <div className="fc-row fc-total">
                <span>Total revenue</span>
                <span className="num">{formatMoney(calc.revenue.total)}</span>
              </div>
            </div>

            <div className="fc-col">
              <h3>Etsy fees</h3>
              <div className="fc-row">
                <span>Listing fee</span>
                <span className="num">{formatMoney(calc.fees.listing)}</span>
              </div>
              <div className="fc-row">
                <span>Transaction (6.5%)</span>
                <span className="num">{formatMoney(calc.fees.transaction)}</span>
              </div>
              <div className="fc-row">
                <span>Payment processing</span>
                <span className="num">{formatMoney(calc.fees.processing)}</span>
              </div>
              <div className="fc-row">
                <span>Offsite Ads</span>
                <span className="num">{formatMoney(calc.fees.advertising)}</span>
              </div>
              <div className="fc-row fc-total">
                <span>Total fees</span>
                <span className="num">{formatMoney(calc.fees.total)}</span>
              </div>
            </div>

            <div className="fc-col">
              <h3>Your costs</h3>
              <div className="fc-row">
                <span>Cost of goods</span>
                <span className="num">{formatMoney(calc.costs.cogs)}</span>
              </div>
              <div className="fc-row">
                <span>Shipping cost</span>
                <span className="num">{formatMoney(calc.costs.shipping)}</span>
              </div>
              <div className="fc-row fc-total">
                <span>Total costs</span>
                <span className="num">{formatMoney(calc.costs.total)}</span>
              </div>
            </div>
          </div>

          {/* 4 Bottom Stat Cards */}
          <div className="fc-stats">
            <div className="fc-stat">
              <span>Total revenue</span>
              <b className="num">{formatMoney(calc.revenue.total)}</b>
            </div>
            <div className="fc-stat">
              <span>Fees + costs</span>
              <b className="num">{formatMoney(calc.fees.total + calc.costs.total)}</b>
            </div>
            <div className="fc-stat">
              <span>Net profit</span>
              <b className={`num ${isLoss ? "loss" : ""}`}>{formatMoney(calc.netProfit)}</b>
            </div>
            <div className="fc-stat">
              <span>Profit margin</span>
              <b className={`num ${isLoss ? "loss" : ""}`}>{(calc.margin * 100).toFixed(1)}%</b>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
