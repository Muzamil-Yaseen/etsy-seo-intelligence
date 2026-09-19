import { NextResponse } from "next/server";
import { auditListing } from "@/lib/analyzers/listing-analyzer";
import { z } from "zod";

const ListingAnalyzeSchema = z.object({
  title: z.string().min(1),
  tags: z.array(z.string()).default([]),
  description: z.string().default(""),
  category: z.string().optional(),
  materials: z.array(z.string()).optional(),
  price: z.number().optional(),
  targetKeywords: z.array(z.string()).optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const input = ListingAnalyzeSchema.parse(json);

    const audit = auditListing(input);
    return NextResponse.json({ success: true, audit });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
