import { NextResponse } from "next/server";
import { z } from "zod";
import { fetchPriceForEtsyUrl } from "@/lib/ai/groq-service";

const RequestSchema = z.object({
  url: z.string().optional(),
  urls: z.array(z.string()).optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const data = RequestSchema.parse(json);

    if (data.urls && Array.isArray(data.urls) && data.urls.length > 0) {
      const results = await Promise.all(
        data.urls.map(async (u) => {
          if (!u || !u.trim()) return { url: u, price: "" };
          const price = await fetchPriceForEtsyUrl(u);
          return { url: u, price };
        })
      );
      return NextResponse.json({
        success: true,
        prices: results,
      });
    }

    if (data.url && data.url.trim()) {
      const price = await fetchPriceForEtsyUrl(data.url);
      return NextResponse.json({
        success: true,
        url: data.url,
        price,
      });
    }

    return NextResponse.json(
      { success: false, error: "Please provide url or urls array." },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("Failed to fetch price:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch price" },
      { status: 400 }
    );
  }
}
