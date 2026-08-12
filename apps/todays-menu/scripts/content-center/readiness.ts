/**
 * Sprint CONTENT-CENTER-1 — recipe readiness + ingredient icon status.
 * Disk inspection only — does not modify recipe data or generate icons.
 */
import fs from 'node:fs';
import path from 'node:path';
import { APP_ROOT } from '../image-factory/config';
import { productionAssetPath } from '../image-factory/promoteVerify';
import {
  loadDashboardState,
  type DashboardReviewStatus,
} from '../image-factory/review-dashboard/dashboardState';
import {
  archiveCurrentCandidateIfNeeded,
  listVersions,
} from '../image-factory/review-dashboard/historyStore';
import { resolveCandidatePath } from '../image-factory/reviewStore';
import {
  buildImageQueue,
  loadImageQueue,
} from '../image-factory/buildImageQueue';
import { inspectImageFile } from '../image-factory/engine';
import { HANKKI_HERO_STYLE_VERSION } from '../image-factory/engine/buildHeroPrompt';
import { validateHankkiRecipe } from '../../data/recipes/validateHankkiProduction';
import { listHankkiRecipes, getHankkiRecipeById } from '../../data/recipes/hankkiRecipes';
import type { Recipe } from '../../data/recipes/types';
import {
  fallbackKeyForCategory,
  inferIngredientIconCategory,
} from '../../data/ingredients/ingredientAliases';

export type ContentListStatus = 'ready' | 'review_needed' | 'missing_assets';

export type IngredientIconStatus =
  | 'exists'
  | 'review'
  | 'missing'
  | 'fallback';

export type IngredientRow = {
  name: string;
  iconKey: string;
  group: string;
  status: IngredientIconStatus;
  previewUrl: string | null;
  resolvedNote: string;
};

export type HeroPanel = {
  heroImageKey: string;
  previewUrl: string | null;
  currentVersion: number | null;
  generationDate: string | null;
  resolution: string | null;
  status: DashboardReviewStatus | 'missing';
  productionExists: boolean;
  productionPath: string;
  versions: Array<{
    version: number;
    filename: string;
    createdAt: string;
    url: string;
  }>;
  promptVersion: string;
};

export type ContentRecipeSummary = {
  recipeId: string;
  recipeName: string;
  listStatus: ContentListStatus;
  heroImageKey: string;
  ingredientCount: number;
  reviewStatus: DashboardReviewStatus | 'missing';
  recipeDataValid: boolean;
  heroApproved: boolean;
  ingredientsOk: boolean;
  missingIngredientIcons: number;
};

export type ContentRecipeDetail = ContentRecipeSummary & {
  readinessStatus: ContentListStatus;
  hero: HeroPanel;
  ingredients: IngredientRow[];
  validationIssues: string[];
};

export type ContentSummary = {
  totalRecipes: number;
  readyRecipes: number;
  reviewNeeded: number;
  missingHeroImages: number;
  missingIngredientIcons: number;
  promptVersion: string;
};

const INGREDIENTS_DIR = path.join(APP_ROOT, 'assets/ingredients');
const INGREDIENT_REVIEW_DIR = path.join(
  APP_ROOT,
  'generated/ingredient-factory/review',
);

function ingredientPngPath(iconKey: string): string {
  return path.join(INGREDIENTS_DIR, `${iconKey}.png`);
}

function ingredientReviewPngPath(iconKey: string): string {
  return path.join(INGREDIENT_REVIEW_DIR, `${iconKey}.png`);
}

function iconFileExists(iconKey: string): boolean {
  return Boolean(iconKey) && fs.existsSync(ingredientPngPath(iconKey));
}

function reviewIconExists(iconKey: string): boolean {
  return Boolean(iconKey) && fs.existsSync(ingredientReviewPngPath(iconKey));
}

/**
 * exists  — production PNG under assets/ingredients/
 * review  — candidate in generated/ingredient-factory/review/ (not yet approved)
 * fallback — category/generic / soft UI fallback
 * missing  — no iconKey and cannot infer a fallback category
 */
export function inspectIngredientRow(ingredient: {
  name: string;
  iconKey: string;
  group: string;
}): IngredientRow {
  const iconKey = (ingredient.iconKey || '').trim();
  const category = inferIngredientIconCategory(ingredient.name || iconKey);
  const categoryFallback = fallbackKeyForCategory(category);

  if (iconKey && iconFileExists(iconKey)) {
    return {
      name: ingredient.name,
      iconKey,
      group: ingredient.group,
      status: 'exists',
      previewUrl: `/api/ingredient-icon/${encodeURIComponent(iconKey)}`,
      resolvedNote: 'production asset on disk',
    };
  }

  if (iconKey && reviewIconExists(iconKey)) {
    return {
      name: ingredient.name,
      iconKey,
      group: ingredient.group,
      status: 'review',
      previewUrl: `/api/ingredient-review/${encodeURIComponent(iconKey)}`,
      resolvedNote: 'awaiting approval in ingredient review folder',
    };
  }

  if (iconFileExists(categoryFallback)) {
    return {
      name: ingredient.name,
      iconKey: iconKey || categoryFallback,
      group: ingredient.group,
      status: 'fallback',
      previewUrl: `/api/ingredient-icon/${encodeURIComponent(categoryFallback)}`,
      resolvedNote: `category fallback: ${categoryFallback}`,
    };
  }

  if (iconFileExists('fallback_generic')) {
    return {
      name: ingredient.name,
      iconKey: iconKey || 'fallback_generic',
      group: ingredient.group,
      status: 'fallback',
      previewUrl: '/api/ingredient-icon/fallback_generic',
      resolvedNote: 'generic fallback asset',
    };
  }

  // Soft UI fallback is always safe when we have a category (app never shows broken img).
  if (iconKey || ingredient.name) {
    return {
      name: ingredient.name,
      iconKey: iconKey || categoryFallback,
      group: ingredient.group,
      status: 'fallback',
      previewUrl: null,
      resolvedNote: 'safe UI soft-fallback (no PNG registered yet)',
    };
  }

  return {
    name: ingredient.name,
    iconKey: '',
    group: ingredient.group,
    status: 'missing',
    previewUrl: null,
    resolvedNote: 'no iconKey / name to resolve',
  };
}

function recipeDataValid(recipe: Recipe): { ok: boolean; issues: string[] } {
  const issues = validateHankkiRecipe(recipe);
  return {
    ok: issues.length === 0,
    issues: issues.map((i) => `${i.code}: ${i.message}`),
  };
}

function heroReviewStatus(
  recipeId: string,
  heroImageKey: string,
): DashboardReviewStatus | 'missing' {
  const state = loadDashboardState().recipes[recipeId];
  if (state?.reviewStatus) return state.reviewStatus;

  const queue = loadImageQueue() ?? buildImageQueue();
  const item = queue.items.find((i) => i.recipeId === recipeId);
  if (item?.status === 'approved') return 'approved';
  if (item?.status === 'rejected') return 'rejected';

  const productionOk = fs.existsSync(productionAssetPath(heroImageKey));
  if (productionOk && item?.status !== 'completed') {
    // Production present from prior work; treat as approved if no pending review override
    const candidate = resolveCandidatePath(recipeId, heroImageKey);
    if (!fs.existsSync(candidate)) return 'approved';
  }

  archiveCurrentCandidateIfNeeded(recipeId, heroImageKey);
  const versions = listVersions(recipeId, heroImageKey);
  if (versions.length > 0 || fs.existsSync(resolveCandidatePath(recipeId, heroImageKey))) {
    return 'pending_review';
  }

  if (productionOk) return 'approved';
  return 'missing';
}

function computeListStatus(input: {
  recipeValid: boolean;
  heroApproved: boolean;
  ingredientsOk: boolean;
  reviewStatus: DashboardReviewStatus | 'missing';
  hasReviewCandidate: boolean;
}): ContentListStatus {
  if (input.recipeValid && input.heroApproved && input.ingredientsOk) {
    return 'ready';
  }
  // Rejected images stay on disk but are excluded from the approval queue.
  if (input.reviewStatus === 'pending_review') {
    return 'review_needed';
  }
  if (
    input.hasReviewCandidate &&
    input.reviewStatus !== 'approved' &&
    input.reviewStatus !== 'rejected'
  ) {
    return 'review_needed';
  }
  return 'missing_assets';
}

function buildHeroPanel(recipe: Recipe): HeroPanel {
  const recipeId = recipe.id;
  const heroImageKey = recipe.heroImageKey;
  archiveCurrentCandidateIfNeeded(recipeId, heroImageKey);
  const versions = listVersions(recipeId, heroImageKey);
  const state = loadDashboardState().recipes[recipeId];
  const status = heroReviewStatus(recipeId, heroImageKey);
  const selectedVersion =
    state?.selectedVersion ??
    (versions.length > 0 ? versions[versions.length - 1].version : null);

  let previewAbs: string | null = null;
  if (selectedVersion != null) {
    const v = versions.find((x) => x.version === selectedVersion);
    if (v) previewAbs = v.absolutePath;
  }
  if (!previewAbs) {
    const candidate = resolveCandidatePath(recipeId, heroImageKey);
    if (fs.existsSync(candidate)) previewAbs = candidate;
  }

  let resolution: string | null = null;
  let generationDate: string | null = null;
  if (previewAbs && fs.existsSync(previewAbs)) {
    const check = inspectImageFile(previewAbs, {});
    if (check.width && check.height) {
      resolution = `${check.width}×${check.height}`;
    }
    generationDate = fs.statSync(previewAbs).mtime.toISOString();
  }

  const productionPath = `assets/meals/${heroImageKey}.jpg`;

  return {
    heroImageKey,
    previewUrl:
      selectedVersion != null
        ? `/api/history/${recipeId}/${selectedVersion}`
        : previewAbs
          ? `/api/candidate/${recipeId}`
          : null,
    currentVersion: selectedVersion,
    generationDate,
    resolution,
    status,
    productionExists: fs.existsSync(productionAssetPath(heroImageKey)),
    productionPath,
    versions: versions.map((v) => ({
      version: v.version,
      filename: v.filename,
      createdAt: v.createdAt,
      url: `/api/history/${recipeId}/${v.version}`,
    })),
    promptVersion: HANKKI_HERO_STYLE_VERSION,
  };
}

export function buildRecipeSummary(recipe: Recipe): ContentRecipeSummary {
  const validation = recipeDataValid(recipe);
  const ingredients = recipe.ingredients.map(inspectIngredientRow);
  const missingIngredientIcons = ingredients.filter(
    (i) => i.status === 'missing',
  ).length;
  const ingredientsOk = missingIngredientIcons === 0;
  const reviewStatus = heroReviewStatus(recipe.id, recipe.heroImageKey);
  const heroApproved =
    reviewStatus === 'approved' &&
    fs.existsSync(productionAssetPath(recipe.heroImageKey));
  const hasReviewCandidate =
    listVersions(recipe.id, recipe.heroImageKey).length > 0 ||
    fs.existsSync(resolveCandidatePath(recipe.id, recipe.heroImageKey));

  const listStatus = computeListStatus({
    recipeValid: validation.ok,
    heroApproved,
    ingredientsOk,
    reviewStatus,
    hasReviewCandidate,
  });

  return {
    recipeId: recipe.id,
    recipeName: recipe.name,
    listStatus,
    heroImageKey: recipe.heroImageKey,
    ingredientCount: recipe.ingredients.length,
    reviewStatus,
    recipeDataValid: validation.ok,
    heroApproved,
    ingredientsOk,
    missingIngredientIcons,
  };
}

export function listContentRecipes(filter?: ContentListStatus | 'all'): {
  summary: ContentSummary;
  recipes: ContentRecipeSummary[];
} {
  const all = listHankkiRecipes().map(buildRecipeSummary);
  const recipes =
    !filter || filter === 'all'
      ? all
      : all.filter((r) => r.listStatus === filter);

  const missingHeroImages = all.filter((r) => {
    const prod = fs.existsSync(productionAssetPath(r.heroImageKey));
    const review =
      listVersions(r.recipeId, r.heroImageKey).length > 0 ||
      fs.existsSync(resolveCandidatePath(r.recipeId, r.heroImageKey));
    return !prod && !review;
  }).length;

  const missingIngredientIcons = all.reduce(
    (n, r) => n + r.missingIngredientIcons,
    0,
  );

  return {
    summary: {
      totalRecipes: all.length,
      readyRecipes: all.filter((r) => r.listStatus === 'ready').length,
      reviewNeeded: all.filter((r) => r.listStatus === 'review_needed').length,
      missingHeroImages,
      missingIngredientIcons,
      promptVersion: HANKKI_HERO_STYLE_VERSION,
    },
    recipes,
  };
}

export function getContentRecipeDetail(
  recipeId: string,
): ContentRecipeDetail | null {
  const recipe = getHankkiRecipeById(recipeId);
  if (!recipe) return null;
  const summary = buildRecipeSummary(recipe);
  const validation = recipeDataValid(recipe);
  const ingredients = recipe.ingredients.map(inspectIngredientRow);
  const hero = buildHeroPanel(recipe);

  return {
    ...summary,
    readinessStatus: summary.listStatus,
    hero,
    ingredients,
    validationIssues: validation.issues,
  };
}

export function resolveIngredientIconAbsolute(iconKey: string): string | null {
  const safe = iconKey.replace(/[^a-z0-9_]/gi, '');
  if (!safe) return null;
  const abs = ingredientPngPath(safe);
  return fs.existsSync(abs) ? abs : null;
}

export function resolveIngredientReviewAbsolute(iconKey: string): string | null {
  const safe = iconKey.replace(/[^a-z0-9_]/gi, '');
  if (!safe) return null;
  const abs = ingredientReviewPngPath(safe);
  return fs.existsSync(abs) ? abs : null;
}
