/**
 * Circuit breaker: Detects semantic mismatch between search query and product facts/output.
 * Checks query against product noun, category, materials, and notes to prevent cross-product state leakage.
 */
export function isSemanticContamination(
  query: string,
  productNoun?: string,
  category?: string,
  materials?: string
): boolean {
  const q = query.toLowerCase();
  const n = (productNoun || "").toLowerCase();
  const c = (category || "").toLowerCase();
  const m = (materials || "").toLowerCase();
  const allFacts = `${n} ${c} ${m}`;

  if (!allFacts.trim()) return false;

  const isQueryCeramic = q.includes("ceramic") || q.includes("pottery") || q.includes("bowl") || q.includes("mug") || q.includes("matcha") || q.includes("cup") || q.includes("plate") || q.includes("stoneware");
  const isQueryWallet = q.includes("wallet") || q.includes("bifold") || q.includes("cardholder") || q.includes("card holder") || q.includes("money clip") || q.includes("purse") || q.includes("tote") || q.includes("handbag") || q.includes("leather");
  const isQueryJewelry = q.includes("necklace") || q.includes("ring") || q.includes("pendant") || q.includes("bracelet") || q.includes("earring") || q.includes("jewelry") || q.includes("silver") || q.includes("gold");
  const isQueryWood = q.includes("cutting board") || q.includes("charcuterie") || q.includes("chopping block") || q.includes("serving tray") || q.includes("walnut cutting");
  const isQueryDigital = q.includes("digital") || q.includes("download") || q.includes("printable") || q.includes("planner") || q.includes("template") || q.includes("goodnotes");
  const isQueryPet = q.includes("dog") || q.includes("cat") || q.includes("pet") || q.includes("collar") || q.includes("leash");

  const factsMentionLeatherOrWallet = allFacts.includes("wallet") || allFacts.includes("bifold") || allFacts.includes("leather bifold") || allFacts.includes("money clip") || allFacts.includes("wallets & money clips") || allFacts.includes("card holder") || allFacts.includes("cardholder");
  const factsMentionCeramic = allFacts.includes("ceramic") || allFacts.includes("pottery") || allFacts.includes("matcha") || allFacts.includes("stoneware") || allFacts.includes("drinkware") || allFacts.includes("bowl") || allFacts.includes("mug");
  const factsMentionJewelry = allFacts.includes("necklace") || allFacts.includes("pendant") || allFacts.includes("ring") || allFacts.includes("earring") || allFacts.includes("jewelry");
  const factsMentionWood = allFacts.includes("cutting board") || allFacts.includes("charcuterie") || allFacts.includes("chopping block");
  const factsMentionDigital = allFacts.includes("digital download") || allFacts.includes("goodnotes") || allFacts.includes("printable") || allFacts.includes("calendars & planners");

  if (isQueryCeramic && (factsMentionLeatherOrWallet || factsMentionJewelry || factsMentionWood || factsMentionDigital)) return true;
  if (isQueryWallet && (factsMentionCeramic || factsMentionJewelry || factsMentionWood || factsMentionDigital)) return true;
  if (isQueryJewelry && (factsMentionCeramic || factsMentionLeatherOrWallet || factsMentionWood || factsMentionDigital)) return true;
  if (isQueryWood && (factsMentionCeramic || factsMentionLeatherOrWallet || factsMentionJewelry || factsMentionDigital)) return true;
  if (isQueryDigital && (factsMentionCeramic || factsMentionLeatherOrWallet || factsMentionJewelry || factsMentionWood)) return true;
  if (isQueryPet && (factsMentionCeramic || factsMentionLeatherOrWallet || factsMentionJewelry || factsMentionDigital)) return true;

  return false;
}
