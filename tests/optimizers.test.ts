import { describe, it, expect } from "vitest";
import { optimizeEtsyTags, validateEtsyTag, ETSY_MAX_TAGS, ETSY_MAX_TAG_CHARS } from "../lib/optimizers/tag-optimizer";
import { validateEtsyTitle, generateCompliantTitle } from "../lib/optimizers/title-optimizer";
import { normalizeKeyword, detectKeywordRelationship } from "../lib/normalization/normalizer";

describe("Etsy 13-Tag Optimizer", () => {
  it("strictly enforces 20 character limit per tag", () => {
    const valid = validateEtsyTag("leather bifold");
    const tooLong = validateEtsyTag("personalized handmade leather wallet");

    expect(valid.isValid).toBe(true);
    expect(tooLong.isValid).toBe(false);
    expect(tooLong.reason).toContain("Exceeds 20 characters");
  });

  it("selects up to 13 tags maximizing semantic diversity across clusters", () => {
    const mockCandidates = [
      { keyword: "leather wallet", cluster: "Core Product", opportunityScore: 85, relevanceScore: 90, intentScore: 70, intentType: "PRODUCT_SEARCH" },
      { keyword: "mens wallet", cluster: "Core Product", opportunityScore: 82, relevanceScore: 85, intentScore: 70, intentType: "PRODUCT_SEARCH" },
      { keyword: "custom wallet", cluster: "Personalization", opportunityScore: 88, relevanceScore: 95, intentScore: 90, intentType: "CUSTOMIZATION_SEARCH" },
      { keyword: "engraved wallet", cluster: "Personalization", opportunityScore: 86, relevanceScore: 95, intentScore: 90, intentType: "CUSTOMIZATION_SEARCH" },
      { keyword: "wallet for husband", cluster: "Recipient", opportunityScore: 84, relevanceScore: 90, intentScore: 85, intentType: "RECIPIENT_SEARCH" },
      { keyword: "wallet for dad", cluster: "Recipient", opportunityScore: 80, relevanceScore: 85, intentScore: 85, intentType: "RECIPIENT_SEARCH" },
      { keyword: "anniversary wallet", cluster: "Occasion", opportunityScore: 83, relevanceScore: 90, intentScore: 85, intentType: "OCCASION_SEARCH" },
      { keyword: "fathers day wallet", cluster: "Occasion", opportunityScore: 79, relevanceScore: 85, intentScore: 85, intentType: "OCCASION_SEARCH" },
      { keyword: "minimalist wallet", cluster: "Style", opportunityScore: 81, relevanceScore: 80, intentScore: 75, intentType: "PRODUCT_SEARCH" },
      { keyword: "rustic wallet", cluster: "Style", opportunityScore: 74, relevanceScore: 80, intentScore: 70, intentType: "PRODUCT_SEARCH" },
      { keyword: "bifold wallet", cluster: "Core Product", opportunityScore: 78, relevanceScore: 85, intentScore: 70, intentType: "PRODUCT_SEARCH" },
      { keyword: "slim wallet", cluster: "Feature", opportunityScore: 80, relevanceScore: 85, intentScore: 75, intentType: "PRODUCT_SEARCH" },
      { keyword: "brown wallet", cluster: "Color", opportunityScore: 72, relevanceScore: 75, intentScore: 65, intentType: "PRODUCT_SEARCH" },
      { keyword: "full grain wallet", cluster: "Material", opportunityScore: 77, relevanceScore: 85, intentScore: 75, intentType: "PRODUCT_SEARCH" },
    ];

    const result = optimizeEtsyTags(mockCandidates, 13);
    expect(result.tagCount).toBeLessThanOrEqual(ETSY_MAX_TAGS);
    expect(result.uniqueClustersCovered.length).toBeGreaterThanOrEqual(5);

    // Ensure every selected tag is under 20 chars
    for (const tag of result.selectedTags) {
      expect(tag.characterCount).toBeLessThanOrEqual(ETSY_MAX_TAG_CHARS);
    }
  });

  it("rejects contradictory keywords from tag suggestions", () => {
    const candidates = [
      { keyword: "leather wallet", cluster: "Core", opportunityScore: 80, relevanceScore: 80, intentScore: 70, intentType: "PRODUCT_SEARCH" },
      { keyword: "vegan wallet", cluster: "Material", opportunityScore: 85, relevanceScore: 5, intentScore: 70, intentType: "PRODUCT_SEARCH", isContradictory: true },
    ];

    const result = optimizeEtsyTags(candidates, 13);
    expect(result.selectedTags.some(t => t.tag.includes("vegan"))).toBe(false);
    expect(result.rejectedCandidates.some(r => r.tag.includes("vegan"))).toBe(true);
  });
});

describe("Title Optimizer & Guideline Compliance", () => {
  it("flags titles with classic keyword stuffing and comma salad", () => {
    const stuffedTitle = "Personalized Wallet, Leather Wallet Men, Wallet for Husband, Gift for Dad, Mens Wallet Gift";
    const result = validateEtsyTitle(stuffedTitle, "Personalized Leather Wallet", "Wallet");

    expect(result.stuffingRiskScore).toBeGreaterThan(40);
    expect(result.repeatedWordCount).toBeGreaterThan(1);
    expect(result.warnings.some(w => w.includes("comma salad") || w.includes("repetition"))).toBe(true);
  });

  it("praises concise, readable titles that front-load objective traits", () => {
    const goodTitle = "Personalized Full Grain Leather Bifold Wallet with Initial Engraving";
    const result = validateEtsyTitle(goodTitle, "Personalized Leather Wallet", "Bifold Wallet");

    expect(result.isUnderCharacterLimit).toBe(true);
    expect(result.isUnderWordGuideline).toBe(true);
    expect(result.stuffingRiskScore).toBe(0);
    expect(result.titleQualityScore).toBeGreaterThanOrEqual(85);
  });

  it("generates a clean title following 2026 guidance", () => {
    const title = generateCompliantTitle({
      productNoun: "Bifold Wallet",
      primaryMaterial: "Full Grain Leather",
      personalizationType: "Custom Initial Engraving",
      recipient: "Men",
    });

    expect(title).toContain("Full Grain Leather");
    expect(title).toContain("Bifold Wallet");
    expect(title.length).toBeLessThanOrEqual(140);
  });
});

describe("Keyword Normalizer & Variant Deduplication", () => {
  it("normalizes unicode and punctuation without losing intent words", () => {
    const raw = "  Personalized   Leather—Wallet   for Men! ";
    const res = normalizeKeyword(raw);

    expect(res.canonicalText).toBe("personalized leather-wallet for men");
    expect(res.tokens).toContain("for"); // 'for' conveys buyer intent
  });

  it("detects plural and word-order variants accurately", () => {
    const relPlural = detectKeywordRelationship("mens leather wallet", "mens leather wallets");
    expect(relPlural.relationType).toBe("PLURAL_VARIANT");

    const relOrder = detectKeywordRelationship("leather wallet", "wallet leather");
    expect(relOrder.relationType).toBe("WORD_ORDER_VARIANT");
  });
});
