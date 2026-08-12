/**
 * Sprint CONTENT-2 — scale batch runner.
 * Phase 1: next 20 heroes (011–030) → review only
 * Phase 2: next 20 ingredient icons → review only
 * Never auto-approves. Resumable via --resume / existing skip rules.
 */
import {
  archiveHeroReviewsInRange,
  getScaleProgress,
  recordBatchTiming,
} from '../scaleProgress';
import { runHeroGenerate } from '../../image-factory/runGenerate';
import {
  collectIngredientManifest,
  writeIngredientManifest,
} from '../../ingredient-factory/collectIngredients';
import { writeAllIngredientPrompts } from '../../ingredient-factory/buildPrompts';
import {
  buildIngredientQueue,
  loadIngredientQueue,
  writeIngredientQueue,
} from '../../ingredient-factory/buildQueue';
import { runIngredientGenerate } from '../../ingredient-factory/runGenerate';
import { writeIngredientReviewHtml } from '../../ingredient-factory/writeReviewHtml';
import { HANKKI_HERO_STYLE_VERSION } from '../../image-factory/engine/buildHeroPrompt';
import { HANKKI_INGREDIENT_ICON_STYLE_VERSION } from '../../ingredient-factory/buildPrompts';

const HERO_FROM = '011';
const HERO_TO = '030';
const INGREDIENT_BATCH = 20;

async function phaseHeroes(): Promise<void> {
  console.log(`\n===== CONTENT-2 Phase 1: Heroes ${HERO_FROM}–${HERO_TO} =====`);
  console.log(`Style: HANKKI Hero Image Style ${HANKKI_HERO_STYLE_VERSION}`);
  console.log('Review only · no auto-approve\n');

  const started = Date.now();
  const result = await runHeroGenerate({
    fromId: HERO_FROM,
    toId: HERO_TO,
    force: true, // write review even if category production placeholder exists
    resume: true,
    skipReviewHtml: false,
  });
  const elapsed = (Date.now() - started) / 1000;
  recordBatchTiming({
    lane: 'hero',
    count: Math.max(1, result.written),
    elapsedSeconds: elapsed,
  });

  const archived = archiveHeroReviewsInRange(HERO_FROM, HERO_TO);
  console.log(`\nWritten: ${result.written} · failed: ${result.failed}`);
  console.log(`History archived/seeded: ${archived}`);
  console.log(`Elapsed: ${elapsed.toFixed(1)}s`);
}

async function phaseIngredients(): Promise<void> {
  console.log(`\n===== CONTENT-2 Phase 2: Next ${INGREDIENT_BATCH} Ingredient Icons =====`);
  console.log(
    `Style: HANKKI Ingredient Icon Style ${HANKKI_INGREDIENT_ICON_STYLE_VERSION}`,
  );
  console.log('Review only · no auto-approve\n');

  // Refresh queue across recipes 001–050 for enough unique keys
  const manifest = collectIngredientManifest('001', '050');
  writeIngredientManifest(manifest);
  writeAllIngredientPrompts(manifest.items);
  const queue = buildIngredientQueue(
    manifest,
    process.env.IMAGE_PROVIDER ?? 'gemini',
    { missingOnly: true },
  );
  writeIngredientQueue(queue);

  const fresh = loadIngredientQueue() ?? queue;
  const pending = fresh.items.filter(
    (i) =>
      i.status === 'queued' ||
      i.status === 'missing' ||
      i.status === 'failed' ||
      i.status === 'processing',
  );
  const keys = pending.slice(0, INGREDIENT_BATCH).map((i) => i.iconKey);
  console.log(`Keys (${keys.length}): ${keys.join(', ')}`);

  if (keys.length === 0) {
    console.log('No pending ingredient keys.');
    return;
  }

  const started = Date.now();
  const result = await runIngredientGenerate({
    keys,
    force: true,
    resume: true,
    missingOnly: false,
  });
  const elapsed = (Date.now() - started) / 1000;
  recordBatchTiming({
    lane: 'ingredient',
    count: Math.max(1, result.written),
    elapsedSeconds: elapsed,
  });

  const q2 = loadIngredientQueue();
  if (q2) writeIngredientReviewHtml(q2);

  console.log(`\nWritten: ${result.written} · failed: ${result.failed}`);
  console.log(`Elapsed: ${elapsed.toFixed(1)}s`);
}

async function main(): Promise<void> {
  console.log('\n========== CONTENT-2 Scale HANKKI Assets ==========');
  console.log('Before:', JSON.stringify(getScaleProgress(), null, 2));

  const only = process.argv.find((a) => a.startsWith('--only='))?.split('=')[1];
  if (!only || only === 'heroes' || only === 'hero') {
    await phaseHeroes();
  }
  if (!only || only === 'ingredients' || only === 'ingredient') {
    await phaseIngredients();
  }

  console.log('\nAfter:', JSON.stringify(getScaleProgress(), null, 2));
  console.log('==================================================\n');
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
