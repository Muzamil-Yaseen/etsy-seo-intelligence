import { NextResponse } from "next/server";
import { z } from "zod";
import { providerRegistry } from "@/lib/providers/registry";

const RequestSchema = z.object({
  keyword: z.string().min(2, "Please enter a valid product keyword or phrase"),
  limit: z.number().optional().default(25),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const data = RequestSchema.parse(json);

    // Query official Etsy Open API v3
    const result = await providerRegistry.etsyOpenApi.searchActiveCompetitors(
      data.keyword,
      data.limit
    );

    if (result.status === "unconfigured") {
      return NextResponse.json({
        success: false,
        status: "unconfigured",
        error: "Etsy API key is not configured in this environment.",
        message:
          "Marketplace data temporarily unavailable. Connect your Etsy API key in environment variables, or enter real competitor URLs manually.",
      });
    }

    if (result.status === "rate_limited") {
      return NextResponse.json(
        {
          success: false,
          status: "rate_limited",
          error: "Etsy API rate limit reached.",
          message: result.message || "Etsy API rate limit reached. Please wait a moment before trying again.",
        },
        { status: 429 }
      );
    }

    if (result.status === "error" || result.listings.length === 0) {
      return NextResponse.json({
        success: false,
        status: "error",
        error: result.message || "No active listings found for this search term.",
        message:
          result.message ||
          "Marketplace data temporarily unavailable. Please verify your keyword or enter competitor URLs manually.",
      });
    }

    return NextResponse.json({
      success: true,
      status: "success",
      data: {
        keyword: data.keyword,
        totalCount: result.totalListingsCount,
        listingsAnalyzed: result.listingsAnalyzed,
        uniqueShopsCount: result.uniqueShopsCount,
        fetchedAt: result.fetchedAt,
        isCached: result.isCached,
        competitors: result.listings.map((l, idx) => ({
          rank: idx + 1,
          listingId: l.listingId,
          title: l.title,
          url: l.url,
          price: l.price.amount > 0 ? l.price.amount.toFixed(2) : "0.00",
          currency: l.price.currencyCode,
          shopName: l.shopName || "Etsy Artisan",
          imageUrl: l.imageUrl,
          tags: l.tags,
          materials: l.materials,
          source: l.source,
          confidence: l.confidence,
        })),
      },
    });
  } catch (err: any) {
    console.error("Failed to query Etsy competitors:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to search competitor listings",
      },
      { status: 400 }
    );
  }
}
