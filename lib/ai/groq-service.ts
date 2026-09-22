import { getCategoryMediaPlan } from "../media/category-media-plan";

export interface GroqListingInput {
  mainBroadPhrase: string;
  productNoun: string;
  category: string;
  materials: string;
  recipient?: string;
  dimensions?: string;
  personalizationDetails?: string;
  competitorPhrases: string[];
  competitorTags?: string[];
  competitorPrices?: string[];
  careInstructions?: string;
  forbiddenClaims?: string[];
  isDigital?: boolean;
  userApiKey?: string;
}

export interface GroqListingOutput {
  titleVariations: {
    recommended2026: string;
    giftFocused: string;
    featureFocused: string;
  };
  optimizedTags13: string[];
  deepDescription: string;
  openingHook: string;
  faqs: Array<{ question: string; answer: string }>;
  photoStrategy: Array<{ slot: number; title: string; guidance: string }>;
  competitiveSummary?: string;
  isAiGenerated: boolean;
}

/**
 * Calls Groq AI to generate deep, high-converting listing reasoning grounded strictly in confirmed ProductFacts and competitor benchmarking.
 */
export async function generateGroqListingIntelligence(
  input: GroqListingInput
): Promise<GroqListingOutput | null> {
  const apiKey = input.userApiKey?.trim() || process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const categoryPlan = getCategoryMediaPlan(input.category || input.productNoun);

  try {
    const competitorSection = [
      input.competitorPhrases?.length
        ? `- Top Competitor Listing Titles:\n${input.competitorPhrases.slice(0, 5).map((t, i) => `  ${i + 1}. ${t}`).join("\n")}`
        : "",
      input.competitorTags?.length
        ? `- Observed Competitor Keyword Tags (${input.competitorTags.length} keywords):\n  ${input.competitorTags.slice(0, 30).join(", ")}`
        : "",
      input.competitorPrices?.length
        ? `- Competitor Price Benchmark Range: ${input.competitorPrices.slice(0, 5).map(p => `$${p}`).join(", ")}`
        : "",
    ].filter(Boolean).join("\n");

    const prompt = `You are a world-class Etsy SEO algorithm and conversion copywriting expert.
Generate the ultimate high-converting, highly SEO-optimized Etsy listing that outranks and outperforms these benchmarked competitors:

--- CONFIRMED PRODUCT FACTS (GROUND TRUTH) ---
- Core Search Phrase: ${input.mainBroadPhrase}
- Exact Product Noun: ${input.productNoun}
- Primary Category: ${input.category}
- Confirmed Materials: ${input.materials}
- Delivery Type: ${input.isDigital ? "Digital Download (No physical shipment)" : "Physical Handcrafted Item"}
- Personalization: ${input.personalizationDetails || "Standard artisan craft (no custom engraving)"}
- Target Recipient: ${input.recipient || "Handmade art & craftsmanship enthusiasts"}
- Specific Dimensions: ${input.dimensions || "Not specified by seller"}
- Forbidden Claims: ${(input.forbiddenClaims || []).join(", ") || "None specified"}

--- OBSERVED COMPETITOR BENCHMARK DATA ---
${competitorSection || "- No competitor listings provided (using clean artisan baseline)"}

--- STRICT COMPLIANCE RULES ---
1. NEVER invent unconfirmed materials or certifications. If materials state Ceramic, DO NOT mention leather, wood, or sterling silver.
2. If personalization is NOT offered, NEVER include words like "personalized", "monogrammed", or "custom engraved".
3. If delivery type is Digital, do NOT describe physical shipping packaging; describe digital download compatibility instead.
4. DO NOT use emojis anywhere in titles or descriptions.
5. All 3 title variations MUST be under 140 characters and under 15 words. Lead with front-loaded physical traits and high-volume competitor search phrases.
6. The "optimizedTags13" MUST contain EXACTLY 13 tags. CRITICAL: Every single tag MUST BE under or equal to 20 characters (<= 20 chars). Use multi-word long-tail intent derived from the top competitor keywords.

Return ONLY a valid JSON object matching this exact structure:
{
  "titleVariations": {
    "recommended2026": "Concise front-loaded physical traits under 140 chars",
    "giftFocused": "Occasion or gift recipient focused under 140 chars",
    "featureFocused": "Detailed materials and technique under 140 chars"
  },
  "optimizedTags13": [
    "tag 1 under 20 chars",
    "tag 2 under 20 chars",
    "tag 3 under 20 chars",
    "tag 4 under 20 chars",
    "tag 5 under 20 chars",
    "tag 6 under 20 chars",
    "tag 7 under 20 chars",
    "tag 8 under 20 chars",
    "tag 9 under 20 chars",
    "tag 10 under 20 chars",
    "tag 11 under 20 chars",
    "tag 12 under 20 chars",
    "tag 13 under 20 chars"
  ],
  "openingHook": "1-2 compelling sentences focusing on the confirmed craftsmanship and materials",
  "deepDescription": "Complete, beautifully structured Etsy listing description formatted specifically for Etsy. Use uppercase section headers (e.g. OVERVIEW, SPECIFICATIONS, MATERIALS & BUILD, CARE GUIDELINES, SHIPPING & POLICIES) and clean bullet points (•) with generous line breaks.",
  "faqs": [
    { "question": "Clear buyer question regarding dispatch or material", "answer": "Helpful, reassuring answer" },
    { "question": "Clear buyer question regarding sizing or specs", "answer": "Helpful, reassuring answer" },
    { "question": "Clear buyer question regarding care or maintenance", "answer": "Helpful, reassuring answer" }
  ],
  "competitiveSummary": "1-2 sentences summarizing how this listing combines the best competitor keyword patterns into a higher-converting product listing."
}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 14000);

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        max_tokens: 1800,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are an expert ecommerce analyst and copywriter. You produce concise, accurate, and professional Etsy listing content. Ground all claims strictly in the provided product facts. Never invent materials. Do not use emojis.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn("Groq API response not OK:", res.status, res.statusText);
      return null;
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);

    // Validate and enforce <= 20 chars on Groq tags
    const rawAiTags: string[] = Array.isArray(parsed.optimizedTags13)
      ? parsed.optimizedTags13
      : [];
    const validAiTags = rawAiTags
      .map((t) => (typeof t === "string" ? t.trim().toLowerCase() : ""))
      .filter((t) => t.length >= 2 && t.length <= 20)
      .slice(0, 13);

    return {
      titleVariations: {
        recommended2026:
          parsed.titleVariations?.recommended2026 ||
          `${input.productNoun} Handcrafted in ${input.materials}`.slice(0, 138),
        giftFocused:
          parsed.titleVariations?.giftFocused ||
          `Handmade ${input.productNoun} Gift - Artisan Quality`.slice(0, 138),
        featureFocused:
          parsed.titleVariations?.featureFocused ||
          `Artisan ${input.productNoun} with ${input.materials}`.slice(0, 138),
      },
      optimizedTags13: validAiTags,
      openingHook:
        parsed.openingHook ||
        `Handcrafted with meticulous attention to detail, this ${input.mainBroadPhrase} is made to last.`,
      deepDescription: parsed.deepDescription || "",
      faqs: Array.isArray(parsed.faqs) && parsed.faqs.length > 0 ? parsed.faqs : [
        {
          question: `What materials are used to create this ${input.productNoun}?`,
          answer: `This item is handcrafted from ${input.materials}.`,
        },
        {
          question: "How long does dispatch take?",
          answer: "Orders are handmade and dispatch within 1–2 business days with door-to-door tracking.",
        },
        {
          question: "How should I care for this product?",
          answer: input.careInstructions?.split("\n")[0]?.replace(/^•\s*/, "") || "Gently wipe with a soft cloth and store away from direct sunlight.",
        },
      ],
      photoStrategy: categoryPlan.photoSlots.map((s) => ({
        slot: s.slot,
        title: s.title,
        guidance: s.guidance,
      })),
      competitiveSummary: parsed.competitiveSummary || "Synthesized from live competitor benchmark data for optimal conversion and Etsy search ranking.",
      isAiGenerated: true,
    };
  } catch (err) {
    console.warn("Groq listing intelligence fallback:", err);
    return null;
  }
}

export interface ExtractedUrlKeyword {
  url: string;
  listingId: string | null;
  mainKeyword: string;
  productNoun: string;
  secondaryKeywords: string[];
  category: string;
}

/**
 * Extracts the primary keyword and product noun from an Etsy listing URL.
 * NEVER invents a fake price!
 */
export async function extractKeywordFromEtsyUrl(rawUrl: string): Promise<ExtractedUrlKeyword> {
  const trimmed = rawUrl.trim();
  let listingId: string | null = null;
  let rawSlug = "";

  const match = trimmed.match(/listing\/(\d+)(?:\/([^/?#]+))?/i);
  if (match) {
    listingId = match[1];
    if (match[2]) {
      rawSlug = match[2]
        .replace(/-/g, " ")
        .replace(/[^a-zA-Z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    }
  } else {
    rawSlug = trimmed.replace(/-/g, " ").replace(/[^a-zA-Z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (apiKey && rawSlug) {
    try {
      const prompt = `Analyze this Etsy listing URL slug:
"${rawSlug}" (Original URL: "${trimmed}")

Extract:
1. "mainKeyword": The primary search keyword a buyer searches on Etsy (e.g. "Personalized Leather Wallet") in Title Case.
2. "productNoun": The physical item noun (e.g. "Leather Wallet", "Ceramic Mug", "Silver Necklace") in Title Case.
3. "secondaryKeywords": Array of 3-4 specific keyword variants found in the slug.
4. "category": The primary Etsy category path (e.g. "Bags & Purses > Wallets").

Return ONLY valid JSON:
{
  "mainKeyword": "string",
  "productNoun": "string",
  "secondaryKeywords": ["string"],
  "category": "string"
}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          max_tokens: 400,
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages: [{ role: "user", content: prompt }],
        }),
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          return {
            url: trimmed,
            listingId,
            mainKeyword:
              parsed.mainKeyword ||
              rawSlug
                .split(" ")
                .slice(0, 3)
                .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" "),
            productNoun: parsed.productNoun || "Handmade Item",
            secondaryKeywords: Array.isArray(parsed.secondaryKeywords) ? parsed.secondaryKeywords : [],
            category: parsed.category || "Handmade Products",
          };
        }
      }
    } catch {
      // Fall through to deterministic parsing
    }
  }

  // Deterministic fallback from slug
  const words = rawSlug.split(" ").filter((w) => w.length > 2);
  const mainKw =
    words
      .slice(0, 3)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ") || "Handcrafted Product";
  const noun =
    words.length > 1
      ? words
          .slice(-2)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ")
      : mainKw;

  return {
    url: trimmed,
    listingId,
    mainKeyword: mainKw,
    productNoun: noun,
    secondaryKeywords: words.slice(0, 4),
    category: "Handmade Products",
  };
}

/**
 * Attempts to retrieve verified price for an individual Etsy listing URL.
 * Returns 'Not available' if API key is not configured or listing not found.
 * Never invents a fake price!
 */
export async function fetchPriceForEtsyUrl(url: string): Promise<string> {
  const match = url.match(/listing\/(\d+)/i);
  const apiKey = process.env.ETSY_API_KEY;

  if (match && apiKey) {
    try {
      const sharedSecret = process.env.ETSY_SHARED_SECRET || "";
      const headerKey = sharedSecret ? `${apiKey}:${sharedSecret}` : apiKey;
      const res = await fetch(`https://openapi.etsy.com/v3/application/listings/${match[1]}`, {
        headers: { "x-api-key": headerKey, Accept: "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.price?.amount) {
          const amt = data.price.amount / (data.price.divisor || 100);
          return amt.toFixed(2);
        }
      }
    } catch {
      // Fall through to not available
    }
  }

  return "Not available";
}
