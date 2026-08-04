/**
 * Dashboard + coverage for ingredient factory (ING-2).
 */
import fs from 'node:fs';
import { HANKKI_RECIPES } from '../../data/recipes/hankkiRecipes';
import { expandRecipeIdRange } from '../image-factory/recipeIdRange';
import { PATHS } from './config';
import type { IngredientManifest, IngredientQueueFile } from './types';

export function writeIngredientDashboard(input: {
  manifest: IngredientManifest;
  queue: IngredientQueueFile;
  validationOk?: boolean;
  unresolved?: string[];
}): string {
  const { manifest, queue } = input;
  const unresolved =
    input.unresolved ?? manifest.unresolvedAliases ?? [];
  const ids = expandRecipeIdRange(manifest.fromId, manifest.toId);
  const idSet = new Set(ids);
  const recipes = HANKKI_RECIPES.filter((r) => idSet.has(r.id));

  const approvedKeys = new Set(
    queue.items
      .filter((i) => i.status === 'approved')
      .map((i) => i.iconKey),
  );

  let covered = 0;
  for (const recipe of recipes) {
    const keys = recipe.ingredients.map((ing) => {
      const item = queue.items.find(
        (q) =>
          q.iconKey === ing.iconKey ||
          q.aliases.includes(ing.name) ||
          q.koreanName === ing.name,
      );
      return item?.iconKey ?? ing.iconKey;
    });
    const ok = keys.every((k) => approvedKeys.has(k));
    if (ok) covered += 1;
  }
  const recipeCoverage =
    recipes.length === 0
      ? 0
      : Math.round((covered / recipes.length) * 1000) / 10;

  const t = queue.totals;
  const awaiting = t.completed;
  const overallCompletion =
    manifest.totalUnique === 0
      ? 0
      : Math.round((t.approved / manifest.totalUnique) * 1000) / 10;

  const lines = [
    '# HANKKI Ingredient Image Factory — Dashboard',
    '',
    `> Sprint ING-2 · recipes ${manifest.fromId}–${manifest.toId} · ${queue.generatedAt}`,
    '',
    '## Summary',
    '',
    `| Metric | Value |`,
    `| --- | ---: |`,
    `| Total unique ingredients | ${manifest.totalUnique} |`,
    `| Approved | ${t.approved} |`,
    `| Existing unregistered | ${t.existing_unregistered} |`,
    `| Awaiting review | ${awaiting} |`,
    `| Rejected | ${t.rejected} |`,
    `| Failed | ${t.failed} |`,
    `| Queued / missing | ${t.queued + t.missing} |`,
    `| Unresolved aliases | ${unresolved.length} |`,
    `| Recipe coverage (assets) | **${recipeCoverage}%** (${covered}/${recipes.length}) |`,
    `| Overall completion | **${overallCompletion}%** |`,
    `| Validation | ${input.validationOk == null ? '—' : input.validationOk ? 'PASS' : 'FAIL'} |`,
    '',
    '## Commands',
    '',
    '```bash',
    'npm run ingredient:queue -- --from=001 --to=050 --missing-only',
    'npm run ingredient:generate -- --from=001 --to=050 --missing-only --resume',
    'npm run ingredient:approve -- --approved-only',
    'npm run ingredient:validate -- --from=001 --to=050',
    '```',
    '',
    '## Queue',
    '',
    `| Key | Korean | Status | Used by |`,
    `| --- | --- | --- | --- |`,
  ];

  for (const item of queue.items) {
    lines.push(
      `| \`${item.iconKey}\` | ${item.koreanName} | ${item.status} | ${item.usedByRecipeIds.length} |`,
    );
  }

  if (unresolved.length) {
    lines.push('', '## Unresolved aliases', '');
    for (const u of unresolved) lines.push(`- ${u}`);
  }

  lines.push('');
  fs.mkdirSync(PATHS.generatedRoot, { recursive: true });
  fs.writeFileSync(PATHS.dashboard, lines.join('\n'), 'utf8');
  return PATHS.dashboard;
}
