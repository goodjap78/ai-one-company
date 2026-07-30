import type { MetadataScoreHit } from '../../../types/mealIntelligenceEngine';
import { pickPrimaryMetadataReason } from './aiRecommendationMetadataScoring';

/** Stable primary personalization line from metadata score hits. */
export function buildMetadataPersonalizationReason(
  hits: MetadataScoreHit[],
  menuId: string,
): string | null {
  const primary = pickPrimaryMetadataReason(hits, menuId);
  return primary?.label ?? null;
}
