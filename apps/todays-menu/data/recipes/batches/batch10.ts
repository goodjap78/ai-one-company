/**
 * Sprint RF-6 — Batch 10 Korean classics II (091–100). Production via Recipe Factory.
 */
import { PIPELINE_DRAFT_INPUTS } from '../pipeline/draftInputs';

export const BATCH_10_INPUTS = PIPELINE_DRAFT_INPUTS.filter((r) => {
  const n = Number.parseInt(r.id, 10);
  return n >= 91 && n <= 100;
});
