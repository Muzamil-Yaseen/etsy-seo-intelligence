import { normalizeKeyword, detectKeywordRelationship } from "../normalization/normalizer";

export interface CandidateTag {
  keyword: string;
  cluster: string;
  opportunityScore: number;
  relevanceScore: number;
  intentScore: number;
  demandScore?: number | null;
  intentType: string;
  isContradictory?: boolean;
}

export interface SelectedTag {
  tag: string;
  characterCount: number;
  cluster: string;
  marginalValue: number;
  baseValue: number;
  reason: string;
}

export interface TagOptimizationResult {
  selectedTags: SelectedTag[];
  tagCount: number;
  maxAllowed: number;
  totalOpportunityCovered: number;
  uniqueClustersCovered: string[];
  rejectedCandidates: Array<{ tag: string; reason: string }>;
}

export const ETSY_MAX_TAGS = 13;
export const ETSY_MAX_TAG_CHARS = 20;

/**
 * Validates whether a tag candidate complies with Etsy's strict rules:
 * - Max 20 characters
 * - Valid alphanumeric and spaces
 * - Not contradictory or blocked
 */
export function validateEtsyTag(tag: string): { isValid: boolean; reason?: string } {
  const normalized = normalizeKeyword(tag).canonicalText;
  if (!normalized) {
    return { isValid: false, reason: "Tag is empty" };
  }
  if (normalized.length > ETSY_MAX_TAG_CHARS) {
    return { isValid: false, reason: `Exceeds 20 characters (${normalized.length}/20)` };
  }
  // Etsy allowed characters in tags: letters, numbers, spaces, hyphens
  if (!/^[a-z0-9 -]+$/.test(normalized)) {
    return { isValid: false, reason: "Contains unsupported characters for Etsy tags" };
  }
  return { isValid: true };
}

/**
 * Optimizes a set of candidate keywords into an Etsy-compliant 13-tag set using
 * constrained greedy marginal utility selection.
 */
export function optimizeEtsyTags(
  candidates: CandidateTag[],
  maxTags: number = ETSY_MAX_TAGS
): TagOptimizationResult {
  const rejectedCandidates: Array<{ tag: string; reason: string }> = [];
  const validCandidates: CandidateTag[] = [];

  for (const c of candidates) {
    if (c.isContradictory) {
      rejectedCandidates.push({ tag: c.keyword, reason: "Blocked: contradicts product specifications" });
      continue;
    }
    const validation = validateEtsyTag(c.keyword);
    if (!validation.isValid) {
      rejectedCandidates.push({ tag: c.keyword, reason: validation.reason! });
      continue;
    }
    validCandidates.push({
      ...c,
      keyword: normalizeKeyword(c.keyword).canonicalText,
    });
  }

  // Deduplicate exact normalized strings
  const uniqueCandidatesMap = new Map<string, CandidateTag>();
  for (const c of validCandidates) {
    if (!uniqueCandidatesMap.has(c.keyword)) {
      uniqueCandidatesMap.set(c.keyword, c);
    }
  }
  const pool = Array.from(uniqueCandidatesMap.values());

  const selected: SelectedTag[] = [];
  const coveredClusters = new Set<string>();
  const coveredIntents = new Set<string>();

  while (selected.length < maxTags && pool.length > 0) {
    let bestIndex = -1;
    let bestMarginalValue = -Infinity;
    let bestBaseValue = 0;
    let bestReason = "";

    for (let i = 0; i < pool.length; i++) {
      const candidate = pool[i];

      // Base Tag Value:
      // 0.45 * Opportunity + 0.25 * Relevance + 0.15 * Intent + 0.15 * Demand
      const demand = candidate.demandScore ?? 40;
      const baseValue = (
        0.45 * candidate.opportunityScore +
        0.25 * candidate.relevanceScore +
        0.15 * candidate.intentScore +
        0.15 * demand
      );

      // Diversity Bonuses
      const clusterBonus = !coveredClusters.has(candidate.cluster) ? 15 : -5;
      const intentBonus = !coveredIntents.has(candidate.intentType) ? 10 : 0;

      // Redundancy Penalties based on already selected tags
      let redundancyPenalty = 0;
      for (const sel of selected) {
        const rel = detectKeywordRelationship(candidate.keyword, sel.tag);
        if (rel.relationType === "EXACT_DUPLICATE") {
          redundancyPenalty += 100;
        } else if (rel.relationType === "PLURAL_VARIANT" || rel.relationType === "WORD_ORDER_VARIANT") {
          redundancyPenalty += 50;
        } else if (rel.similarityScore > 0.6) {
          redundancyPenalty += rel.similarityScore * 25;
        }
      }

      const marginalValue = baseValue + clusterBonus + intentBonus - redundancyPenalty;

      if (marginalValue > bestMarginalValue) {
        bestMarginalValue = marginalValue;
        bestBaseValue = baseValue;
        bestIndex = i;
        bestReason = `Provides strong coverage for cluster '${candidate.cluster}' with ${Math.round(candidate.opportunityScore)} Opportunity score.`;
      }
    }

    if (bestIndex === -1 || bestMarginalValue < 0) {
      break; // No remaining beneficial candidates
    }

    const chosen = pool.splice(bestIndex, 1)[0];
    selected.push({
      tag: chosen.keyword,
      characterCount: chosen.keyword.length,
      cluster: chosen.cluster,
      marginalValue: Math.round(bestMarginalValue * 10) / 10,
      baseValue: Math.round(bestBaseValue * 10) / 10,
      reason: bestReason,
    });

    coveredClusters.add(chosen.cluster);
    coveredIntents.add(chosen.intentType);
  }

  const totalOpportunity = selected.reduce((sum, s) => {
    const orig = candidates.find(c => normalizeKeyword(c.keyword).canonicalText === s.tag);
    return sum + (orig ? orig.opportunityScore : 0);
  }, 0);

  return {
    selectedTags: selected,
    tagCount: selected.length,
    maxAllowed: maxTags,
    totalOpportunityCovered: Math.round(totalOpportunity),
    uniqueClustersCovered: Array.from(coveredClusters),
    rejectedCandidates,
  };
}
