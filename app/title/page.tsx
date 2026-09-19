import { db, initializeDatabase } from "@/lib/db";
import { projects, products } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { TitleOptimizerView } from "./title-optimizer-view";
import { seedDatabase } from "@/lib/db/seed";

export const dynamic = "force-dynamic";

export default async function TitleOptimizerPage() {
  await initializeDatabase();

  let proj = (await db.select().from(projects).limit(1))[0];
  if (!proj) {
    await seedDatabase();
    proj = (await db.select().from(projects).limit(1))[0];
  }

  const prods = await db.select().from(products).where(eq(products.projectId, proj.id));
  const product = prods[0];

  const defaultStuffedTitle = product?.currentTitle || "Personalized Leather Wallet Men, Custom Engraved Wallet for Husband, Mens Bifold Wallet Gift, Anniversary Gift for Him";

  return (
    <TitleOptimizerView
      initialTitle={defaultStuffedTitle}
      productContext={{
        name: product ? product.name : "Personalized Leather Wallet",
        category: product ? product.category : "Wallets",
        materials: product?.materials,
        features: product?.features,
        personalization: product?.personalization,
        recipient: product?.recipient,
      }}
    />
  );
}
