/**
 * Sprint RF-6 — Batch 06 Western (051–060). Production via Recipe Factory.
 */
import { PIPELINE_DRAFT_INPUTS } from '../pipeline/draftInputs';

export const BATCH_06_INPUTS = PIPELINE_DRAFT_INPUTS.filter((r) => {
  const n = Number.parseInt(r.id, 10);
  return n >= 51 && n <= 60;
});
