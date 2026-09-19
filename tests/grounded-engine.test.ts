import { describe, it, expect } from "vitest";
import { validateListingClaims } from "../lib/product-facts/validator";
import { ProductFacts } from "../lib/product-facts/types";
import { calculatePriceQuartiles, calculateEtsyFees } from "../lib/fees/etsy-fees";
import { getCategoryMediaPlan } from "../lib/media/category-media-plan";
import { evaluateListingReadiness } from "../lib/analyzers/listing-analyzer";

describe("Grounded Intelligence Engine & Product Facts Shield", () => {
  describe("Claim Whitelist Validator", () => {
    it("Ceramic matcha bowl: strictly rejects unconfirmed leather or wood claims", () => {
      const facts: ProductFacts = {
        productType: "physical",
        productNoun: "Ceramic Matcha Bowl",
        category: "Home & Living > Kitchen & Dining > Drinkware > Bowls",
        primaryMaterial: "Stoneware Ceramic, Food-Safe Glaze",
        personalization: { isOffered: false },
      };

      const invalidContent = {
        title: "Ceramic Matcha Bowl Genuine Cowhide Leather Wrap Artisan Gift",
        tags: ["matcha bowl", "leather wrap", "japanese tea"],
        description: "Handcrafted from walnut hardwood and finished with premium cowhide leather.",
      };

      const result = validateListingClaims(facts, invalidContent);

      expect(result.isValid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);

      const leatherIssues = result.issues.filter((i) => i.term.includes("leather") || i.term.includes("cowhide"));
      expect(leatherIssues.length).toBeGreaterThan(0);

      // Verify sanitization strips unsupported material from title
      expect(result.sanitizedTitle?.toLowerCase()).not.toContain("cowhide");
    });

    it("Printable wedding planner: strictly rejects physical postal shipping packaging terms", () => {
      const facts: ProductFacts = {
        productType: "digital",
        productNoun: "Printable Wedding Planner",
        category: "Paper & Party Supplies > Paper > Calendars & Planners",
        primaryMaterial: "Digital PDF Template",
      };

      const invalidContent = {
        title: "Printable Wedding Planner PDF Shipped in Box With Bubble Mailer",
        tags: ["wedding planner", "pdf download", "bubble mailer"],
        description: "Your planner will be shipped in box with protective bubble mailer.",
      };

      const result = validateListingClaims(facts, invalidContent);
      expect(result.isValid).toBe(false);

      const shippingIssues = result.issues.filter((i) => i.term.includes("shipped in box") || i.term.includes("bubble mailer"));
      expect(shippingIssues.length).toBeGreaterThan(0);
    });

    it("Personalization check: flags personalization when seller marked isOffered as false", () => {
      const facts: ProductFacts = {
        productType: "physical",
        productNoun: "Ceramic Coffee Mug",
        category: "Drinkware > Mugs",
        primaryMaterial: "Stoneware Ceramic",
        personalization: { isOffered: false },
      };

      const result = validateListingClaims(facts, {
        title: "Personalized Ceramic Coffee Mug Custom Engraved Gift",
      });

      expect(result.isValid).toBe(false);
      expect(result.issues.some((i) => i.type === "unsupported_personalization")).toBe(true);
    });
  });

  describe("Price Quartiles & Region-Aware Fees", () => {
    it("computes accurate market percentiles from real competitor prices", () => {
      const realPrices = [24.0, 30.0, 35.0, 48.0, 52.0, 60.0, 85.0];
      const quartiles = calculatePriceQuartiles(realPrices, "USD");

      expect(quartiles).not.toBeNull();
      expect(quartiles?.sampleSize).toBe(7);
      expect(quartiles?.marketMin).toBe(24.0);
      expect(quartiles?.marketMax).toBe(85.0);
      expect(quartiles?.marketMedian).toBe(48.0);
      expect(quartiles?.lowerMarketRange!).toBeLessThan(quartiles!.marketMedian!);
      expect(quartiles?.upperMarketRange!).toBeGreaterThan(quartiles!.marketMedian!);
      expect(quartiles?.isSufficient).toBe(true);
    });

    it("requires at least 5 competitor prices before computing quartiles", () => {
      const scarcePrices = [32.0, 45.0, 50.0];
      const quartiles = calculatePriceQuartiles(scarcePrices, "USD");

      expect(quartiles).not.toBeNull();
      expect(quartiles?.sampleSize).toBe(3);
      expect(quartiles?.isSufficient).toBe(false);
      expect(quartiles?.message).toContain("Insufficient market data");
    });

    it("calculates exact US fees and flags missing COGS without guessing", () => {
      const breakdown = calculateEtsyFees(50.0, undefined, "US");

      expect(breakdown.listingFee).toBe(0.20);
      expect(breakdown.transactionFee).toBe(3.25); // 6.5% of 50
      expect(breakdown.paymentFee).toBe(1.75);     // 3% of 50 ($1.50) + $0.25 = $1.75
      expect(breakdown.totalFees).toBe(5.20);
      expect(breakdown.netPayout).toBe(44.80);

      // COGS is never pre-filled with a hidden guess!
      expect(breakdown.hasCogs).toBe(false);
      expect(breakdown.netProfit).toBeNull();
      expect(breakdown.profitMarginPercent).toBeNull();
    });

    it("calculates net profit accurately when COGS is provided", () => {
      const breakdown = calculateEtsyFees(50.0, 14.80, "US");

      expect(breakdown.hasCogs).toBe(true);
      expect(breakdown.netPayout).toBe(44.80);
      expect(breakdown.netProfit).toBe(30.00); // 44.80 - 14.80
      expect(breakdown.profitMarginPercent).toBe(60.0); // (30 / 50) * 100
      expect(breakdown.marginHealth).toBe("healthy");
    });

    it("supports UK regional rates with regulatory operating fee", () => {
      const breakdown = calculateEtsyFees(40.0, 10.0, "UK");

      expect(breakdown.currencySymbol).toBe("£");
      expect(breakdown.listingFee).toBe(0.16);
      expect(breakdown.transactionFee).toBe(2.60); // 6.5% of 40
      expect(breakdown.paymentFee).toBe(1.80);     // 4% of 40 (£1.60) + £0.20 = £1.80
      expect(breakdown.regulatoryOperatingFee).toBeGreaterThan(0);
      expect(breakdown.netPayout).toBeLessThan(40.0);
    });
  });

  describe("Category-Aware Media Strategy", () => {
    it("Ceramics category gets glaze luster and pouring video, never leather grain", () => {
      const plan = getCategoryMediaPlan("Home & Living > Kitchen & Dining > Drinkware > Bowls");

      expect(plan.categoryName).toBe("Ceramics & Pottery");
      expect(plan.videoStrategy.title).toContain("Glaze");
      const titles = plan.photoSlots.map((s) => s.title.toLowerCase());
      expect(titles.some((t) => t.includes("glaze"))).toBe(true);
      expect(titles.some((t) => t.includes("leather"))).toBe(false);
    });

    it("Digital Downloads gets iPad/screen walkthrough and instant download graphic", () => {
      const plan = getCategoryMediaPlan("Paper & Party Supplies > Planners > Digital Download");

      expect(plan.categoryName).toBe("Digital Downloads & Printables");
      expect(plan.videoStrategy.title).toContain("PDF");
      const titles = plan.photoSlots.map((s) => s.title.toLowerCase());
      expect(titles.some((t) => t.includes("device"))).toBe(true);
      expect(titles.some((t) => t.includes("how to download"))).toBe(true);
    });

    it("Pet Supplies gets buckle tensile strength and sizing chart", () => {
      const plan = getCategoryMediaPlan("Pet Supplies > Dog Collars & Leashes");

      expect(plan.categoryName).toBe("Pet Supplies");
      expect(plan.videoStrategy.title).toContain("Buckle");
      const titles = plan.photoSlots.map((s) => s.title.toLowerCase());
      expect(titles.some((t) => t.includes("sizing guide"))).toBe(true);
    });
  });

  describe("Listing Readiness Audit Checklist", () => {
    it("evaluates 12 distinct objective criteria and returns transparent checklist", () => {
      const report = evaluateListingReadiness({
        title: "Ceramic Matcha Bowl Handcrafted in Stoneware Clay Japanese Tea Chawan",
        leadKeyword: "ceramic matcha bowl",
        tags: [
          "ceramic matcha bowl",
          "stoneware tea bowl",
          "japanese tea chawan",
          "handmade pottery cup",
          "artisan matcha cup",
          "green tea whisk bowl",
          "wheel thrown pottery",
          "wabi sabi ceramics",
          "tea ceremony bowl",
          "speckled clay bowl",
          "zen tea lover gift",
          "handcrafted chawan",
          "pottery matcha bowl",
        ],
        materials: "Stoneware Ceramic, Food-Safe Reactive Glaze",
        primaryColor: "Olive Green",
        dimensions: "4.5 in diameter x 3 in height",
        careInstructions: "Microwave safe. Hand-washing recommended.",
        targetPrice: 42.0,
        marketMin: 28.0,
        marketMax: 65.0,
        photoSlotsCount: 10,
        hasFaqs: true,
        competitorCount: 8,
      });

      expect(report.totalChecks).toBe(12);
      expect(report.completedCount).toBe(12);
      expect(report.status).toBe("ready");
      expect(report.summary).toContain("12 of 12 checks complete");
    });

    it("marks pricing check as cannot_evaluate when competitorCount is under 5", () => {
      const report = evaluateListingReadiness({
        title: "Ceramic Matcha Bowl Handcrafted in Stoneware Clay Japanese Tea Chawan",
        leadKeyword: "ceramic matcha bowl",
        tags: ["ceramic matcha bowl", "stoneware tea bowl"],
        competitorCount: 2,
      });

      const priceCheck = report.checks.find((c) => c.id === "price_market_range");
      expect(priceCheck?.status).toBe("cannot_evaluate");
      expect(priceCheck?.recommendation).toContain("Insufficient market data");
      expect(report.cannotEvaluateCount).toBeGreaterThan(0);
    });

    it("accurately reports remaining tag slots without contradicting itself", () => {
      const tags = [
        "matcha bowl",
        "ceramic chawan",
        "tea ceremony",
        "japanese pottery",
        "green tea cup",
        "stoneware bowl",
        "handmade chawan",
        "artisan ceramic",
        "wabi sabi bowl",
        "speckled tea bowl",
      ];
      expect(tags.length).toBe(10);

      const report = evaluateListingReadiness({
        title: "Ceramic Matcha Bowl",
        leadKeyword: "ceramic matcha bowl",
        tags,
      });

      const tagCheck = report.checks.find((c) => c.id === "tag_count");
      expect(tagCheck?.status).toBe("needs_attention");
      expect(tagCheck?.label).toBe("10 of 13 tag slots filled (3 remaining)");
      expect(tagCheck?.recommendation).toContain("3 unused tag slot(s)");
    });
  });

  describe("Semantic Contamination Circuit Breaker", () => {
    it("detects contamination when ceramic query receives wallet or leather facts", async () => {
      const { isSemanticContamination } = await import("../lib/grounding/contamination");
      expect(
        isSemanticContamination("ceramic matcha bowl", "Leather Bifold Wallet", "Bags & Purses > Wallets", "Full-Grain Leather")
      ).toBe(true);
    });

    it("detects contamination when wallet query receives ceramic bowl facts", async () => {
      const { isSemanticContamination } = await import("../lib/grounding/contamination");
      expect(
        isSemanticContamination("leather card holder", "Ceramic Bowl", "Kitchen & Dining > Drinkware > Bowls", "Stoneware Clay")
      ).toBe(true);
    });

    it("detects contamination when jewelry query receives leather or wood facts", async () => {
      const { isSemanticContamination } = await import("../lib/grounding/contamination");
      expect(
        isSemanticContamination("sterling silver birth flower necklace", "Leather Wallet", "Bags & Purses", "Leather")
      ).toBe(true);
    });

    it("detects contamination when digital planner receives physical materials", async () => {
      const { isSemanticContamination } = await import("../lib/grounding/contamination");
      expect(
        isSemanticContamination("digital wedding planner GoodNotes template", "Ceramic Mug", "Kitchen", "Ceramic")
      ).toBe(true);
    });

    it("allows aligned product queries and facts without false flags", async () => {
      const { isSemanticContamination } = await import("../lib/grounding/contamination");
      expect(
        isSemanticContamination("handmade ceramic coffee mug", "Ceramic Coffee Mug", "Kitchen & Dining > Drinkware > Mugs", "Stoneware Ceramic")
      ).toBe(false);

      expect(
        isSemanticContamination("personalized leather wallet", "Leather Bifold Wallet", "Bags & Purses > Wallets & Money Clips", "Full-Grain Cowhide")
      ).toBe(false);
    });
  });
});
