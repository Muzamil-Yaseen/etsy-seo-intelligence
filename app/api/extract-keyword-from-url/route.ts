import { NextResponse } from "next/server";
import { z } from "zod";
import { extractKeywordFromEtsyUrl } from "@/lib/ai/groq-service";

const RequestSchema = z.object({
  url: z.string().min(3, "Please provide a valid Etsy listing URL"),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const data = RequestSchema.parse(json);

    const result = await extractKeywordFromEtsyUrl(data.url);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error("Failed to extract keyword from URL:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to extract keyword from listing URL",
      },
      { status: 400 }
    );
  }
}
