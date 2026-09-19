import { describe, it, expect } from "vitest";
import { calculateDemandScore } from "../lib/scoring/demand";
import { calculateCompetitionScore } from "../lib/scoring/competition";
import { calculateProductRelevance } from "../lib/scoring/relevance";
import { calculateBuyerIntent } from "../lib/scoring/intent";
import { calculateTrendScore } from "../lib/scoring/trend";
import { calculateOpportunityScore } from "../lib/scoring/opportunity";
import { calculateConfidenceScore } from "../lib/scoring/confidence";

describe("Demand Scoring Engine", () => {
  it("handles missing or null searches gracefully without faking data", () => {
    const result = calculateDemandScore(null);
    expect(result.isAvailable).toBe(false);
    expect(result.demandScore).toBeNull();
  });

  it("calculates logarithmic demand percentile rank across cohort", () => {
    const cohort = [100, 500, 1000, 5000, 10000];
    const topResult = calculateDemandScore(10000, cohort);
    const midResult = calculateDemandScore(1000, cohort);
    const lowResult = calculateDemandScore(100, cohort);

    expect(topResult.demandScore).toBeGreaterThan(midResult.demandScore!);
    expect(midResult.demandScore).toBeGreaterThan(lowResult.demandScore!);
    expect(topResult.isAvailable).toBe(true);
  });
});

describe("Competition Opportunity Scoring", () => {
  it("inverts difficulty so higher opportunity score represents easier market", () => {
    const easyMarket = calculateCompetitionScore(50);
    const saturatedMarket = calculateCompetitionScore(75000);

    expect(easyMarket.competitionOpportunityScore!).toBeGreaterThan(saturatedMarket.competitionOpportunityScore!);
    expect(easyMarket.competitionDifficultyScore!).toBeLessThan(saturatedMarket.competitionDifficultyScore!);
  });

  it("applies relevantResultRatio to derive effective competition", () => {
    const result = calculateCompetitionScore(10000, 0.4);
    expect(result.effectiveCompetition).toBe(4000);
    expect(result.isDerived).toBe(true);
  });
});

describe("Product Relevance & Contradiction Blocking", () => {
  const genuineLeatherWallet = {
    name: "Personalized Full Grain Leather Bifold Wallet",
    category: "Wallets",
    materials: "Full Grain Leather",
    features: "Bifold, 6 card slots",
    hasRfid: false,
    isGenuineLeather: true,
  };

  it("assigns high relevance to direct match phrases", () => {
    const result = calculateProductRelevance("personalized leather wallet", genuineLeatherWallet);
    expect(result.relevanceScore).toBeGreaterThanOrEqual(75);
    expect(result.state).toBe("HIGHLY_RELEVANT");
    expect(result.contradictionsFound.length).toBe(0);
  });

  it("blocks contradictory vegan keywords for genuine animal leather products", () => {
    const result = calculateProductRelevance("vegan leather wallet", genuineLeatherWallet);
    expect(result.relevanceScore).toBeLessThan(30);
    expect(result.state).toBe("BLOCKED");
    expect(result.contradictionsFound.length).toBeGreaterThan(0);
    expect(result.contradictionsFound[0]).toContain("vegan/faux");
  });

  it("blocks RFID claims when product lacks RFID shielding", () => {
    const result = calculateProductRelevance("rfid blocking wallet", genuineLeatherWallet);
    expect(result.contradictionsFound.length).toBeGreaterThan(0);
    expect(result.contradictionsFound[0]).toContain("RFID");
  });
});

describe("Opportunity Dynamic Re-Normalization", () => {
  it("re-normalizes weights when signals like Trend and SellerFit are missing", () => {
    // Only Demand (0.26), Competition (0.17), Relevance (0.18), Intent (0.14) available
    // Total available weight = 0.75
    const result = calculateOpportunityScore({
      demand: 80,
      competition: 60,
      relevance: 90,
      intent: 85,
      trend: null,
      serp: null,
      sellerFit: null,
    });

    expect(result.availableSignalsCount).toBe(4);
    expect(result.totalSignalsCount).toBe(7);
    expect(result.opportunityScore).toBeGreaterThan(0);
    expect(result.weightsUsed.trend).toBe(0);
    expect(result.weightsUsed.sellerFit).toBe(0);

    // Sum of normalized weights should approximately equal 1
    const totalWeights = Object.values(result.weightsUsed).reduce((a, b) => a + b, 0);
    expect(totalWeights).toBeCloseTo(1.0, 2);
  });
});

describe("Confidence Score Decoupling", () => {
  it("assigns strictly 0 production confidence to synthetic development fixtures", () => {
    const result = calculateConfidenceScore({
      primarySourceType: "SYNTHETIC_DEMO",
      availableSignalsCount: 7,
      isSynthetic: true,
    });

    expect(result.confidenceScore).toBe(0);
    expect(result.confidenceLevel).toBe("VERY_LOW");
  });

  it("assigns very high confidence to fresh Level 1 Marketplace Insights data", () => {
    const result = calculateConfidenceScore({
      primarySourceType: "ETSY_MARKETPLACE_INSIGHTS",
      observationDate: new Date(),
      availableSignalsCount: 6,
      sampleSize: 50,
      isSynthetic: false,
    });

    expect(result.confidenceScore).toBeGreaterThanOrEqual(85);
    expect(["HIGH", "VERY_HIGH"]).toContain(result.confidenceLevel);
  });
});

describe("Trend Momentum Engine", () => {
  it("returns unavailable when history has fewer than 2 data points", () => {
    const result = calculateTrendScore([{ observedAt: new Date(), searches: 500 }]);
    expect(result.isAvailable).toBe(false);
    expect(result.trendScore).toBeNull();
    expect(result.label).toBe("INSUFFICIENT_DATA");
  });

  it("detects rising momentum from historical observations", () => {
    const result = calculateTrendScore([
      { observedAt: new Date("2026-08-01"), searches: 1000 },
      { observedAt: new Date("2026-09-01"), searches: 1500 },
    ]);
    expect(result.isAvailable).toBe(true);
    expect(result.trendScore!).toBeGreaterThan(50);
    expect(result.label).toBe("RISING");
  });
});
