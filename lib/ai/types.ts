import { z } from "zod";

export const CandidateGenerationSchema = z.object({
  candidates: z.array(
    z.object({
      keyword: z.string(),
      cluster: z.string(),
      dimension: z.enum([
        "PRODUCT_TERMS",
        "MATERIAL_TERMS",
        "PERSONALIZATION_TERMS",
        "RECIPIENT_TERMS",
        "OCCASION_TERMS",
        "STYLE_TERMS",
        "FEATURE_TERMS",
        "USE_CASE_TERMS",
        "COLOR_TERMS",
      ]),
      rationale: z.string(),
    })
  ),
});

export type CandidateGenerationOutput = z.infer<typeof CandidateGenerationSchema>;

export const ExplanationSchema = z.object({
  summary: z.string(),
  relevanceExplanation: z.string(),
  competitionExplanation: z.string(),
  recommendationAction: z.enum(["TARGET_PRIMARY", "USE_IN_TAGS", "SECONDARY_TARGET", "MONITOR", "AVOID"]),
  warnings: z.array(z.string()).default([]),
});

export type ExplanationOutput = z.infer<typeof ExplanationSchema>;
