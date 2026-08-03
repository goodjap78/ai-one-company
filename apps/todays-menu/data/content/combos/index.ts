import { CONVENIENCE_COMBO_BATCH_01 } from './convenienceComboBatch01';
import { CONVENIENCE_COMBO_BATCH_02 } from './convenienceComboBatch02';
import { enrichConvenienceCombos } from './convenienceComboEnrichment';

export const CONVENIENCE_COMBOS = enrichConvenienceCombos([
  ...CONVENIENCE_COMBO_BATCH_01,
  ...CONVENIENCE_COMBO_BATCH_02,
]);
