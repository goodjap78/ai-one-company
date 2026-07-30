/**
 * Sprint RF-6 — Batch 09 Quick (081–090). Production via Recipe Factory.
 */
import { PIPELINE_DRAFT_INPUTS } from '../pipeline/draftInputs';

export const BATCH_09_INPUTS = PIPELINE_DRAFT_INPUTS.filter((r) => {
  const n = Number.parseInt(r.id, 10);
  return n >= 81 && n <= 90;
});
