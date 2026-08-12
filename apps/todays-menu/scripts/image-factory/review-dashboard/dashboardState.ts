/**
 * Sprint REVIEW-1 — dashboard state (scores, review status, version pointers).
 * Stored at generated/image-factory/review/dashboard-state.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { PATHS } from '../config';
import { HANKKI_HERO_STYLE_VERSION } from '../engine/buildHeroPrompt';

export type DashboardReviewStatus =
  | 'pending_review'
  | 'approved'
  | 'rejected';

export type RecipeDashboardState = {
  recipeId: string;
  /** Manual QA status for the dashboard queue */
  reviewStatus: DashboardReviewStatus;
  /** 1–5 stars (optional) */
  starScore?: number;
  /** 0–100 (optional) */
  pointScore?: number;
  /** History version currently selected for preview / approve */
  selectedVersion?: number;
  /** Version that was last approved to production */
  approvedVersion?: number;
  notes?: string;
  updatedAt: string;
};

export type DashboardStateFile = {
  version: 1;
  promptVersion: string;
  estimatedCostUsdPerImage: number;
  recipes: Record<string, RecipeDashboardState>;
  updatedAt: string;
};

export const STATE_PATH = path.join(PATHS.reviewDir, 'dashboard-state.json');

const DEFAULT_COST = 0.04;

export function loadDashboardState(): DashboardStateFile {
  if (!fs.existsSync(STATE_PATH)) {
    return {
      version: 1,
      promptVersion: HANKKI_HERO_STYLE_VERSION,
      estimatedCostUsdPerImage: DEFAULT_COST,
      recipes: {},
      updatedAt: new Date().toISOString(),
    };
  }
  try {
    const raw = JSON.parse(
      fs.readFileSync(STATE_PATH, 'utf8'),
    ) as DashboardStateFile;
    return {
      ...raw,
      promptVersion: raw.promptVersion || HANKKI_HERO_STYLE_VERSION,
      estimatedCostUsdPerImage: raw.estimatedCostUsdPerImage ?? DEFAULT_COST,
      recipes: raw.recipes ?? {},
    };
  } catch {
    return {
      version: 1,
      promptVersion: HANKKI_HERO_STYLE_VERSION,
      estimatedCostUsdPerImage: DEFAULT_COST,
      recipes: {},
      updatedAt: new Date().toISOString(),
    };
  }
}

export function saveDashboardState(state: DashboardStateFile): void {
  fs.mkdirSync(PATHS.reviewDir, { recursive: true });
  state.updatedAt = new Date().toISOString();
  state.promptVersion = HANKKI_HERO_STYLE_VERSION;
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), 'utf8');
}

export function upsertRecipeState(
  recipeId: string,
  patch: Partial<RecipeDashboardState>,
): RecipeDashboardState {
  const state = loadDashboardState();
  const prev = state.recipes[recipeId] ?? {
    recipeId,
    reviewStatus: 'pending_review' as const,
    updatedAt: new Date().toISOString(),
  };
  const next: RecipeDashboardState = {
    ...prev,
    ...patch,
    recipeId,
    updatedAt: new Date().toISOString(),
  };
  state.recipes[recipeId] = next;
  saveDashboardState(state);
  return next;
}
