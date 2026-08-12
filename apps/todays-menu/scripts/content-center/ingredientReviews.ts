/**
 * Ingredient Library cards for Content Center.
 * Listing is read-only; approve is a separate explicit action.
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  ING1_TEST_KEYS,
  PATHS as INGREDIENT_PATHS,
} from '../ingredient-factory/config';
import { loadIngredientQueue } from '../ingredient-factory/buildQueue';
import { runIngredientApprove } from '../ingredient-factory/runApprove';
import {
  resolveIngredientIconAbsolute,
  resolveIngredientReviewAbsolute,
} from './readiness';
import { listIngredientKeysAwaitingApproval } from './productionProgress';

export type IngredientReviewCard = {
  iconKey: string;
  koreanName: string;
  status: 'review' | 'exists' | 'missing';
  previewUrl: string | null;
  reviewRelative: string | null;
  productionRelative: string;
  usedByRecipeIds: string[];
};

export function listIngredientReviewCards(options?: {
  keys?: string[];
  /** When true, include full queue + all on-disk review PNGs (Ingredient Library). */
  all?: boolean;
}): IngredientReviewCard[] {
  const queue = loadIngredientQueue();
  const byKey = new Map(
    (queue?.items ?? []).map((i) => [i.iconKey, i] as const),
  );

  const reviewFiles = fs.existsSync(INGREDIENT_PATHS.reviewDir)
    ? fs
        .readdirSync(INGREDIENT_PATHS.reviewDir)
        .filter((f) => f.endsWith('.png'))
        .map((f) => path.basename(f, '.png'))
    : [];

  let preferred: string[];
  if (options?.keys?.length) {
    preferred = options.keys;
  } else if (options?.all) {
    preferred = [
      ...new Set([...(queue?.items.map((i) => i.iconKey) ?? []), ...reviewFiles]),
    ].sort((a, b) => a.localeCompare(b));
  } else {
    preferred = [...ING1_TEST_KEYS];
  }

  const keys = options?.all
    ? preferred
    : [...new Set([...preferred, ...reviewFiles])].sort((a, b) => {
        const ai = preferred.indexOf(a);
        const bi = preferred.indexOf(b);
        if (ai >= 0 && bi >= 0) return ai - bi;
        if (ai >= 0) return -1;
        if (bi >= 0) return 1;
        return a.localeCompare(b);
      });

  return keys.map((iconKey) => {
    const item = byKey.get(iconKey);
    const prod = resolveIngredientIconAbsolute(iconKey);
    const review = resolveIngredientReviewAbsolute(iconKey);
    let status: IngredientReviewCard['status'] = 'missing';
    let previewUrl: string | null = null;
    if (prod) {
      status = 'exists';
      previewUrl = `/api/ingredient-icon/${encodeURIComponent(iconKey)}`;
    } else if (review) {
      status = 'review';
      previewUrl = `/api/ingredient-review/${encodeURIComponent(iconKey)}`;
    }

    return {
      iconKey,
      koreanName: item?.koreanName ?? iconKey,
      status,
      previewUrl,
      reviewRelative: review
        ? `generated/ingredient-factory/review/${iconKey}.png`
        : null,
      productionRelative: `assets/ingredients/${iconKey}.png`,
      usedByRecipeIds: item?.usedByRecipeIds ?? [],
    };
  });
}

/** Approve every ingredient icon that has a review file and is awaiting production. */
export function approveAllReviewedIngredients(): {
  ok: boolean;
  message: string;
  keys: string[];
  promoted: string[];
  failed: string[];
} {
  const keys = listIngredientKeysAwaitingApproval();
  if (keys.length === 0) {
    return {
      ok: true,
      message: 'No reviewed ingredient icons awaiting approval',
      keys: [],
      promoted: [],
      failed: [],
    };
  }

  const promoted: string[] = [];
  const failed: string[] = [];

  for (const iconKey of keys) {
    try {
      const result = runIngredientApprove({
        decision: 'approve',
        iconKey,
        force: true,
      });
      if (result.promoted.includes(iconKey)) {
        promoted.push(iconKey);
      } else {
        failed.push(iconKey);
      }
    } catch {
      failed.push(iconKey);
    }
  }

  return {
    ok: failed.length === 0,
    message: `Approved ${promoted.length}/${keys.length} ingredient icons → assets/ingredients/`,
    keys,
    promoted,
    failed,
  };
}
