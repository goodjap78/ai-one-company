/**
 * STEP 6 — Update mealImageAssets.ts + mealImageTypes.ts with static require().
 * HANKKI keys alphabetical; no duplicates; never dynamic require.
 */
import fs from 'node:fs';
import { PATHS } from './config';

export function listApprovedMealKeysOnDisk(): string[] {
  if (!fs.existsSync(PATHS.mealAssetsDir)) return [];
  return fs
    .readdirSync(PATHS.mealAssetsDir)
    .filter((f) => /^[a-z][a-z0-9_]*\.jpg$/i.test(f))
    .map((f) => f.replace(/\.jpg$/i, ''))
    .filter((key) => !key.startsWith('category_'))
    .sort((a, b) => a.localeCompare(b));
}

/**
 * Register keys that already exist as JPG on disk (typically after approval).
 * Preserves hankki-default, gold_*, category_* entries.
 */
export function updateMealImageRegistry(keysToEnsure: string[]): {
  updated: boolean;
  registryPath: string;
  typesPath: string;
  registeredHankkiKeys: string[];
} {
  const unique = [...new Set(keysToEnsure.map((k) => k.trim()).filter(Boolean))];
  const onDisk = new Set(listApprovedMealKeysOnDisk());
  const hankkiKeys = [...new Set([...unique, ...onDisk])]
    .filter((k) => onDisk.has(k))
    .sort((a, b) => a.localeCompare(b));

  const registryUpdated = rewriteMealAssets(hankkiKeys);
  const typesUpdated = rewriteMealTypes(hankkiKeys);

  return {
    updated: registryUpdated || typesUpdated,
    registryPath: PATHS.mealRegistry,
    typesPath: PATHS.mealTypes,
    registeredHankkiKeys: hankkiKeys,
  };
}

function rewriteMealAssets(hankkiKeys: string[]): boolean {
  const source = fs.readFileSync(PATHS.mealRegistry, 'utf8');
  const hankkiLines = hankkiKeys
    .map(
      (key) =>
        `  ${formatKey(key)}: require('../../assets/meals/${key}.jpg'),`,
    )
    .join('\n');

  const body = `{
  // HANKKI recipes (${hankkiKeys.length} registered, alphabetical)
${hankkiLines}

  // Fallback key — never require hankki-default.png (missing)
  'hankki-default': require('../../assets/meals/jaeyuk.jpg'),

  // Legacy gold_* keys → same-dish HANKKI file or category_default
  gold_kr_kimchi_jjigae: require('../../assets/meals/kimchi_stew.jpg'),
  gold_kr_samgyeopsal: require('../../assets/meals/category_default.png'),
  gold_kr_jeyuk_bokkeum: require('../../assets/meals/jaeyuk.jpg'),
  gold_kr_bibimbap: require('../../assets/meals/bibimbap.jpg'),
  gold_kr_jjapaghetti: require('../../assets/meals/category_default.png'),
  gold_j_udon: require('../../assets/meals/category_default.png'),
  gold_c_jajangmyeon: require('../../assets/meals/category_default.png'),
  gold_w_cream_pasta: require('../../assets/meals/category_default.png'),

  category_korean: require('../../assets/meals/category_korean.png'),
  category_japanese: require('../../assets/meals/category_japanese.png'),
  category_chinese: require('../../assets/meals/category_chinese.png'),
  category_western: require('../../assets/meals/category_western.png'),
  category_default: require('../../assets/meals/category_default.png'),
}`;

  const pattern =
    /export const MEAL_LOCAL_IMAGES: Record<MealLocalAssetKey, ImageSourcePropType> = \{[\s\S]*?\n\};/;
  if (!pattern.test(source)) {
    throw new Error('Could not locate MEAL_LOCAL_IMAGES in mealImageAssets.ts');
  }
  const next = source.replace(
    pattern,
    `export const MEAL_LOCAL_IMAGES: Record<MealLocalAssetKey, ImageSourcePropType> = ${body};`,
  );
  if (next === source) return false;
  fs.writeFileSync(PATHS.mealRegistry, next, 'utf8');
  return true;
}

function rewriteMealTypes(hankkiKeys: string[]): boolean {
  const source = fs.readFileSync(PATHS.mealTypes, 'utf8');
  const hankkiUnion = hankkiKeys.map((k) => `  | '${k}'`).join('\n');

  const pattern =
    /export type MealLocalAssetKey =[\s\S]*?\n  \/\/ Legacy fallback key \(no hankki-default\.png — require points at jaeyuk\.jpg\)\n  \| 'hankki-default'/;

  const replacement = `export type MealLocalAssetKey =
  // Sprint IMG-2 — HANKKI meal keys (alphabetical, on-disk filenames without extension)
${hankkiUnion}
  // Legacy fallback key (no hankki-default.png — require points at jaeyuk.jpg)
  | 'hankki-default'`;

  if (!pattern.test(source)) {
    throw new Error('Could not update MealLocalAssetKey union in mealImageTypes.ts');
  }
  const next = source.replace(pattern, replacement);
  if (next === source) return false;
  fs.writeFileSync(PATHS.mealTypes, next, 'utf8');
  return true;
}

function formatKey(key: string): string {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key) ? key : `'${key}'`;
}

export function parseRegisteredMealKeys(
  registrySource = fs.readFileSync(PATHS.mealRegistry, 'utf8'),
): string[] {
  const block = registrySource.match(
    /export const MEAL_LOCAL_IMAGES[\s\S]*?= \{([\s\S]*?)\n\};/,
  );
  if (!block) return [];
  const keys: string[] = [];
  const re = /^\s*(?:'([^']+)'|([a-zA-Z_][a-zA-Z0-9_]*))\s*:\s*require\(/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block[1]))) {
    keys.push(m[1] ?? m[2]);
  }
  return keys;
}
