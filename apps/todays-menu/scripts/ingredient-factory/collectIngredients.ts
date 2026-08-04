/**
 * Collect unique ingredient iconKeys for recipe ID range (alias-normalized).
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  compactIngredientName,
  INGREDIENT_ALIASES,
  lookupIngredientAlias,
  normalizeIngredientName,
} from '../../data/ingredients/ingredientAliases';
import { HANKKI_RECIPES } from '../../data/recipes/hankkiRecipes';
import { inRecipeIdRange } from '../image-factory/recipeIdRange';
import { normalizeAssetKey } from '../recipe-assets/normalizeAssetKey';
import { PATHS } from './config';
import type { IngredientManifest, IngredientManifestEntry } from './types';

function parseRequireKeys(registryPath: string): Set<string> {
  if (!fs.existsSync(registryPath)) return new Set();
  const source = fs.readFileSync(registryPath, 'utf8');
  const block = source.match(
    /export const INGREDIENT_IMAGE_ASSETS[^=]*=\s*\{([\s\S]*?)\n\};/,
  );
  if (!block) return new Set();
  const keys = new Set<string>();
  const re = /^\s*([a-z][a-z0-9_]*)\s*:\s*require\(/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block[1]))) keys.add(m[1]);
  return keys;
}

function resolveIconKey(name: string, explicit?: string): string {
  if (explicit?.trim()) return normalizeAssetKey(explicit);
  const alias = lookupIngredientAlias(name);
  if (alias) return normalizeAssetKey(alias);
  return normalizeAssetKey(name) || `unknown_${name.length}`;
}

function aliasesForKey(iconKey: string, names: string[]): string[] {
  const fromMap = Object.entries(INGREDIENT_ALIASES)
    .filter(([, key]) => key === iconKey)
    .map(([alias]) => alias);
  const extras = names.filter(
    (n) =>
      !fromMap.some(
        (a) =>
          normalizeIngredientName(a) === normalizeIngredientName(n) ||
          compactIngredientName(a) === compactIngredientName(n),
      ),
  );
  return [...new Set([...fromMap, ...extras])].sort((a, b) =>
    a.localeCompare(b, 'ko'),
  );
}

function classifyStatus(input: {
  fileExists: boolean;
  registryHasKey: boolean;
}): IngredientManifestEntry['status'] {
  if (input.fileExists && input.registryHasKey) return 'approved';
  if (input.fileExists && !input.registryHasKey) return 'existing_unregistered';
  return 'queued';
}

export function collectIngredientManifest(
  fromId: string,
  toId: string,
): IngredientManifest {
  const recipes = HANKKI_RECIPES.filter((r) =>
    inRecipeIdRange(r.id, fromId, toId),
  );
  const registryKeys = parseRequireKeys(PATHS.ingredientRegistry);

  type Acc = {
    names: string[];
    usedByRecipeIds: string[];
  };
  const byKey = new Map<string, Acc>();
  const unresolvedAliases: string[] = [];

  for (const recipe of recipes) {
    for (const ing of recipe.ingredients) {
      const explicit = ing.iconKey?.trim();
      const alias = lookupIngredientAlias(ing.name);
      if (!explicit && !alias) {
        const label = `${recipe.id}:${ing.name}`;
        if (!unresolvedAliases.includes(label)) unresolvedAliases.push(label);
      }
      const iconKey = resolveIconKey(ing.name, ing.iconKey);
      if (iconKey.startsWith('fallback_')) continue;
      const acc = byKey.get(iconKey) ?? { names: [], usedByRecipeIds: [] };
      if (!acc.names.includes(ing.name)) acc.names.push(ing.name);
      if (!acc.usedByRecipeIds.includes(recipe.id)) {
        acc.usedByRecipeIds.push(recipe.id);
      }
      byKey.set(iconKey, acc);
    }
  }

  const items: IngredientManifestEntry[] = [...byKey.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([iconKey, acc]) => {
      const filename = `${iconKey}.png`;
      const abs = path.join(PATHS.ingredientsDir, filename);
      const fileExists = fs.existsSync(abs) && fs.statSync(abs).isFile();
      const registryHasKey = registryKeys.has(iconKey);
      const aliases = aliasesForKey(iconKey, acc.names);
      const koreanName = acc.names[0] ?? iconKey;
      return {
        iconKey,
        koreanName,
        aliases,
        usedByRecipeIds: acc.usedByRecipeIds.sort(),
        outputFilename: filename,
        promptFile: `generated/ingredient-factory/prompts/${iconKey}.md`,
        status: classifyStatus({ fileExists, registryHasKey }),
        fileExists,
        registryHasKey,
      };
    });

  const reusedCount = items.filter((i) => i.usedByRecipeIds.length > 1).length;

  return {
    generatedAt: new Date().toISOString(),
    sprint: 'ING-2',
    fromId,
    toId,
    recipeCount: recipes.length,
    totalUnique: items.length,
    reusedCount,
    unresolvedAliases: unresolvedAliases.sort(),
    items,
  };
}

export function writeIngredientManifest(manifest: IngredientManifest): string {
  fs.mkdirSync(PATHS.generatedRoot, { recursive: true });
  fs.writeFileSync(PATHS.manifest, JSON.stringify(manifest, null, 2), 'utf8');
  return PATHS.manifest;
}

export function loadIngredientManifest(): IngredientManifest | null {
  if (!fs.existsSync(PATHS.manifest)) return null;
  return JSON.parse(
    fs.readFileSync(PATHS.manifest, 'utf8'),
  ) as IngredientManifest;
}
