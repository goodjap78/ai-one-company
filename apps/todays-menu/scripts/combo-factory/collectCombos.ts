/**
 * Collect pilot convenience combo image targets (3 HACK_COMBO only).
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  COMBO_HACK_COMBO_IDS,
  COMBO_HACK_IMAGE_KEY_MAP,
} from '../../data/content/combos/convenienceComboHackImageKeys';
import {
  COMBO_IMAGE_PILOT_IDS,
  COMBO_IMAGE_PILOT_MAP,
} from '../../data/content/combos/convenienceComboImagePilots';
import { listAllConvenienceCombos } from '../../services/convenience/convenienceComboCatalog';
import { PATHS } from './config';
import type { ComboManifest, ComboManifestEntry } from './types';

function parseRequireKeys(registryPath: string): Set<string> {
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

function classifyStatus(input: {
  fileExists: boolean;
  registryHasKey: boolean;
}): ComboManifestEntry['status'] {
  if (input.fileExists && input.registryHasKey) return 'approved';
  if (input.fileExists && !input.registryHasKey) return 'existing_unregistered';
  return 'queued';
}

function buildManifestEntry(
  combo: ReturnType<typeof listAllConvenienceCombos>[number],
  imageKey: string,
  registryKeys: Set<string>,
): ComboManifestEntry {
  const filename = `${imageKey}.jpg`;
  const abs = path.join(PATHS.comboAssetsDir, filename);
  const fileExists = fs.existsSync(abs) && fs.statSync(abs).isFile();
  const registryHasKey = registryKeys.has(imageKey);
  return {
    comboId: combo.id,
    imageKey,
    title: combo.title,
    comboKind: combo.comboKind,
    items: combo.items.map((i) => i.name),
    transformationName: combo.transformationName,
    assemblyGuide: combo.assemblyGuide,
    outputFilename: filename,
    promptFile: `generated/combo-factory/prompts/${imageKey}.md`,
    status: classifyStatus({ fileExists, registryHasKey }),
    fileExists,
    registryHasKey,
  };
}

export function collectComboManifest(): ComboManifest {
  const all = listAllConvenienceCombos();
  const registryKeys = parseRequireKeys(PATHS.comboRegistry);
  const items: ComboManifestEntry[] = [];

  for (const comboId of COMBO_IMAGE_PILOT_IDS) {
    const combo = all.find((c) => c.id === comboId);
    if (!combo) {
      throw new Error(`Pilot combo missing from catalog: ${comboId}`);
    }
    const imageKey = COMBO_IMAGE_PILOT_MAP[comboId];
    if (combo.imageKey && combo.imageKey !== imageKey) {
      throw new Error(
        `imageKey mismatch for ${comboId}: catalog=${combo.imageKey} pilot=${imageKey}`,
      );
    }
    items.push(buildManifestEntry(combo, imageKey, registryKeys));
  }

  return {
    generatedAt: new Date().toISOString(),
    sprint: '48-C',
    pilotOnly: true,
    scope: 'pilot',
    total: items.length,
    items,
  };
}

/** All 21 HACK_COMBO targets for Sprint 51-B factory scope. */
export function collectHackComboManifest(): ComboManifest {
  const all = listAllConvenienceCombos();
  const registryKeys = parseRequireKeys(PATHS.comboRegistry);
  const items: ComboManifestEntry[] = [];

  for (const comboId of COMBO_HACK_COMBO_IDS) {
    const combo = all.find((c) => c.id === comboId);
    if (!combo) {
      throw new Error(`HACK combo missing from catalog: ${comboId}`);
    }
    if (combo.comboKind !== 'hack_combo') {
      throw new Error(`Expected hack_combo for ${comboId}, got ${combo.comboKind}`);
    }
    const imageKey = COMBO_HACK_IMAGE_KEY_MAP[comboId];
    if (combo.imageKey && combo.imageKey !== imageKey) {
      throw new Error(
        `imageKey mismatch for ${comboId}: catalog=${combo.imageKey} hack=${imageKey}`,
      );
    }
    items.push(buildManifestEntry(combo, imageKey, registryKeys));
  }

  return {
    generatedAt: new Date().toISOString(),
    sprint: '51-B',
    scope: 'hack-all',
    total: items.length,
    items,
  };
}

export function writeComboManifest(manifest: ComboManifest): string {
  fs.mkdirSync(PATHS.generatedRoot, { recursive: true });
  fs.writeFileSync(PATHS.manifest, JSON.stringify(manifest, null, 2), 'utf8');
  return PATHS.manifest;
}

export function loadComboManifest(): ComboManifest | null {
  if (!fs.existsSync(PATHS.manifest)) return null;
  return JSON.parse(fs.readFileSync(PATHS.manifest, 'utf8')) as ComboManifest;
}
