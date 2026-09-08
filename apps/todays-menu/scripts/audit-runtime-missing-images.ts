/**
 * Full recipe hero image missing-mapping audit.
 * Run: npx tsx scripts/audit-runtime-missing-images.ts
 *
 * Source-parse mealImageAssets (no Metro require). Does not generate images.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HANKKI_RECIPES } from '../data/recipes/hankkiRecipes';
import { listElementaryBreakfastWeekCandidates } from '../data/recipes/elementaryBreakfastWeeklyPlan';
import { listElementaryDinnerWeekCandidates } from '../data/recipes/elementaryDinnerWeeklyPlan';
import { listToddlerBreakfastWeekCandidates } from '../data/recipes/toddlerBreakfastWeeklyPlan';
import { listToddlerDinnerWeekCandidates } from '../data/recipes/toddlerDinnerWeeklyPlan';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const MEALS_DIR = path.join(ROOT, 'assets', 'meals');
const ASSETS_SRC = path.join(ROOT, 'services/images/mealImageAssets.ts');
const MAP_SRC = path.join(ROOT, 'data/recipes/recipeImageMap.ts');

type Issue = {
  recipeId: string;
  name: string;
  kind: string;
  detail: string;
};

function parseRegistryKeys(): Set<string> {
  const src = fs.readFileSync(ASSETS_SRC, 'utf8');
  const keys = new Set<string>();
  const re = /^\s*(?:'([^']+)'|([a-zA-Z0-9_]+))\s*:\s*require\(/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) keys.add(m[1] || m[2]);
  return keys;
}

function parseRequirePaths(): Map<string, string> {
  const src = fs.readFileSync(ASSETS_SRC, 'utf8');
  const map = new Map<string, string>();
  const re =
    /^\s*(?:'([^']+)'|([a-zA-Z0-9_]+))\s*:\s*require\('([^']+)'\)/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    map.set(m[1] || m[2], m[3]);
  }
  return map;
}

function parseExplicitMap(): Map<string, string> {
  const src = fs.readFileSync(MAP_SRC, 'utf8');
  const map = new Map<string, string>();
  const re = /'([^']+)'\s*:\s*\{\s*kind:\s*'local',\s*key:\s*'([^']+)'/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) map.set(m[1], m[2]);
  return map;
}

function parseRemoteMap(): Map<string, string> {
  const src = fs.readFileSync(MAP_SRC, 'utf8');
  const map = new Map<string, string>();
  const re = /'([^']+)'\s*:\s*\{\s*kind:\s*'remote',\s*url:\s*'([^']+)'/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) map.set(m[1], m[2]);
  return map;
}

function pathKey(imagePath: string): string | null {
  const normalized = imagePath.trim().replace(/^\.\//, '').replace(/^\/+/, '');
  const match = normalized.match(/^assets\/meals\/([a-z0-9_]+)\.(jpg|jpeg|png)$/i);
  return match ? match[1] : null;
}

function diskFiles(): { jpg: Set<string>; other: string[] } {
  const jpg = new Set<string>();
  const other: string[] = [];
  if (!fs.existsSync(MEALS_DIR)) return { jpg, other };
  for (const name of fs.readdirSync(MEALS_DIR)) {
    const m = name.match(/^([a-z0-9_]+)\.(jpg|jpeg|png)$/i);
    if (!m) continue;
    if (m[2].toLowerCase() === 'jpg' || m[2].toLowerCase() === 'jpeg') jpg.add(m[1]);
    else other.push(name);
  }
  return { jpg, other };
}

const issues: Issue[] = [];

function add(recipeId: string, name: string, kind: string, detail: string): void {
  issues.push({ recipeId, name, kind, detail });
}

const registry = parseRegistryKeys();
const requirePaths = parseRequirePaths();
const explicitMap = parseExplicitMap();
const remoteMap = parseRemoteMap();
const disk = diskFiles();

console.log('HANKKI runtime image missing audit — start\n');
console.log(`recipes: ${HANKKI_RECIPES.length}`);
console.log(`registry keys: ${registry.size}`);
console.log(`disk jpg stems: ${disk.jpg.size}`);
console.log(`explicit RECIPE_IMAGE_MAP local: ${explicitMap.size}`);
console.log(`explicit RECIPE_IMAGE_MAP remote: ${remoteMap.size}`);
if (disk.other.length) console.log(`non-jpg meals: ${disk.other.join(', ')}`);

const imageKeyCounts = new Map<string, string[]>();

for (const recipe of HANKKI_RECIPES) {
  const imagePath = recipe.image?.trim() ?? '';
  const heroKey = recipe.heroImageKey?.trim() ?? '';
  const fromPath = imagePath ? pathKey(imagePath) : null;

  if (!imagePath) add(recipe.id, recipe.name, 'MISSING_ASSET', 'empty recipe.image');
  if (!heroKey) add(recipe.id, recipe.name, 'BROKEN_MAPPING', 'empty heroImageKey');

  if (fromPath) {
    const list = imageKeyCounts.get(fromPath) ?? [];
    list.push(recipe.id);
    imageKeyCounts.set(fromPath, list);
  }

  if (imagePath && !fromPath) {
    add(recipe.id, recipe.name, 'BROKEN_MAPPING', `invalid image path: ${imagePath}`);
  }

  if (fromPath && fromPath !== heroKey && heroKey) {
    add(
      recipe.id,
      recipe.name,
      'BROKEN_MAPPING',
      `path key ${fromPath} !== heroImageKey ${heroKey}`,
    );
  }

  const resolvedKey = explicitMap.get(recipe.id) ?? fromPath ?? (registry.has(heroKey) ? heroKey : null);

  if (!resolvedKey) {
    add(recipe.id, recipe.name, 'BROKEN_MAPPING', 'resolveMealHeroImage would have no local source');
    continue;
  }

  if (!registry.has(resolvedKey)) {
    add(recipe.id, recipe.name, 'BROKEN_MAPPING', `not in mealImageAssets: ${resolvedKey}`);
  }

  const jpgPath = path.join(MEALS_DIR, `${resolvedKey}.jpg`);
  if (!fs.existsSync(jpgPath)) {
    add(recipe.id, recipe.name, 'MISSING_ASSET', `no file assets/meals/${resolvedKey}.jpg`);
  } else {
    const size = fs.statSync(jpgPath).size;
    if (size < 32) {
      add(recipe.id, recipe.name, 'MISSING_ASSET', `asset too small (${size} bytes): ${resolvedKey}.jpg`);
    }
  }

  const req = requirePaths.get(resolvedKey);
  if (req) {
    const abs = path.resolve(path.dirname(ASSETS_SRC), req);
    if (!fs.existsSync(abs)) {
      add(recipe.id, recipe.name, 'BROKEN_MAPPING', `require path missing: ${req}`);
    }
  }

  const remote = remoteMap.get(recipe.id);
  if (remote && !/^https?:\/\//i.test(remote)) {
    add(recipe.id, recipe.name, 'REMOTE_LOAD_RISK', `invalid remote url: ${remote}`);
  }
}

const sharedKeys = [...imageKeyCounts.entries()].filter(([, ids]) => ids.length > 1);

function auditPool(
  label: string,
  candidates: { recipe: { id: string; name: string } }[],
): string[] {
  const recipes = candidates.map((c) => c.recipe);
  const bad: string[] = [];
  for (const recipe of recipes) {
    const hits = issues.filter((i) => i.recipeId === recipe.id);
    if (hits.length) {
      bad.push(`${recipe.id} (${recipe.name}): ${hits.map((h) => h.kind).join(',')}`);
    }
  }
  console.log(`\n${label}: pool ${recipes.length}, issues ${bad.length}`);
  for (const line of bad.slice(0, 40)) console.log(`  ${line}`);
  if (bad.length > 40) console.log(`  … +${bad.length - 40} more`);
  return bad;
}

const weeklyBf = auditPool(
  'WEEKLY elementary breakfast',
  listElementaryBreakfastWeekCandidates(),
);
const weeklyDn = auditPool(
  'WEEKLY elementary dinner',
  listElementaryDinnerWeekCandidates(),
);
const weeklyTbf = auditPool(
  'WEEKLY toddler breakfast',
  listToddlerBreakfastWeekCandidates(),
);
const weeklyTdn = auditPool(
  'WEEKLY toddler dinner',
  listToddlerDinnerWeekCandidates(),
);

const missingAsset = issues.filter((i) => i.kind === 'MISSING_ASSET');
const broken = issues.filter((i) => i.kind === 'BROKEN_MAPPING');
const remote = issues.filter((i) => i.kind === 'REMOTE_LOAD_RISK');

const registryNoFile = [...registry].filter((k) => k !== 'hankki-default' && !disk.jpg.has(k));
const fileNoRegistry = [...disk.jpg].filter((k) => !registry.has(k));

console.log('\n========== SUMMARY ==========');
console.log(`MISSING_ASSET: ${missingAsset.length}`);
console.log(`BROKEN_MAPPING: ${broken.length}`);
console.log(`REMOTE_LOAD_RISK: ${remote.length}`);
console.log(`shared image keys (multiple recipes): ${sharedKeys.length}`);
console.log(`registry keys without jpg: ${registryNoFile.length}`);
console.log(`jpg files without registry: ${fileNoRegistry.length}`);
console.log(
  `weekly issues: elemBf=${weeklyBf.length} elemDn=${weeklyDn.length} todBf=${weeklyTbf.length} todDn=${weeklyTdn.length}`,
);

if (registryNoFile.length) {
  console.log('\nregistry without file:');
  for (const k of registryNoFile.slice(0, 30)) console.log(`  ${k}`);
}
if (fileNoRegistry.length) {
  console.log('\nfile without registry:');
  for (const k of fileNoRegistry.slice(0, 30)) console.log(`  ${k}`);
}
if (sharedKeys.length) {
  console.log('\nshared keys (not necessarily wrong):');
  for (const [key, ids] of sharedKeys.slice(0, 20)) {
    console.log(`  ${key} ← ${ids.join(', ')}`);
  }
}

const uniqueIds = [...new Set(issues.map((i) => i.recipeId))];
console.log(`\nAFFECTED_RECIPE_IDS (${uniqueIds.length}):`);
for (const id of uniqueIds.slice(0, 80)) {
  const row = issues.filter((i) => i.recipeId === id);
  console.log(`  ${id}: ${row.map((r) => `${r.kind}:${r.detail}`).join(' | ')}`);
}
if (uniqueIds.length > 80) console.log(`  … +${uniqueIds.length - 80} more`);

if (issues.length > 0) {
  console.log('\nAUDIT HAS FINDINGS');
} else {
  console.log('\nAUDIT CLEAN — all catalog recipes resolve to bundled JPGs');
}
