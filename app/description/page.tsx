import { db, initializeDatabase } from "@/lib/db";
import { projects, products } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { DescriptionOptimizerView } from "./description-optimizer-view";
import { seedDatabase } from "@/lib/db/seed";

export const dynamic = "force-dynamic";

export default async function DescriptionOptimizerPage() {
  await initializeDatabase();

  let proj = (await db.select().from(projects).limit(1))[0];
  if (!proj) {
    await seedDatabase();
    proj = (await db.select().from(projects).limit(1))[0];
  }

  const prods = await db.select().from(products).where(eq(products.projectId, proj.id));
  const product = prods[0];

  return (
    <DescriptionOptimizerView
      productContext={{
        name: product ? product.name : "Personalized Full Grain Leather Bifold Wallet",
        category: product ? product.category : "Wallets",
        materials: product?.materials,
        features: product?.features,
        personalization: product?.personalization,
        currentDescription: product?.currentDescription,
      }}
    />
  );
}
