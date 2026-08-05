/**
 * Sprint 53 — EASY_SET hero image generation batches (29 total).
 */
import type { ComboEasySetId } from '../../data/content/combos/convenienceComboEasySetImageKeys';

/** Pilot batch 1 — six combos covering distinct EASY_SET types. */
export const EASY_SET_BATCH_1_IDS = [
  'combo_0002',
  'combo_0017',
  'combo_0004',
  'combo_0040',
  'combo_0005',
  'combo_0045',
] as const satisfies readonly ComboEasySetId[];

export const EASY_SET_BATCH_2_IDS = [
  'combo_0003',
  'combo_0006',
  'combo_0007',
  'combo_0009',
  'combo_0012',
  'combo_0014',
] as const satisfies readonly ComboEasySetId[];

export const EASY_SET_BATCH_3_IDS = [
  'combo_0018',
  'combo_0019',
  'combo_0022',
  'combo_0024',
  'combo_0026',
  'combo_0029',
] as const satisfies readonly ComboEasySetId[];

export const EASY_SET_BATCH_4_IDS = [
  'combo_0030',
  'combo_0032',
  'combo_0033',
  'combo_0034',
  'combo_0035',
  'combo_0036',
] as const satisfies readonly ComboEasySetId[];

export const EASY_SET_BATCH_5_IDS = [
  'combo_0037',
  'combo_0042',
  'combo_0043',
  'combo_0048',
  'combo_0049',
] as const satisfies readonly ComboEasySetId[];

export const EASY_SET_BATCH_MAP = {
  1: EASY_SET_BATCH_1_IDS,
  2: EASY_SET_BATCH_2_IDS,
  3: EASY_SET_BATCH_3_IDS,
  4: EASY_SET_BATCH_4_IDS,
  5: EASY_SET_BATCH_5_IDS,
} as const;

export type EasySetBatchNumber = keyof typeof EASY_SET_BATCH_MAP;

export function parseEasySetBatchArg(argv: string[]): EasySetBatchNumber | undefined {
  const raw = argv.find((a) => a.startsWith('--batch='))?.slice(8);
  if (!raw) return undefined;
  const n = Number(raw);
  if (n >= 1 && n <= 5 && n in EASY_SET_BATCH_MAP) return n as EasySetBatchNumber;
  throw new Error(`Invalid --batch=${raw} (use 1–5)`);
}

export function easySetBatchComboIds(batch: EasySetBatchNumber): readonly string[] {
  return EASY_SET_BATCH_MAP[batch];
}
