/**
 * Sprint RF-6 — Batch 07 Snack (061–070). Production via Recipe Factory.
 */
import { PIPELINE_DRAFT_INPUTS } from '../pipeline/draftInputs';

export const BATCH_07_INPUTS = PIPELINE_DRAFT_INPUTS.filter((r) => {
  const n = Number.parseInt(r.id, 10);
  return n >= 61 && n <= 70;
});
