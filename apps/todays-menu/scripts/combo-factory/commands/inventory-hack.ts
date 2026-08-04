/**
 * npm run combo:inventory-hack
 * Full HACK_COMBO inventory audit (no queue changes).
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  COMBO_HACK_COMBO_IDS,
  COMBO_HACK_IMAGE_KEY_MAP,
  COMBO_HACK_PILOT_IDS,
} from '../../../data/content/combos/convenienceComboHackImageKeys';
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
  const pilots = new Set<string>(COMBO_HACK_PILOT_IDS);

  const rows = COMBO_HACK_COMBO_IDS.map((comboId) => {
    const combo = all.find((c) => c.id === comboId)!;
    const imageKey = COMBO_HACK_IMAGE_KEY_MAP[comboId];
    const prodAbs = path.join(PATHS.comboAssetsDir, `${imageKey}.jpg`);
    const prodExists = fs.existsSync(prodAbs) && fs.statSync(prodAbs).isFile();
    return {
      comboId,
      title: combo.title,
      transformationName: combo.transformationName ?? '',
      items: combo.items.map((i) => i.name),
      assemblyGuide: combo.assemblyGuide ?? [],
      whyItWorks: combo.whyItWorks ?? '',
      imageKey,
      productionJpgExists: prodExists,
      registryKeyExists: registryKeys.has(imageKey),
      enrichmentImageKey: combo.imageKey ?? null,
      isHackCombo: combo.comboKind === 'hack_combo',
      isPilot: pilots.has(comboId),
      remainingAfterPilots: !pilots.has(comboId),
    };
  });

  const remaining = rows.filter((r) => r.remainingAfterPilots);
  const out = path.join(PATHS.generatedRoot, 'hack-inventory.json');
  fs.mkdirSync(PATHS.generatedRoot, { recursive: true });
  fs.writeFileSync(
    out,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        sprint: '51-B',
        totalHack: rows.length,
        pilotCount: pilots.size,
        remainingCount: remaining.length,
        rows,
      },
      null,
      2,
    ),
    'utf8',
  );

  console.log('\n========== combo:inventory-hack ==========');
  console.log(`HACK_COMBO total: ${rows.length}`);
  console.log(`Pilots (production): ${pilots.size}`);
  console.log(`Remaining: ${remaining.length}`);
  console.log(`Inventory → ${path.relative(PATHS.appRoot, out)}`);
  console.log('==========================================\n');
}

main();
