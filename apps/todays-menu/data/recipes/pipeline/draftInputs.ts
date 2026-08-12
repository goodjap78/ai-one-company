/**
 * Sprint RF-6 — Scaffolded factory inputs for Batches 06–10 (051–100).
 *
 * Does NOT import hankkiRecipes (avoids circular deps when production wires batches).
 */
import type { HankkiRecipeInput } from '../recipeMasterTemplate';
import { PIPELINE_DRAFT_SPECS } from './draftSpecsPart1';
import { PIPELINE_DRAFT_SPECS_PART2 } from './draftSpecsPart2';
import { scaffoldRecipeBatch } from './scaffoldRecipe';
import type { RecipeSpec } from './types';

/** Draft specs Batches 06–10 only (051–100). */
export const ALL_DRAFT_SPECS: RecipeSpec[] = [
  ...PIPELINE_DRAFT_SPECS,
  ...PIPELINE_DRAFT_SPECS_PART2,
].filter((spec) => Number.parseInt(spec.id, 10) >= 51);

/** Factory inputs for Batches 06–10 — use createHankkiRecipeBatch to materialize. */
export const PIPELINE_DRAFT_INPUTS: HankkiRecipeInput[] =
  scaffoldRecipeBatch(ALL_DRAFT_SPECS);
