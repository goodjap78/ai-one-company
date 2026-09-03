/**
 * Child hero audit — 112 child recipes.
 * Avoid importing mealImageAssets (Metro require). Parse registry source instead.
 * Run: npx tsx scripts/audit-child-hero-images.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HANKKI_RECIPES } from '../data/recipes/hankkiRecipes';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, '..');
const MEALS_DIR = path.join(APP_ROOT, 'assets', 'meals');
const MEAL_ASSETS_SRC = path.join(APP_ROOT, 'services/images/mealImageAssets.ts');

type Status = 'HERO_OK' | 'HERO_MISSING' | 'HERO_MAPPING_ERROR' | 'HERO_REVIEW_REQUIRED';

function parseRegistryKeys(): Set<string> {
  const src = fs.readFileSync(MEAL_ASSETS_SRC, 'utf8');
  const keys = new Set<string>();
  const re = /^\s*(?:'([^']+)'|([a-zA-Z0-9_]+))\s*:\s*require\(/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) keys.add(m[1] || m[2]!);
  return keys;
}

function childAudience(audiences: readonly string[]): 'baby' | 'toddler' | 'elementary' | null {
  if (audiences.includes('baby')) return 'baby';
  if (audiences.includes('toddler')) return 'toddler';
  if (audiences.includes('elementary')) return 'elementary';
  return null;
}

function mealsDirBytes(): number {
  let total = 0;
  for (const name of fs.readdirSync(MEALS_DIR)) {
    const p = path.join(MEALS_DIR, name);
    const st = fs.statSync(p);
    if (st.isFile()) total += st.size;
  }
  return total;
}

function main(): void {
  const registry = parseRegistryKeys();
  const child = HANKKI_RECIPES.filter((r) => childAudience(r.familyAudience.audiences));
  const rows = child.map((r) => {
    const key = (r.heroImageKey || '').trim();
    const imagePath = (r.image || '').trim();
    const jpg = path.join(MEALS_DIR, `${key}.jpg`);
    const png = path.join(MEALS_DIR, `${key}.png`);
    const fileExists = Boolean(key) && (fs.existsSync(jpg) || fs.existsSync(png));
    const inRegistry = Boolean(key) && registry.has(key);
    const pathKeyMatch = /^assets\/meals\/([a-z0-9_]+)\.(?:jpg|jpeg|png)$/i.exec(imagePath);
    const pathKey = pathKeyMatch?.[1] ?? null;
    const pathOk = pathKey === key && inRegistry;
    let status: Status = 'HERO_OK';
    if (!key || !fileExists) status = 'HERO_MISSING';
    else if (!inRegistry || !pathOk) status = 'HERO_MAPPING_ERROR';
    else if (fs.existsSync(png) && !fs.existsSync(jpg)) status = 'HERO_REVIEW_REQUIRED';

    return {
      recipeId: r.id,
      name: r.name,
      audience: childAudience(r.familyAudience.audiences)!,
      stage: r.familyAudience.babyFood?.stage ?? null,
      texture: r.familyAudience.babyFood?.texture ?? null,
      heroImageKey: key,
      fileExists,
      inRegistry,
      pathOk,
      status,
      ingredients: r.ingredients.map((i) => `${i.name} ${i.amount}`).join(', '),
      steps: r.recipe.steps.map((s) => `${s.title}: ${s.instruction}`).join(' | '),
    };
  });

  const byStatus = {
    HERO_OK: rows.filter((r) => r.status === 'HERO_OK'),
    HERO_MISSING: rows.filter((r) => r.status === 'HERO_MISSING'),
    HERO_MAPPING_ERROR: rows.filter((r) => r.status === 'HERO_MAPPING_ERROR'),
    HERO_REVIEW_REQUIRED: rows.filter((r) => r.status === 'HERO_REVIEW_REQUIRED'),
  };

  const byAud = {
    baby: rows.filter((r) => r.audience === 'baby'),
    toddler: rows.filter((r) => r.audience === 'toddler'),
    elementary: rows.filter((r) => r.audience === 'elementary'),
  };

  const summary = {
    childTotal: child.length,
    mealsDirBytes: mealsDirBytes(),
    mealsDirMB: Math.round((mealsDirBytes() / (1024 * 1024)) * 100) / 100,
    counts: {
      HERO_OK: byStatus.HERO_OK.length,
      HERO_MISSING: byStatus.HERO_MISSING.length,
      HERO_MAPPING_ERROR: byStatus.HERO_MAPPING_ERROR.length,
      HERO_REVIEW_REQUIRED: byStatus.HERO_REVIEW_REQUIRED.length,
    },
    audienceOk: {
      baby: byAud.baby.filter((r) => r.status === 'HERO_OK').length,
      toddler: byAud.toddler.filter((r) => r.status === 'HERO_OK').length,
      elementary: byAud.elementary.filter((r) => r.status === 'HERO_OK').length,
    },
    audienceMissing: {
      baby: byAud.baby.filter((r) => r.status !== 'HERO_OK').map((r) => ({
        id: r.recipeId,
        name: r.name,
        key: r.heroImageKey,
        status: r.status,
        stage: r.stage,
        texture: r.texture,
      })),
      toddler: byAud.toddler.filter((r) => r.status !== 'HERO_OK').map((r) => ({
        id: r.recipeId,
        name: r.name,
        key: r.heroImageKey,
        status: r.status,
      })),
      elementary: byAud.elementary.filter((r) => r.status !== 'HERO_OK').map((r) => ({
        id: r.recipeId,
        name: r.name,
        key: r.heroImageKey,
        status: r.status,
      })),
    },
  };

  const outPath = path.join(APP_ROOT, 'scripts', 'reports', 'child-hero-audit.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify({ summary, rows }, null, 2), 'utf8');
  console.log(JSON.stringify(summary, null, 2));
  console.log(`\nWrote ${outPath}`);
}

main();
