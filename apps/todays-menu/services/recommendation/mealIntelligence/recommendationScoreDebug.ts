import type { MealMode, MealType } from '../../../types/home';
import type { MealScoreFactor } from '../../../types/mealIntelligenceEngine';
import type { AiRecommendationSettings } from '../../../types/aiRecommendationSettings';
import type { RecipeStandardMetadata } from '../../../data/recipes/recipeStandardMetadataTypes';

const DEBUG_PREFIX = '[HANKKI scores]';

export type RecommendationScoreDebugEntry = {
  menuId: string;
  title: string;
  score: number;
  baseScore: number;
  factors: Partial<Record<MealScoreFactor, number>>;
  notes: string[];
  excluded: boolean;
  exclusionReasons: string[];
  metadataHits: Array<{ key: string; points: number; label: string }>;
  selectedReason: string | null;
  usedSettings?: Partial<AiRecommendationSettings>;
  usedMetadata?: Partial<RecipeStandardMetadata> | null;
};

export type RecommendationScoreDebug = {
  timestamp: string;
  mealType: MealType;
  mealMode: MealMode;
  entries: RecommendationScoreDebugEntry[];
  selectedMenuId: string;
  pickPoolMenuIds: string[];
};

let lastScoreDebug: RecommendationScoreDebug | null = null;

export function storeRecommendationScoreDebug(debug: RecommendationScoreDebug): void {
  lastScoreDebug = debug;
  if (!__DEV__) return;

  console.log(DEBUG_PREFIX, {
    mealType: debug.mealType,
    mealMode: debug.mealMode,
    selected: debug.selectedMenuId,
    pickPool: debug.pickPoolMenuIds,
    topScores: debug.entries.slice(0, 8).map((entry) => ({
      title: entry.title,
      score: entry.score,
      excluded: entry.excluded,
      metadataHits: entry.metadataHits,
      selectedReason: entry.selectedReason,
      notes: entry.notes.filter((note) => note.startsWith('smart_') || note.startsWith('metadata_')),
    })),
  });
}

export function getLastRecommendationScoreDebug(): RecommendationScoreDebug | null {
  return lastScoreDebug;
}

export function getRecommendationScoreDebugForMenu(menuId: string): RecommendationScoreDebugEntry | null {
  return lastScoreDebug?.entries.find((entry) => entry.menuId === menuId) ?? null;
}
