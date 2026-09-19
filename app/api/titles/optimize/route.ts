import { NextResponse } from "next/server";
import { validateEtsyTitle, generateCompliantTitle } from "@/lib/optimizers/title-optimizer";
import { z } from "zod";

const TitleOptimizeSchema = z.object({
  titleToValidate: z.string().optional(),
  primaryKeyword: z.string().optional(),
  productNoun: z.string().optional(),
  generateInput: z
    .object({
      productNoun: z.string(),
      primaryKeyword: z.string().optional(),
      primaryMaterial: z.string().optional(),
      personalizationType: z.string().optional(),
      definingFeature: z.string().optional(),
      recipient: z.string().optional(),
      color: z.string().optional(),
    })
    .optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const data = TitleOptimizeSchema.parse(json);

    let generatedTitle: string | undefined = undefined;
    if (data.generateInput) {
      generatedTitle = generateCompliantTitle(data.generateInput);
    }

    const titleToCheck = data.titleToValidate || generatedTitle || "";
    const validation = validateEtsyTitle(
      titleToCheck,
      data.primaryKeyword || data.generateInput?.primaryKeyword,
      data.productNoun || data.generateInput?.productNoun
    );

    return NextResponse.json({
      success: true,
      generatedTitle,
      validation,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
