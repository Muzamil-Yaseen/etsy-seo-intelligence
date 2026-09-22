import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizeKeyword } from "@/lib/normalization/normalizer";
import { generateKeywordCandidates, generateKeywordExplanation } from "@/lib/ai/services";
import { calculateProductRelevance } from "@/lib/scoring/relevance";
import { calculateBuyerIntent } from "@/lib/scoring/intent";
import { calculateOpportunityScore } from "@/lib/scoring/opportunity";
import { calculateConfidenceScore } from "@/lib/scoring/confidence";
import { optimizeEtsyTags, validateEtsyTag } from "@/lib/optimizers/tag-optimizer";
import { validateEtsyTitle, generateCompliantTitle } from "@/lib/optimizers/title-optimizer";
import { generateGroqListingIntelligence } from "@/lib/ai/groq-service";
import { ProductFacts } from "@/lib/product-facts/types";
import { validateListingClaims } from "@/lib/product-facts/validator";
import { calculatePriceQuartiles } from "@/lib/fees/etsy-fees";
import { getCategoryMediaPlan } from "@/lib/media/category-media-plan";
import { evaluateListingReadiness } from "@/lib/analyzers/listing-analyzer";
import { isSemanticContamination } from "@/lib/grounding/contamination";

const QuickOptimizeRequestSchema = z.object({
  mode: z.enum(["research", "optimize"]).optional().default("optimize"),
  queryOrUrl: z.string().optional(),
  productFacts: z
    .object({
      productType: z.enum(["physical", "digital"]).optional(),
      productNoun: z.string().optional(),
      category: z.string().optional(),
      primaryMaterial: z.string().optional(),
      secondaryMaterials: z.array(z.string()).optional(),
      colors: z.array(z.string()).optional(),
      dimensions: z
        .object({
          length: z.number().optional(),
          width: z.number().optional(),
          height: z.number().optional(),
          unit: z.enum(["in", "cm", "mm"]),
        })
        .optional(),
      personalization: z
        .object({
          isOffered: z.boolean(),
          instructions: z.string().optional(),
          maxCharacters: z.number().optional(),
        })
        .optional(),
      careInstructions: z.string().optional(),
      shippingOrigin: z.string().optional(),
      targetAudience: z.string().optional(),
      occasion: z.string().optional(),
      cogs: z.number().optional(),
      targetPrice: z.number().optional(),
      currency: z.string().optional(),
      forbiddenClaims: z.array(z.string()).optional(),
      confirmedClaims: z.array(z.string()).optional(),
    })
    .optional(),
  competitorListings: z
    .array(
      z.object({
        listingId: z.union([z.string(), z.number()]).optional(),
        title: z.string(),
        url: z.string().optional(),
        price: z.union([z.string(), z.number()]).optional(),
        currency: z.string().optional(),
        shopName: z.string().optional(),
        imageUrl: z.string().optional(),
        images: z.any().optional(),
        tags: z.array(z.string()).optional(),
        description: z.string().optional(),
      })
    )
    .optional(),
  competitorUrls: z.array(z.string()).optional(),
  manualPrices: z.array(z.union([z.string(), z.number()])).optional(),
  url1: z.string().optional(),
  url2: z.string().optional(),
  url3: z.string().optional(),
  customNotes: z.string().optional(),
  groqApiKey: z.string().optional(),
});

interface ParsedCompetitorItem {
  url: string;
  listingId: string | null;
  title: string;
  price: number | null;
  currency: string;
  shopName: string;
  imageUrl?: string;
  images?: any[];
  description?: string;
  tags: string[];
  tokens: string[];
  phrases: string[];
}

/**
 * Checks if a string is a real Etsy URL or valid web link.
 */
function isValidEtsyUrl(url: string): boolean {
  if (!url) return false;
  const trimmed = url.trim().toLowerCase();
  return trimmed.includes("etsy.com/listing/") || trimmed.includes("etsy.me/");
}

function parseCompetitorUrl(input: string): { listingId: string | null; title: string } | null {
  const trimmed = input.trim();
  if (!isValidEtsyUrl(trimmed)) {
    return null; // Do NOT parse query strings as competitor URLs!
  }

  let title = "";
  let listingId: string | null = null;

  const match = trimmed.match(/listing\/(\d+)(?:\/([^/?#]+))?/i);
  if (match) {
    listingId = match[1];
    if (match[2]) {
      title = match[2]
        .replace(/-/g, " ")
        .replace(/[^a-zA-Z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    }
  }

  return { listingId, title: title || `Listing ${listingId}` };
}

/**
 * Derives clean product identity directly from the seed query to prevent
 * leftover state contamination from previous analyses.
 */
function inferProductIdentityFromQuery(query: string) {
  const q = query.toLowerCase();

  if (q.includes("ceramic") || q.includes("pottery") || q.includes("matcha") || q.includes("bowl") || q.includes("mug")) {
    const isMug = q.includes("mug") || q.includes("cup");
    return {
      productNoun: isMug ? "Ceramic Coffee Mug" : "Ceramic Matcha Bowl",
      category: "Home & Living > Kitchen & Dining > Drinkware > Bowls",
      primaryMaterial: "Stoneware Ceramic, Food-Safe Glaze",
      careInstructions: "Microwave and dishwasher safe. Hand-washing recommended.",
    };
  }

  if (q.includes("leather") || q.includes("wallet") || q.includes("bifold") || q.includes("tote") || q.includes("purse")) {
    const isTote = q.includes("tote") || q.includes("bag");
    return {
      productNoun: isTote ? "Leather Tote Bag" : "Leather Bifold Wallet",
      category: isTote ? "Bags & Purses > Handbags > Totes" : "Bags & Purses > Wallets & Money Clips > Wallets",
      primaryMaterial: "Full-Grain Vegetable-Tanned Cowhide Leather",
      careInstructions: "Keep away from prolonged standing water. Condition periodically with natural beeswax balm.",
    };
  }

  if (q.includes("necklace") || q.includes("jewelry") || q.includes("ring") || q.includes("pendant") || q.includes("earring")) {
    return {
      productNoun: "Pendant Necklace",
      category: "Jewelry > Necklaces > Pendants",
      primaryMaterial: q.includes("gold") ? "14K Gold Filled" : "925 Sterling Silver",
      careInstructions: "Store in an airtight anti-tarnish pouch. Remove before showering or swimming.",
    };
  }

  if (q.includes("cutting board") || q.includes("charcuterie") || q.includes("chopping block")) {
    return {
      productNoun: "Wood Cutting Board",
      category: "Home & Living > Kitchen & Dining > Cookware > Cutting Boards",
      primaryMaterial: "Solid Hardwood (Walnut / Maple), Food-Grade Mineral Oil",
      careInstructions: "Hand wash only with warm soapy water; dry immediately. Never wash in a dishwasher.",
    };
  }

  if (q.includes("digital") || q.includes("download") || q.includes("planner") || q.includes("printable") || q.includes("template")) {
    return {
      productNoun: "Digital Planner Template",
      category: "Paper & Party Supplies > Paper > Calendars & Planners",
      primaryMaterial: "Digital Download (PDF / GoodNotes)",
      careInstructions: "Compatible with iPad, tablet note apps (GoodNotes, Notability), and printable PDF viewers.",
    };
  }

  if (q.includes("collar") || q.includes("leash") || q.includes("dog") || q.includes("pet")) {
    return {
      productNoun: "Pet Dog Collar",
      category: "Pet Supplies > Pet Collars & Leashes",
      primaryMaterial: "Heavy-Duty Webbing / Leather with Cast Alloy Hardware",
      careInstructions: "Wipe clean with a damp cloth. Air dry away from direct heat.",
    };
  }

  const cleanWords = query.split(/\s+/).filter((w) => w.length > 2);
  const noun = cleanWords.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") || "Handmade Item";
  return {
    productNoun: noun,
    category: "Handmade Products",
    primaryMaterial: "Quality Artisan Materials",
    careInstructions: "Clean gently with a soft cloth. Store in a dry environment.",
  };
}


export async function POST(request: Request) {
  try {
    const json = await request.json();
    const data = QuickOptimizeRequestSchema.parse(json);

    const mode = data.mode || "optimize";
    const rawQuery = (data.queryOrUrl || "").trim();

    if (!rawQuery && (!data.competitorListings || data.competitorListings.length === 0)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid search keyword or competitor listing." },
        { status: 400 }
      );
    }

    // 1. Build List of Real Competitors (STRICT: ZERO FAKE FALLBACKS)
    const competitors: ParsedCompetitorItem[] = [];

    // Case A: Real listings from official Etsy API
    if (data.competitorListings && data.competitorListings.length > 0) {
      for (const item of data.competitorListings) {
        const rawPrice = item.price;
        let numPrice: number | null = null;
        if (typeof rawPrice === "number") numPrice = rawPrice;
        else if (typeof rawPrice === "string") {
          const p = parseFloat(rawPrice.replace(/[^0-9.]/g, ""));
          if (!isNaN(p) && p > 0) numPrice = p;
        }

        const titleWords = normalizeKeyword(item.title)
          .canonicalText.split(/\s+/)
          .filter((w) => w.length > 1);

        const phrases: string[] = [];
        for (let i = 0; i < titleWords.length; i++) {
          if (i + 1 < titleWords.length) phrases.push(`${titleWords[i]} ${titleWords[i + 1]}`);
          if (i + 2 < titleWords.length) phrases.push(`${titleWords[i]} ${titleWords[i + 1]} ${titleWords[i + 2]}`);
        }

        // Validate that URL is genuine
        const listingUrl = item.url && item.url.startsWith("http")
          ? item.url
          : item.listingId
          ? `https://www.etsy.com/listing/${item.listingId}`
          : "";

        if (item.title && (listingUrl || item.listingId)) {
          competitors.push({
            url: listingUrl,
            listingId: item.listingId ? String(item.listingId) : null,
            title: item.title,
            price: numPrice,
            currency: item.currency || "USD",
            shopName: item.shopName || "Etsy Shop",
            imageUrl: item.imageUrl,
            images: Array.isArray(item.images) ? item.images : item.imageUrl ? [item.imageUrl] : [],
            description: item.description,
            tags: Array.isArray(item.tags) ? item.tags : [],
            tokens: titleWords,
            phrases,
          });
        }
      }
    }

    // Case B: Explicit user-entered manual Etsy URLs
    const explicitManualUrls: string[] = [];
    if (data.competitorUrls) explicitManualUrls.push(...data.competitorUrls.filter(isValidEtsyUrl));
    if (data.url1 && isValidEtsyUrl(data.url1)) explicitManualUrls.push(data.url1.trim());
    if (data.url2 && isValidEtsyUrl(data.url2)) explicitManualUrls.push(data.url2.trim());
    if (data.url3 && isValidEtsyUrl(data.url3)) explicitManualUrls.push(data.url3.trim());

    explicitManualUrls.forEach((inputUrl, idx) => {
      // Prevent duplicating if already added from competitorListings
      if (competitors.some((c) => c.url === inputUrl)) return;

      const parsed = parseCompetitorUrl(inputUrl);
      if (parsed) {
        if (parsed.listingId && competitors.some((c) => c.listingId === parsed.listingId)) return;
        const norm = normalizeKeyword(parsed.title).canonicalText;
        const words = norm.split(/\s+/).filter((w) => w.length > 1);

        const phrases: string[] = [];
        for (let i = 0; i < words.length; i++) {
          if (i + 1 < words.length) phrases.push(`${words[i]} ${words[i + 1]}`);
          if (i + 2 < words.length) phrases.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
        }

        let parsedPrice: number | null = null;
        const manualP = data.manualPrices?.[idx];
        if (typeof manualP === "number") parsedPrice = manualP;
        else if (typeof manualP === "string") {
          const num = parseFloat(manualP.replace(/[^0-9.]/g, ""));
          if (!isNaN(num) && num > 0) parsedPrice = num;
        }

        competitors.push({
          url: inputUrl,
          listingId: parsed.listingId,
          title: parsed.title,
          price: parsedPrice,
          currency: "USD",
          shopName: parsed.listingId ? `Etsy Listing #${parsed.listingId}` : `Listing #${idx + 1}`,
          tags: [],
          tokens: words,
          phrases,
        });
      }
    });

    // NOTE: If competitors is empty, we do NOT invent fake items! competitors = [] is honest.

    // 2. Statistical Price Quartiles (Requires >= 5 prices)
    const realPrices = competitors
      .map((c) => c.price)
      .filter((p): p is number => typeof p === "number" && p > 0);
    const priceQuartiles = calculatePriceQuartiles(realPrices);

    // 3. Competitor Cross-Overlap Analysis
    const tokenFreq = new Map<string, number>();
    const phraseFreq = new Map<string, { count: number; inTitles: number; inTags: number }>();

    competitors.forEach((comp) => {
      const uniqueTokens = new Set(comp.tokens);
      for (const t of uniqueTokens) {
        tokenFreq.set(t, (tokenFreq.get(t) || 0) + 1);
      }

      const uniquePhrases = new Set(comp.phrases);
      for (const p of uniquePhrases) {
        const existing = phraseFreq.get(p) || { count: 0, inTitles: 0, inTags: 0 };
        existing.count += 1;
        existing.inTitles += 1;
        phraseFreq.set(p, existing);
      }

      // Check tags
      comp.tags.forEach((tag) => {
        const normTag = normalizeKeyword(tag).canonicalText;
        const existing = phraseFreq.get(normTag) || { count: 0, inTitles: 0, inTags: 0 };
        existing.count += 1;
        existing.inTags += 1;
        phraseFreq.set(normTag, existing);
      });
    });

    // Enforce Evidence Threshold for Shared Phrases: must appear in at least 2 listings or >= 25% of competitors
    const minListingThreshold = competitors.length >= 4 ? 2 : 1;
    const sortedSharedPhrases = Array.from(phraseFreq.entries())
      .filter(([_, info]) => info.count >= minListingThreshold)
      .map(([phrase, info]) => ({
        phrase,
        count: info.count,
        inTitles: info.inTitles,
        inTags: info.inTags,
        ratio: competitors.length > 0 ? `${info.count}/${competitors.length}` : "—",
      }))
      .sort((a, b) => b.count - a.count);

    // 4. Grounded Product Facts & Circuit Breaker Guard
    const inferredIdentity = inferProductIdentityFromQuery(rawQuery);
    let userFacts: Partial<ProductFacts> = (mode === "research" ? {} : data.productFacts) || {};

    // Circuit Breaker: Check for semantic contamination across any fact fields
    if (
      isSemanticContamination(
        rawQuery,
        userFacts.productNoun,
        userFacts.category,
        userFacts.primaryMaterial
      )
    ) {
      console.warn(
        `Semantic contamination detected! Query: "${rawQuery}" vs facts. Auto-resetting facts to match query.`
      );
      userFacts = {}; // Purge contaminated facts!
    }

    const confirmedNoun = userFacts.productNoun || inferredIdentity.productNoun;
    const confirmedCategory = userFacts.category || inferredIdentity.category;
    const confirmedMaterials = userFacts.primaryMaterial || (data.customNotes ? data.customNotes : inferredIdentity.primaryMaterial);
    const confirmedCare = userFacts.careInstructions || inferredIdentity.careInstructions;

    const productContext = {
      name: rawQuery,
      category: confirmedCategory,
      materials: confirmedMaterials,
      features: "Artisan handcrafted construction",
      personalization: userFacts.personalization?.isOffered ? "Customization offered" : "Standard artisan craft",
      recipient: userFacts.targetAudience || "Handmade art enthusiasts",
      occasion: userFacts.occasion || "Year-Round Gift",
      isGenuineLeather: confirmedMaterials.toLowerCase().includes("leather"),
      hasRfid: false,
    };

    // 5. Generate Candidate Keyword Universe
    const candidateUniverse = await generateKeywordCandidates(rawQuery, productContext);

    // Build Observed Keywords from Competitors
    const observedKeywords = sortedSharedPhrases.slice(0, 15).map((p) => ({
      keyword: p.phrase,
      source: "observed" as const,
      cluster: "Observed in Market",
      inTitles: p.inTitles,
      inTags: p.inTags,
      competitorCount: p.count,
      competitorRatio: p.ratio,
      rationale: `Directly observed across ${p.count} competitor listings.`,
    }));

    // Build Suggested Keywords from AI Candidate Expansion
    const suggestedKeywords = candidateUniverse.candidates
      .filter((c) => !phraseFreq.has(normalizeKeyword(c.keyword).canonicalText))
      .slice(0, 15)
      .map((c) => ({
        keyword: c.keyword,
        source: "suggested" as const,
        cluster: c.cluster,
        inTitles: 0,
        inTags: 0,
        competitorCount: 0,
        competitorRatio: "—",
        rationale: `AI expansion based on ${c.cluster.toLowerCase()} search intent.`,
      }));

    const combinedKeywordsList = [...observedKeywords, ...suggestedKeywords];

    // Deduplicate and score keywords
    const seenKw = new Set<string>();
    const scoredKeywords = [];
    const tagCandidates = [];

    for (const item of combinedKeywordsList) {
      const norm = normalizeKeyword(item.keyword);
      if (seenKw.has(norm.canonicalText) || norm.canonicalText.length < 3 || norm.canonicalText.length > 20) {
        continue;
      }
      seenKw.add(norm.canonicalText);

      const relRes = calculateProductRelevance(norm.canonicalText, productContext);
      const intentRes = calculateBuyerIntent(norm.canonicalText);

      const isContradictory = relRes.state === "BLOCKED" || relRes.state === "CONTRADICTORY";

      scoredKeywords.push({
        keyword: norm.displayText,
        canonicalText: norm.canonicalText,
        source: item.source, // "observed" vs "suggested"
        cluster: item.cluster,
        inCompetitorTitles: item.inTitles,
        inCompetitorTags: item.inTags,
        competitorCount: item.competitorCount,
        competitorRatio: item.competitorRatio,
        relevanceScore: relRes.relevanceScore,
        intentType: intentRes.intentType,
        isContradictory,
        rationale: item.rationale,
      });

      tagCandidates.push({
        keyword: norm.displayText,
        cluster: item.cluster,
        opportunityScore: item.source === "observed" ? 85 : 70,
        relevanceScore: relRes.relevanceScore,
        intentScore: intentRes.intentScore,
        demandScore: item.source === "observed" ? 75 : 50,
        intentType: intentRes.intentType,
        isContradictory,
      });
    }

    // 6. Extract Competitor Benchmark Data (Titles, Tags, Prices)
    const competitorPhrases = competitors.map((c) => c.title);
    const competitorTags = Array.from(new Set(competitors.flatMap((c) => c.tags || []))).filter(Boolean);
    const competitorPrices = competitors
      .map((c) => (c.price !== null ? c.price.toFixed(2) : null))
      .filter((p): p is string => Boolean(p));

    // 7. Category-Tailored Media Strategy
    const categoryMediaPlan = getCategoryMediaPlan(confirmedCategory || confirmedNoun);

    // 8. Call Grounded Groq AI Copywriter with Competitor Benchmarks
    const aiIntelligence = await generateGroqListingIntelligence({
      mainBroadPhrase: rawQuery,
      productNoun: confirmedNoun,
      category: confirmedCategory,
      materials: confirmedMaterials,
      recipient: userFacts.targetAudience,
      dimensions: userFacts.dimensions
        ? `${userFacts.dimensions.length || ""}x${userFacts.dimensions.width || ""}x${userFacts.dimensions.height || ""} ${userFacts.dimensions.unit}`
        : undefined,
      personalizationDetails: userFacts.personalization?.isOffered
        ? userFacts.personalization.instructions || "Personalized upon request"
        : undefined,
      competitorPhrases,
      competitorTags,
      competitorPrices,
      careInstructions: confirmedCare,
      forbiddenClaims: userFacts.forbiddenClaims,
      isDigital: userFacts.productType === "digital",
      userApiKey: data.groqApiKey,
    });

    // 9. Prioritize & Inject High-Converting Groq AI Tags into Candidate Pool
    if (aiIntelligence?.optimizedTags13 && aiIntelligence.optimizedTags13.length > 0) {
      for (const rawTag of aiIntelligence.optimizedTags13) {
        const val = validateEtsyTag(rawTag);
        if (val.isValid) {
          const norm = normalizeKeyword(rawTag);
          if (!tagCandidates.some((c) => c.keyword.toLowerCase() === norm.displayText.toLowerCase())) {
            tagCandidates.unshift({
              keyword: norm.displayText,
              cluster: "ai_differentiator",
              opportunityScore: 99,
              relevanceScore: 98,
              intentScore: 96,
              demandScore: 94,
              intentType: "TRANSACTIONAL",
              isContradictory: false,
            });
          }
        }
      }
    }

    // 10. 13-Tag Optimization (<= 20 chars, diverse clusters)
    const tagResult = optimizeEtsyTags(tagCandidates, 13);

    // 11. Deterministic Base Title
    const baseTitle = generateCompliantTitle({
      productNoun: confirmedNoun,
      primaryMaterial: confirmedMaterials ? confirmedMaterials.split(/[,/]/)[0].trim() : undefined,
      personalizationType: userFacts.personalization?.isOffered ? "Custom" : undefined,
      recipient: userFacts.targetAudience,
    });
    const titleValidation = validateEtsyTitle(baseTitle, rawQuery, confirmedNoun);

    const recommendedTitle = aiIntelligence?.titleVariations?.recommended2026 || baseTitle;
    const titleGift = aiIntelligence?.titleVariations?.giftFocused || `Handmade ${confirmedNoun} - Artisan Gift`;
    const titleFeature = aiIntelligence?.titleVariations?.featureFocused || `Artisan ${confirmedNoun} - Handcrafted Design`;

    // 10. Programmatic Whitelist Claim Validation (Zero Hallucination Shield)
    const claimValidation = validateListingClaims(
      {
        productType: userFacts.productType || "physical",
        productNoun: confirmedNoun,
        category: confirmedCategory,
        primaryMaterial: confirmedMaterials,
        personalization: userFacts.personalization,
        dimensions: userFacts.dimensions,
        careInstructions: confirmedCare,
        forbiddenClaims: userFacts.forbiddenClaims,
        confirmedClaims: userFacts.confirmedClaims,
      },
      {
        title: recommendedTitle,
        tags: tagResult.selectedTags.map((t) => t.tag),
        description: aiIntelligence?.deepDescription || "",
      }
    );

    // 11. Final Semantic Check on Generated Title
    let finalTitle = claimValidation.sanitizedTitle || recommendedTitle;
    if (isSemanticContamination(rawQuery, finalTitle, confirmedCategory, confirmedMaterials)) {
      console.warn("Semantic check caught mismatch in finalTitle! Falling back to deterministic base title.");
      finalTitle = baseTitle;
    }

    // 12. Evaluate 12-Point 3-State Listing Readiness Checklist
    const readinessReport = evaluateListingReadiness({
      title: finalTitle,
      leadKeyword: rawQuery,
      tags: claimValidation.sanitizedTags || tagResult.selectedTags.map((t) => t.tag),
      materials: confirmedMaterials,
      primaryColor: userFacts.colors?.[0],
      dimensions: userFacts.dimensions ? "Provided" : undefined,
      careInstructions: confirmedCare,
      targetPrice: userFacts.targetPrice,
      marketMin: priceQuartiles?.marketMin,
      marketMax: priceQuartiles?.marketMax,
      competitorCount: competitors.length,
      photoSlotsCount: categoryMediaPlan.photoSlots.length,
      hasFaqs: (aiIntelligence?.faqs || []).length > 0,
    });

    return NextResponse.json({
      success: true,
      mode,
      mainBroadPhrase: rawQuery,
      productNoun: confirmedNoun,
      category: confirmedCategory,
      competitorsAvailable: competitors.length > 0,
      sampleStats: {
        listingsAnalyzed: competitors.length,
        uniqueShopsCount: new Set(competitors.map((c) => c.shopName)).size,
        updatedAt: new Date().toISOString(),
        hasRealCompetitors: competitors.length > 0,
        competitorSource: competitors.length > 0 ? "Etsy Marketplace Data" : "None Available",
      },
      priceQuartiles,
      competitorsAnalyzed: competitors.map((c, idx) => ({
        index: idx + 1,
        listingId: c.listingId,
        title: c.title,
        price: c.price !== null ? c.price.toFixed(2) : null,
        currency: c.currency,
        shopName: c.shopName,
        url: c.url,
        imageUrl: c.imageUrl,
        images: c.images || (c.imageUrl ? [c.imageUrl] : []),
        description: c.description || "",
        tags: c.tags,
      })),
      sharedCorePhrases: sortedSharedPhrases.slice(0, 10),
      title: {
        text: finalTitle,
        characterCount: finalTitle.length,
        wordCount: finalTitle.split(/\s+/).filter(Boolean).length,
        validation: titleValidation,
        variations: {
          recommended2026: {
            text: finalTitle,
            style: "Recommended (Search Focused)",
          },
          giftFocused: {
            text: titleGift,
            style: "Occasion & Gifting Focused",
          },
          featureFocused: {
            text: titleFeature,
            style: "Material & Craft Focused",
          },
        },
      },
      tags: {
        list: claimValidation.sanitizedTags || tagResult.selectedTags.map((t) => t.tag),
        details: tagResult.selectedTags,
        count: (claimValidation.sanitizedTags || tagResult.selectedTags).length,
        uniqueClusters: tagResult.uniqueClustersCovered,
      },
      description: {
        openingParagraph: aiIntelligence?.openingHook || `Handcrafted with precision, this ${rawQuery} is designed for enduring quality.`,
        fullDescription: claimValidation.sanitizedDescription || aiIntelligence?.deepDescription || "",
        careInstructions: confirmedCare,
      },
      faqs: aiIntelligence?.faqs || [],
      photoStrategy: categoryMediaPlan.photoSlots,
      videoStrategy: categoryMediaPlan.videoStrategy,
      readinessReport,
      claimValidation,
      topKeywords: scoredKeywords.filter((k) => !k.isContradictory),
      avoidKeywords: scoredKeywords.filter((k) => k.isContradictory || k.relevanceScore < 40).slice(0, 6),
      competitiveSummary: aiIntelligence?.competitiveSummary || "",
      isAiEnhanced: Boolean(aiIntelligence?.isAiGenerated),
    });
  } catch (err: any) {
    console.error("Quick optimize error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
