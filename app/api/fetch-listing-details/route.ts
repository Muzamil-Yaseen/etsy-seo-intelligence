import { NextResponse } from "next/server";
import { z } from "zod";
import { providerRegistry } from "@/lib/providers/registry";

const RequestSchema = z.object({
  url: z.string().optional(),
  listingId: z.union([z.string(), z.number()]).optional(),
  urls: z.array(z.string()).optional(),
  apiKey: z.string().optional(),
});

function parseEtsyListingInfo(rawUrl: string): { listingId: string | null; slugTitle: string } {
  if (!rawUrl) return { listingId: null, slugTitle: "" };

  const cleanUrl = rawUrl.trim();
  const idMatch = cleanUrl.match(/listing\/(\d+)/i) || cleanUrl.match(/^(\d+)$/);
  const listingId = idMatch ? idMatch[1] : null;

  let slugTitle = "";
  const slugMatch = cleanUrl.match(/listing\/\d+\/([^/?#]+)/i);
  if (slugMatch && slugMatch[1]) {
    slugTitle = slugMatch[1]
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ")
      .trim();
  }

  return { listingId, slugTitle };
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const data = RequestSchema.parse(json);

    const clientApiKey =
      request.headers.get("x-etsy-api-key") ||
      data.apiKey?.trim() ||
      process.env.ETSY_API_KEY ||
      "";

    // Handle batch fetch
    if (data.urls && Array.isArray(data.urls) && data.urls.length > 0) {
      const results = await Promise.all(
        data.urls.map(async (u) => {
          if (!u || !u.trim()) return null;
          const { listingId, slugTitle } = parseEtsyListingInfo(u);
          if (!listingId) {
            return {
              url: u,
              listingId: null,
              title: slugTitle || "Etsy Listing",
              price: "",
              images: [],
              tags: [],
              source: "url_parsed",
            };
          }

          if (clientApiKey) {
            const apiDetails = await providerRegistry.etsyOpenApi.getListingDetails(
              listingId,
              clientApiKey
            );
            if (apiDetails.status === "configured") {
              return {
                url: apiDetails.url,
                listingId: apiDetails.listingId,
                title: apiDetails.title || slugTitle,
                description: apiDetails.description,
                price: apiDetails.price?.formatted || "",
                currency: apiDetails.price?.currencyCode || "USD",
                shopName: apiDetails.shopName,
                images: apiDetails.images,
                imageUrl: apiDetails.imageUrl,
                tags: apiDetails.tags,
                source: "etsy_api",
              };
            }
          }

          return {
            url: u.startsWith("http") ? u : `https://www.etsy.com/listing/${listingId}`,
            listingId,
            title: slugTitle || `Etsy Listing #${listingId}`,
            price: "",
            currency: "USD",
            images: [],
            imageUrl: undefined,
            tags: [],
            source: "url_parsed",
          };
        })
      );

      return NextResponse.json({
        success: true,
        listings: results.filter(Boolean),
      });
    }

    // Single listing fetch
    const rawTarget = data.url || (data.listingId ? String(data.listingId) : "");
    if (!rawTarget) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid Etsy listing URL or ID." },
        { status: 400 }
      );
    }

    const { listingId, slugTitle } = parseEtsyListingInfo(rawTarget);
    const targetId = listingId || (data.listingId ? String(data.listingId) : null);

    if (!targetId) {
      return NextResponse.json(
        { success: false, error: "Could not find a valid Etsy listing ID in URL." },
        { status: 400 }
      );
    }

    // Try official Etsy API if API key is provided
    if (clientApiKey) {
      const apiResult = await providerRegistry.etsyOpenApi.getListingDetails(
        targetId,
        clientApiKey
      );

      if (apiResult.status === "configured") {
        return NextResponse.json({
          success: true,
          status: "configured",
          apiConfigured: true,
          listing: {
            listingId: apiResult.listingId,
            title: apiResult.title || slugTitle || `Etsy Listing #${targetId}`,
            description: apiResult.description || "",
            price: apiResult.price?.formatted || "",
            priceAmount: apiResult.price?.amount || null,
            currency: apiResult.price?.currencyCode || "USD",
            shopName: apiResult.shopName || "Etsy Artisan",
            shopId: apiResult.shopId,
            url: apiResult.url,
            images: apiResult.images,
            imageUrl: apiResult.imageUrl || (apiResult.images[0]?.fullUrl ?? undefined),
            tags: apiResult.tags,
            materials: apiResult.materials,
            views: apiResult.views,
            numFavorers: apiResult.numFavorers,
            source: "etsy_api",
            fetchedAt: new Date().toISOString(),
          },
        });
      }

      if (apiResult.status === "rate_limited") {
        return NextResponse.json(
          {
            success: false,
            status: "rate_limited",
            error: "Etsy API rate limit reached.",
            message: apiResult.message,
          },
          { status: 429 }
        );
      }
    }

    // Fallback if no API key or API call failed: return parsed slug & clean status
    return NextResponse.json({
      success: true,
      status: "url_parsed",
      apiConfigured: !!clientApiKey,
      listing: {
        listingId: targetId,
        title: slugTitle || `Etsy Listing #${targetId}`,
        description: "",
        price: "",
        currency: "USD",
        shopName: `Etsy Shop #${targetId.slice(0, 5)}`,
        url: rawTarget.startsWith("http")
          ? rawTarget
          : `https://www.etsy.com/listing/${targetId}`,
        images: [],
        imageUrl: undefined,
        tags: [],
        materials: [],
        source: "url_parsed",
        message: clientApiKey
          ? "Listing retrieved via URL parser (API returned no data)."
          : "Connect Etsy API key to automatically retrieve all high-res photos and tags, or paste image URL directly.",
      },
    });
  } catch (err: any) {
    console.error("fetch-listing-details error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch listing details" },
      { status: 400 }
    );
  }
}
