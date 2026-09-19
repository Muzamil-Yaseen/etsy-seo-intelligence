import { NextResponse } from "next/server";
import { optimizeEtsyTags, CandidateTag } from "@/lib/optimizers/tag-optimizer";
import { z } from "zod";

const TagOptimizeSchema = z.object({
  candidates: z.array(
    z.object({
      keyword: z.string(),
      cluster: z.string(),
      opportunityScore: z.number(),
      relevanceScore: z.number(),
      intentScore: z.number(),
      demandScore: z.number().nullable().optional(),
      intentType: z.string(),
      isContradictory: z.boolean().optional(),
    })
  ),
  maxTags: z.number().default(13),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { candidates, maxTags } = TagOptimizeSchema.parse(json);

    const result = optimizeEtsyTags(candidates, maxTags);
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
