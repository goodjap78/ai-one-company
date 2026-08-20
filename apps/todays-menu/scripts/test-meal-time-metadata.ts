/**
 * Sprint 57 — Meal-time metadata foundation QA.
 * Run: npm run test:meal-time-metadata
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { HANKKI_RECIPES } from '../data/recipes/hankkiRecipes';
import {
  buildRecipeMealTimeMetadataMap,
  deriveMealTimeFitForRecipe,
  listRecipeMealTimeMetadata,
  resetRecipeMealTimeMetadataCache,
} from '../data/recommendation/recipeMealTimeMetadata';
import { deriveMealTimeFit } from '../services/recommendation/mealTime/deriveMealTimeFit';
import { writeMealTimeAuditArtifacts } from '../services/recommendation/mealTime/buildMealTimeAudit';
import { buildMealTimePoolSummary } from '../services/recommendation/mealTime/computeMealTimePools';
import { buildMealTimeCacheKey } from '../services/recommendation/mealTime/mealTimeCachePolicy';
import { resolveMealTimeWeights } from '../services/recommendation/mealTime/mealTimeTransitionPolicy';
import { MEAL_TIME_SLOT_KEYS } from '../types/mealTimeRecommendation';

const appRoot = path.join(__dirname, '..');
let failed = 0;

function assert(cond: boolean, msg: string): void {
  if (!cond) {
    failed += 1;
    console.error(`❌ ${msg}`);
  } else {
    console.log(`✅ ${msg}`);
  }
}

function sha256Json(obj: unknown): string {
  return crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex');
}

console.log('Sprint 57 meal-time metadata QA — start\n');

assert(HANKKI_RECIPES.length === 304, `HANKKI_RECIPES count 304 (got ${HANKKI_RECIPES.length})`);

resetRecipeMealTimeMetadataCache();
const map = buildRecipeMealTimeMetadataMap();
assert(map.size === 304, `metadata map 304 (got ${map.size})`);

const entries = listRecipeMealTimeMetadata();
const ids = new Set<string>();
for (const e of entries) {
  assert(!ids.has(e.recipeId), `duplicate recipeId: ${e.recipeId}`);
  ids.add(e.recipeId);

  for (const slot of MEAL_TIME_SLOT_KEYS) {
    const score = e.fit[slot];
    assert(!Number.isNaN(score), `NaN score ${e.recipeId}:${slot}`);
    assert(score >= 0 && score <= 1, `score range ${e.recipeId}:${slot}=${score}`);
  }
  assert(e.primaryMealTime != null, `primaryMealTime ${e.recipeId}`);
  assert(MEAL_TIME_SLOT_KEYS.includes(e.primaryMealTime), `valid primary ${e.recipeId}`);
}

const sample = HANKKI_RECIPES[0];
const run1 = deriveMealTimeFit(sample);
const run2 = deriveMealTimeFit(sample);
assert(
  sha256Json(run1.fit) === sha256Json(run2.fit),
  'deterministic: same recipe → same fit',
);

const viaSidecar = deriveMealTimeFitForRecipe(sample);
assert(
  sha256Json(viaSidecar.fit) === sha256Json(run1.fit),
  'sidecar derive matches direct derive',
);

const { auditPath, summaryPath, recipeCount } = writeMealTimeAuditArtifacts(appRoot);
assert(fs.existsSync(auditPath), 'meal-time-audit.json created');
assert(fs.existsSync(summaryPath), 'meal-time-summary.json created');
assert(recipeCount === 304, 'audit recipe count 304');

const audit = JSON.parse(fs.readFileSync(auditPath, 'utf8')) as unknown[];
assert(audit.length === 304, `audit rows 304 (got ${audit.length})`);

const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8')) as {
  poolSummary: Array<{ slot: string; counts: Record<string, number>; gap070: number }>;
};
assert(summary.poolSummary.length === 4, 'pool summary 4 slots');

const poolSummary = buildMealTimePoolSummary(entries);
for (const row of poolSummary) {
  console.log(
    `   pool ${row.slot} ≥0.7=${row.counts[0.7]} ≥0.5=${row.counts[0.5]} ≥0.3=${row.counts[0.3]} gap070=${row.gap070}`,
  );
}

assert(buildMealTimeCacheKey('2026-08-09', 'breakfast') === '2026-08-09:breakfast', 'cache key format');
const weights = resolveMealTimeWeights(new Date('2026-08-09T10:30:00'));
assert(weights.breakfast === 0.45 && weights.lunch === 0.52, '10:30 transition weights');

// Recipe source integrity — batch file hash unchanged check via re-read count only
assert(HANKKI_RECIPES.every((r) => r.name.length > 0), 'recipe names intact');

console.log('\nSprint 57 meal-time metadata QA — done (' + failed + ' failed)');
if (failed > 0) process.exit(1);
