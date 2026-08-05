/**
 * npm run combo:inventory-easy-set
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  COMBO_EASY_SET_COMBO_IDS,
  COMBO_EASY_SET_IMAGE_KEY_MAP,
} from '../../../data/content/combos/convenienceComboEasySetImageKeys';
import { listAllConvenienceCombos } from '../../../services/convenience/convenienceComboCatalog';
import { PATHS } from '../config';

function parseRegistryKeys(registryPath: string): Set<string> {
  if (!fs.existsSync(registryPath)) return new Set();
  const source = fs.readFileSync(registryPath, 'utf8');
  const block = source.match(
    /export const CONVENIENCE_COMBO_IMAGE_ASSETS[^=]*=\s*\{([\s\S]*?)\n\};/,
  );
  if (!block) return new Set();
  const keys = new Set<string>();
  const re = /^\s*([a-z][a-z0-9_]*)\s*:\s*require\(/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block[1]))) keys.add(m[1]);
  return keys;
}

function main(): void {
  const all = listAllConvenienceCombos();
  const registryKeys = parseRegistryKeys(PATHS.comboRegistry);
  const imageKeys = Object.values(COMBO_EASY_SET_IMAGE_KEY_MAP);
  const duplicateKeys = imageKeys.filter(
    (k, i) => imageKeys.indexOf(k) !== i,
  );

  const rows = COMBO_EASY_SET_COMBO_IDS.map((comboId) => {
    const combo = all.find((c) => c.id === comboId)!;
    const imageKey = COMBO_EASY_SET_IMAGE_KEY_MAP[comboId];
    const prodAbs = path.join(PATHS.comboAssetsDir, `${imageKey}.jpg`);
    const prodExists = fs.existsSync(prodAbs) && fs.statSync(prodAbs).isFile();
    return {
      comboId,
      title: combo.title,
      items: combo.items.map((i) => i.name),
      description: combo.description,
      whyItWorks: combo.whyItWorks ?? '',
      estimatedPriceRange: combo.estimatedPriceRange,
      prepTimeMinutes: combo.prepTimeMinutes,
      tags: combo.tags,
      comboKind: combo.comboKind,
      imageKey,
      enrichmentImageKey: combo.imageKey ?? null,
      productionJpgExists: prodExists,
      registryKeyExists: registryKeys.has(imageKey),
    };
  });

  const out = path.join(PATHS.generatedRoot, 'easy-set-inventory.json');
  fs.mkdirSync(PATHS.generatedRoot, { recursive: true });
  fs.writeFileSync(
    out,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        sprint: '53',
        totalEasySet: rows.length,
        duplicateImageKeys: duplicateKeys,
        rows,
      },
      null,
      2,
    ),
    'utf8',
  );

  console.log('\n========== combo:inventory-easy-set ==========');
  console.log(`EASY_SET total: ${rows.length}`);
  console.log(`Duplicate imageKeys: ${duplicateKeys.length}`);
  console.log(`Inventory → ${path.relative(PATHS.appRoot, out)}`);
  console.log('==============================================\n');
}

main();
