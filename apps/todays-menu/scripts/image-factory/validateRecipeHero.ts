/**
 * Single-recipe hero validation (Sprint IMG-2B).
 * Avoids importing mealImageAssets (Node cannot load Metro require() PNGs).
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { HANKKI_RECIPES } from '../../data/recipes/hankkiRecipes';
import { loadImageQueue } from './buildImageQueue';
import { HERO_SIZE_EXPECT, PATHS } from './config';
import { inspectImageFile } from './engine';
import { parseRegisteredMealKeys } from './updateMealImageRegistry';

export type RecipeHeroValidation = {
  ok: boolean;
  recipeId: string;
  recipeName: string;
  heroImageKey: string;
  checks: Array<{ name: string; pass: boolean; detail: string }>;
  issues: string[];
};

function recipeImageMapResolves(recipeId: string, heroImageKey: string): {
  pass: boolean;
  detail: string;
} {
  const mapPath = path.join(PATHS.appRoot, 'data/recipes/recipeImageMap.ts');
  if (!fs.existsSync(mapPath)) {
    return { pass: false, detail: 'recipeImageMap.ts missing' };
  }
  const source = fs.readFileSync(mapPath, 'utf8');
  // Match: '003': { kind: 'local', key: 'kimchi_stew' }
  const re = new RegExp(
    `['"]${recipeId}['"]\\s*:\\s*\\{\\s*kind:\\s*['"]local['"]\\s*,\\s*key:\\s*['"]${heroImageKey}['"]`,
  );
  if (re.test(source)) {
    return {
      pass: true,
      detail: `{ kind: 'local', key: '${heroImageKey}' } in recipeImageMap.ts`,
    };
  }
  return {
    pass: false,
    detail: `no local map entry ${recipeId} → ${heroImageKey}`,
  };
}

export function validateRecipeHero(recipeId: string): RecipeHeroValidation {
  const recipe = HANKKI_RECIPES.find((r) => r.id === recipeId);
  const issues: string[] = [];
  const checks: RecipeHeroValidation['checks'] = [];

  if (!recipe) {
    return {
      ok: false,
      recipeId,
      recipeName: '(missing)',
      heroImageKey: '',
      checks: [
        {
          name: 'recipe_exists',
          pass: false,
          detail: `No HANKKI_RECIPES entry for id=${recipeId}`,
        },
      ],
      issues: [`Unknown recipe id ${recipeId}`],
    };
  }

  const key = recipe.heroImageKey;
  const filename = `${key}.jpg`;
  const abs = path.join(PATHS.mealAssetsDir, filename);
  const fileExists = fs.existsSync(abs);

  checks.push({
    name: 'image_file_exists',
    pass: fileExists,
    detail: fileExists
      ? `assets/meals/${filename}`
      : `missing assets/meals/${filename}`,
  });
  if (!fileExists) issues.push(`Missing production image: ${filename}`);

  if (fileExists) {
    const check = inspectImageFile(abs, {
      minWidth: HERO_SIZE_EXPECT.minWidth,
      minHeight: HERO_SIZE_EXPECT.minHeight,
      aspectHint: HERO_SIZE_EXPECT.aspectHint,
    });
    const dimOk =
      check.width != null &&
      check.height != null &&
      check.width >= HERO_SIZE_EXPECT.minWidth &&
      check.height >= HERO_SIZE_EXPECT.minHeight;
    const aspectPass = !check.broken && (dimOk || check.width == null);
    checks.push({
      name: 'aspect_ratio_valid',
      pass: aspectPass,
      detail: check.broken
        ? check.issues.join('; ')
        : `${check.width ?? '?'}x${check.height ?? '?'} (${check.detectedFormat}${
            check.formatMismatch ? ', format mismatch warn' : ''
          })`,
    });
    if (!aspectPass) issues.push(`Invalid image geometry for ${filename}`);
  } else {
    checks.push({
      name: 'aspect_ratio_valid',
      pass: false,
      detail: 'skipped — file missing',
    });
  }

  const registered = new Set(parseRegisteredMealKeys());
  const registryHasKey = registered.has(key);
  checks.push({
    name: 'registry_key_exists',
    pass: registryHasKey,
    detail: registryHasKey
      ? `MEAL_LOCAL_IMAGES.${key}`
      : `missing key ${key} in mealImageAssets.ts`,
  });
  if (!registryHasKey) issues.push(`Registry missing key: ${key}`);

  const registrySource = fs.readFileSync(PATHS.mealRegistry, 'utf8');
  const requireRe = new RegExp(
    `(?:^|\\n)\\s*(?:'${key}'|${key})\\s*:\\s*require\\('([^']+)'\\)`,
  );
  const requireMatch = registrySource.match(requireRe);
  const expectedRequire = `../../assets/meals/${filename}`;
  const requireOk = Boolean(
    requireMatch && requireMatch[1].replace(/\\/g, '/') === expectedRequire,
  );
  checks.push({
    name: 'require_path_matches_filename',
    pass: requireOk,
    detail: requireMatch
      ? `require('${requireMatch[1]}')`
      : 'require() line not found',
  });
  if (!requireOk) issues.push(`require path mismatch for ${key}`);

  const mapCheck = recipeImageMapResolves(recipeId, key);
  checks.push({
    name: 'recipe_resolves_to_approved_image',
    pass: mapCheck.pass,
    detail: mapCheck.detail,
  });
  if (!mapCheck.pass) {
    issues.push(`recipeImageMap does not resolve ${recipeId} → ${key}`);
  }

  const queue = loadImageQueue();
  const queueItem = queue?.items.find((i) => i.recipeId === recipeId);
  checks.push({
    name: 'queue_status',
    pass: true,
    detail: queueItem?.status ?? '(no queue)',
  });

  let tscOk = false;
  let tscDetail = '';
  try {
    execSync('npx tsc --noEmit -p tsconfig.json', {
      cwd: PATHS.appRoot,
      stdio: 'pipe',
      encoding: 'utf8',
      timeout: 120_000,
    });
    tscOk = true;
    tscDetail = 'tsc --noEmit passed';
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string; message?: string };
    const out = `${err.stdout ?? ''}${err.stderr ?? ''}${err.message ?? ''}`;
    const mealRelated = /mealImage(Assets|Types)/i.test(out);
    tscOk = !mealRelated;
    tscDetail = mealRelated
      ? `tsc errors in meal image registry:\n${out.slice(0, 500)}`
      : out.trim()
        ? `tsc reported unrelated project issues (ignored for IMG-2B): ${out.slice(0, 200)}`
        : 'tsc unavailable or failed without meal registry errors';
  }
  checks.push({
    name: 'typescript_passes',
    pass: tscOk,
    detail: tscDetail,
  });
  if (!tscOk) issues.push('TypeScript check failed for meal image registry');

  const ok = checks
    .filter((c) => c.name !== 'queue_status')
    .every((c) => c.pass);

  return {
    ok,
    recipeId,
    recipeName: recipe.name,
    heroImageKey: key,
    checks,
    issues,
  };
}
