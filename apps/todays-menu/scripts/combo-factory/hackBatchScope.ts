/**
 * Sprint 51-B — HACK_COMBO image generation batches (18 remaining after 3 pilots).
 */
import type { ComboHackId } from '../../data/content/combos/convenienceComboHackImageKeys';

export const HACK_BATCH_1_IDS = [
  'combo_0023',
  'combo_0021',
  'combo_0015',
  'combo_0016',
  'combo_0011',
  'combo_0010',
] as const satisfies readonly ComboHackId[];

export const HACK_BATCH_2_IDS = [
  'combo_0008',
  'combo_0027',
  'combo_0028',
  'combo_0031',
  'combo_0039',
  'combo_0041',
] as const satisfies readonly ComboHackId[];

export const HACK_BATCH_3_IDS = [
  'combo_0038',
  'combo_0046',
  'combo_0047',
  'combo_0050',
  'combo_0013',
  'combo_0025',
] as const satisfies readonly ComboHackId[];

export const HACK_BATCH_MAP = {
  1: HACK_BATCH_1_IDS,
  2: HACK_BATCH_2_IDS,
  3: HACK_BATCH_3_IDS,
} as const;

export type HackBatchNumber = keyof typeof HACK_BATCH_MAP;

export function parseHackBatchArg(argv: string[]): HackBatchNumber | undefined {
  const raw = argv.find((a) => a.startsWith('--batch='))?.slice(8);
  if (!raw) return undefined;
  const n = Number(raw);
  if (n === 1 || n === 2 || n === 3) return n;
  throw new Error(`Invalid --batch=${raw} (use 1, 2, or 3)`);
}

export function hackBatchComboIds(batch: HackBatchNumber): readonly string[] {
  return HACK_BATCH_MAP[batch];
}
