/**
 * Sprint RF-6 — Write recipe-production-report.md for HANKKI catalog 001–100.
 *
 * npm run recipes:production-report
 */
import fs from 'node:fs';
import path from 'node:path';
import { HANKKI_RECIPES } from '../../data/recipes/hankkiRecipes';
import { validateHankkiProductionDb } from '../../data/recipes/validateHankkiProduction';

const APP_ROOT = path.resolve(__dirname, '../..');
const MEALS_DIR = path.join(APP_ROOT, 'assets/meals');
const ING_DIR = path.join(APP_ROOT, 'assets/ingredients');
const STEP_DIR = path.join(APP_ROOT, 'assets/recipe-steps');
const REGISTRY = path.join(APP_ROOT, 'services/images/mealImageAssets.ts');
const OUT = path.join(
  APP_ROOT,
  'generated/recipe-factory/recipe-production-report.md',
);

function existsAsset(abs: string): boolean {
  return fs.existsSync(abs) && fs.statSync(abs).isFile();
}

function countRegisteredMealKeys(): number {
  if (!fs.existsSync(REGISTRY)) return 0;
  const source = fs.readFileSync(REGISTRY, 'utf8');
  const matches = source.match(/^\s*(?:'[^']+'|[a-zA-Z_][\w]*)\s*:\s*require\(/gm);
  return matches?.length ?? 0;
}

function main(): void {
  const recipes = HANKKI_RECIPES;
  const validation = validateHankkiProductionDb(recipes);

  const presentHeroes: string[] = [];
  const missingHeroes: string[] = [];
  for (const recipe of recipes) {
    const file = `${recipe.heroImageKey}.jpg`;
    const abs = path.join(MEALS_DIR, file);
    if (existsAsset(abs)) presentHeroes.push(file);
    else missingHeroes.push(`${recipe.id} ${recipe.name} → ${file}`);
  }

  const ingredientKeys = new Set<string>();
  const stepKeys = new Set<string>();
  for (const recipe of recipes) {
    for (const ing of recipe.ingredients) {
      if (ing.iconKey) ingredientKeys.add(ing.iconKey);
    }
    for (const step of recipe.recipe.steps) {
      if (step.imageKey) stepKeys.add(step.imageKey);
    }
  }

  const missingIngredients = [...ingredientKeys]
    .sort()
    .filter((k) => !existsAsset(path.join(ING_DIR, `${k}.png`)))
    .map((k) => `${k}.png`);
  const missingSteps = [...stepKeys]
    .sort()
    .filter((k) => !existsAsset(path.join(STEP_DIR, `${k}.jpg`)))
    .map((k) => `${k}.jpg`);

  const registeredKeys = countRegisteredMealKeys();
  const issuesByCode = new Map<string, number>();
  for (const issue of validation.issues) {
    issuesByCode.set(issue.code, (issuesByCode.get(issue.code) ?? 0) + 1);
  }

  const lines: string[] = [
    '# HANKKI Recipe Production Report',
    '',
    `> Sprint RF-6 · generated ${new Date().toISOString()}`,
    '',
    '## Summary',
    '',
    `| Metric | Value |`,
    `| --- | ---: |`,
    `| Current Recipe Count | **${recipes.length}** |`,
    `| Target | 100 |`,
    `| Validation | ${validation.ok ? '**PASS**' : '**FAIL**'} |`,
    `| Issues | ${validation.issues.length} |`,
    `| Hero JPGs on disk | ${presentHeroes.length} |`,
    `| Missing Hero Images | ${missingHeroes.length} |`,
    `| Missing Ingredient Images | ${missingIngredients.length} |`,
    `| Missing Step Images | ${missingSteps.length} |`,
    `| Registered meal asset keys | ${registeredKeys} |`,
    `| Ready for Image Factory | ${validation.ok && recipes.length === 100 ? '**YES**' : '**NO**'} |`,
    '',
    '## Validation Result',
    '',
  ];

  if (validation.ok) {
    lines.push(
      'All production checks passed (ids, names, heroImageKeys, fields, steps, decision metadata).',
    );
    lines.push('');
  } else {
    lines.push('### Issues by code', '');
    lines.push('| Code | Count |', '| --- | ---: |');
    for (const [code, count] of [...issuesByCode.entries()].sort(
      (a, b) => b[1] - a[1],
    )) {
      lines.push(`| \`${code}\` | ${count} |`);
    }
    lines.push('', '### Sample issues', '');
    for (const issue of validation.issues.slice(0, 40)) {
      lines.push(
        `- \`${issue.recipeId}\` ${issue.recipeName}: **${issue.code}** — ${issue.message}`,
      );
    }
    if (validation.issues.length > 40) {
      lines.push(`- … +${validation.issues.length - 40} more`);
    }
    lines.push('');
  }

  lines.push(
    '## Missing Hero Images',
    '',
    `Dish-specific JPG missing under \`assets/meals/\` (${missingHeroes.length}).`,
    'Batch 01 (10) present; 011–100 use category fallbacks in `recipeImageMap` until Image Factory.',
    '',
  );
  for (const row of missingHeroes.slice(0, 60)) {
    lines.push(`- ${row}`);
  }
  if (missingHeroes.length > 60) {
    lines.push(`- … +${missingHeroes.length - 60} more`);
  }

  lines.push(
    '',
    '## Missing Ingredient Images',
    '',
    `Unique iconKeys without \`assets/ingredients/{key}.png\`: **${missingIngredients.length}**`,
    '',
  );
  for (const f of missingIngredients.slice(0, 40)) {
    lines.push(`- ${f}`);
  }
  if (missingIngredients.length > 40) {
    lines.push(`- … +${missingIngredients.length - 40} more`);
  }

  lines.push(
    '',
    '## Missing Step Images',
    '',
    `Unique step imageKeys without \`assets/recipe-steps/{key}.jpg\`: **${missingSteps.length}**`,
    '',
  );
  lines.push(
    `All ${missingSteps.length} step keys are expected missing until step asset factory runs.`,
    '',
  );

  lines.push(
    '## Batches',
    '',
    '| Batch | IDs | Status |',
    '| --- | --- | --- |',
    '| 01 | 001–010 | Live + heroes on disk |',
    '| 02–05 | 011–050 | Live + category fallbacks |',
    '| 06–10 | 051–100 | **RF-6 promoted to production** + cuisine fallbacks |',
    '',
    '## Ready for Image Factory',
    '',
    validation.ok && recipes.length === 100
      ? [
          '**YES** — catalog fields are production-valid.',
          '',
          'Next: `npm run image-factory:prepare` then `hero:queue` for keys 011–100.',
          'Do not bulk-approve mock images into registry.',
        ].join('\n')
      : '**NO** — fix validation issues before Image Factory mass generation.',
    '',
  );

  const report = lines.join('\n');
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, report, 'utf8');
  console.log(`Wrote ${path.relative(APP_ROOT, OUT)}`);
  console.log(report);
  process.exitCode = validation.ok && recipes.length === 100 ? 0 : 1;
}

main();
