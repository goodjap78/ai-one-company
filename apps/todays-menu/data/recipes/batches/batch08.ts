/**
 * Sprint RF-6 — Batch 08 Healthy (071–080). Production via Recipe Factory.
 */
import { PIPELINE_DRAFT_INPUTS } from '../pipeline/draftInputs';

export const BATCH_08_INPUTS = PIPELINE_DRAFT_INPUTS.filter((r) => {
  const n = Number.parseInt(r.id, 10);
  return n >= 71 && n <= 80;
});
