import fs from 'node:fs';
import path from 'node:path';
import { PATHS } from './config';
import { isValidAssetKey } from './normalizeAssetKey';
import type {
  AssetManifest,
  AssetValidationRow,
  ValidationVerdict,
} from './types';

function parseRequireEntries(
  source: string,
  constName: string,
): Map<string, string> {
  const map = new Map<string, string>();
  const blockMatch = source.match(
    new RegExp(`export const ${constName}[^=]*=\\s*\\{([\\s\\S]*?)\\n\\};`),
  );
  if (!blockMatch) return map;

  const re =
    /^\s*([a-z][a-z0-9_]*)\s*:\s*require\('([^']+)'\)/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(blockMatch[1]))) {
    map.set(m[1], m[2]);
  }
  return map;
}

function check(
  name: string,
  ok: boolean,
  detail?: string,
): { name: string; verdict: ValidationVerdict; detail?: string } {
  return { name, verdict: ok ? 'PASS' : 'FAIL', detail };
}

/**
 * Validate recipe asset keys, files, and static registry require paths.
 */
export function validateRecipeAssets(
  manifest: AssetManifest,
): AssetValidationRow[] {
  const ingredientSource = fs.readFileSync(PATHS.ingredientRegistry, 'utf8');
  const stepSource = fs.readFileSync(PATHS.stepRegistry, 'utf8');
  const ingredientRequires = parseRequireEntries(
    ingredientSource,
    'INGREDIENT_IMAGE_ASSETS',
  );
  const stepRequires = parseRequireEntries(
    stepSource,
    'RECIPE_STEP_IMAGE_ASSETS',
  );

  const rows: AssetValidationRow[] = [];
  const seenIngredient = new Set<string>();
  const seenStep = new Set<string>();

  for (const item of manifest.ingredients) {
    if (seenIngredient.has(item.iconKey)) {
      rows.push({
        kind: 'ingredient',
        key: item.iconKey,
        verdict: 'FAIL',
        checks: [
          check('duplicate keys', false, `Duplicate iconKey ${item.iconKey}`),
        ],
      });
      continue;
    }
    seenIngredient.add(item.iconKey);

    const requirePath = ingredientRequires.get(item.iconKey);
    const expectedRequire = `../../assets/ingredients/${item.filename}`;
    const extOk = item.filename.toLowerCase().endsWith('.png');
    const casingOk = item.filename === `${item.iconKey}.png`;
    const unrelated =
      requirePath != null &&
      path.basename(requirePath) !== item.filename;

    const checks = [
      check('iconKey valid', isValidAssetKey(item.iconKey)),
      check('asset file exists', item.fileExists, item.relativePath),
      check(
        'registry key exists',
        ingredientRequires.has(item.iconKey),
        item.fileExists
          ? 'file exists but not registered'
          : 'missing file — registry should stay empty',
      ),
      check(
        'require path matches filename',
        !requirePath || requirePath === expectedRequire,
        requirePath ? `got ${requirePath}` : 'no require',
      ),
      check('supported extension (.png)', extOk, item.filename),
      check('filename casing matches key', casingOk, item.filename),
      check('not an unrelated image', !unrelated, requirePath),
    ];

    // Missing file + empty registry is OK for incomplete assets (not FAIL registry)
    if (!item.fileExists) {
      const registryIdx = checks.findIndex((c) => c.name === 'registry key exists');
      if (registryIdx >= 0 && !ingredientRequires.has(item.iconKey)) {
        checks[registryIdx] = check(
          'registry key exists',
          true,
          'correctly unregistered while file missing',
        );
      }
      // File missing → overall FAIL for completeness
      checks[1] = check('asset file exists', false, item.relativePath);
    }

    rows.push({
      kind: 'ingredient',
      key: item.iconKey,
      verdict: checks.every((c) => c.verdict === 'PASS') ? 'PASS' : 'FAIL',
      checks,
    });
  }

  for (const item of manifest.steps) {
    if (seenStep.has(item.imageKey)) {
      rows.push({
        kind: 'step',
        key: item.imageKey,
        recipeId: item.recipeId,
        verdict: 'FAIL',
        checks: [
          check('duplicate keys', false, `Duplicate imageKey ${item.imageKey}`),
        ],
      });
      continue;
    }
    seenStep.add(item.imageKey);

    const requirePath = stepRequires.get(item.imageKey);
    const expectedRequire = `../../assets/recipe-steps/${item.filename}`;
    const extOk = item.filename.toLowerCase().endsWith('.jpg');
    const casingOk = item.filename === `${item.imageKey}.jpg`;
    const unrelated =
      requirePath != null && path.basename(requirePath) !== item.filename;
    // Step key should relate to hero key prefix when possible
    const heroPrefixOk =
      item.imageKey.includes('_step_') ||
      item.imageKey.startsWith(item.recipeName);

    const checks = [
      check('step imageKey valid', isValidAssetKey(item.imageKey)),
      check('asset file exists', item.fileExists, item.relativePath),
      check(
        'registry key exists',
        item.fileExists
          ? stepRequires.has(item.imageKey)
          : !stepRequires.has(item.imageKey),
        item.fileExists
          ? undefined
          : 'correctly unregistered while file missing',
      ),
      check(
        'require path matches filename',
        !requirePath || requirePath === expectedRequire,
        requirePath ? `got ${requirePath}` : 'no require',
      ),
      check('supported extension (.jpg)', extOk, item.filename),
      check('filename casing matches key', casingOk, item.filename),
      check('not an unrelated image', !unrelated, requirePath),
      check(
        'step key looks recipe-scoped',
        item.imageKey.includes('_step_'),
        heroPrefixOk ? undefined : item.imageKey,
      ),
    ];

    rows.push({
      kind: 'step',
      key: item.imageKey,
      recipeId: item.recipeId,
      verdict: checks.every((c) => c.verdict === 'PASS') ? 'PASS' : 'FAIL',
      checks,
    });
  }

  return rows;
}
