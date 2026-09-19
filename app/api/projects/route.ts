import { NextResponse } from "next/server";
import { db, initializeDatabase } from "@/lib/db";
import { projects, products, workspaces, users, projectKeywords } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

const CreateProjectSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  targetMarket: z.string().default("US"),
  language: z.string().default("en"),
  product: z.object({
    name: z.string().min(2),
    description: z.string().min(5),
    category: z.string().min(2),
    materials: z.string().optional(),
    colors: z.string().optional(),
    sizes: z.string().optional(),
    styles: z.string().optional(),
    features: z.string().optional(),
    personalization: z.string().optional(),
    recipient: z.string().optional(),
    occasion: z.string().optional(),
    useCases: z.string().optional(),
    price: z.number().or(z.string()).optional(),
    currency: z.string().default("USD"),
    currentTitle: z.string().optional(),
    currentTags: z.array(z.string()).optional(),
    currentDescription: z.string().optional(),
  }),
});

export async function GET() {
  await initializeDatabase();

  const allProjects = await db.select().from(projects);

  const enriched = await Promise.all(
    allProjects.map(async (p: any) => {
      const prods = await db.select().from(products).where(eq(products.projectId, p.id));
      const kwCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(projectKeywords)
        .where(eq(projectKeywords.projectId, p.id));

      return {
        ...p,
        products: prods,
        keywordCount: Number(kwCount[0]?.count || 0),
      };
    })
  );

  return NextResponse.json({ projects: enriched });
}

export async function POST(request: Request) {
  await initializeDatabase();

  try {
    const json = await request.json();
    const data = CreateProjectSchema.parse(json);

    // Get or create default workspace
    let ws = (await db.select().from(workspaces).limit(1))[0];
    if (!ws) {
      ws = {
        id: "ws_default",
        name: "Craft & Timber Studio",
        slug: "craft-and-timber",
        ownerId: "usr_default",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await db.insert(workspaces).values(ws).onConflictDoNothing();
      await db.insert(users).values({
        id: "usr_default",
        email: "seller@etsyseo.com",
        name: "Etsy Seller",
        role: "owner",
      }).onConflictDoNothing();
    }

    const projectId = `proj_${Date.now()}`;
    await db.insert(projects).values({
      id: projectId,
      workspaceId: ws.id,
      name: data.name,
      description: data.description,
      targetMarket: data.targetMarket,
      language: data.language,
    });

    const productId = `prod_${Date.now()}`;
    await db.insert(products).values({
      id: productId,
      projectId,
      name: data.product.name,
      description: data.product.description,
      category: data.product.category,
      materials: data.product.materials,
      colors: data.product.colors,
      sizes: data.product.sizes,
      styles: data.product.styles,
      features: data.product.features,
      personalization: data.product.personalization,
      recipient: data.product.recipient,
      occasion: data.product.occasion,
      useCases: data.product.useCases,
      price: data.product.price ? data.product.price.toString() : null,
      currency: data.product.currency,
      currentTitle: data.product.currentTitle,
      currentTags: data.product.currentTags ? JSON.stringify(data.product.currentTags) : null,
      currentDescription: data.product.currentDescription,
    });

    return NextResponse.json({ success: true, projectId, productId });
  } catch (err: any) {
    console.error("Create project error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
