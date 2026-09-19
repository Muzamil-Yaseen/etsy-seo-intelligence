import { NextResponse } from "next/server";
import { generateOptimizedDescription } from "@/lib/optimizers/description-optimizer";
import { z } from "zod";

const DescriptionOptimizeSchema = z.object({
  productName: z.string(),
  category: z.string(),
  materials: z.string().optional(),
  features: z.string().optional(),
  personalization: z.string().optional(),
  dimensions: z.string().optional(),
  careInstructions: z.string().optional(),
  primaryKeyword: z.string().optional(),
  supportingKeywords: z.array(z.string()).optional(),
  shippingNotes: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const input = DescriptionOptimizeSchema.parse(json);

    const result = generateOptimizedDescription(input);
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
