/**
 * Batch → recipe id ranges for recipe-assets CLI filtering.
 * Does not change recipe data — selection only.
 */

export const BATCH_RECIPE_IDS: Record<string, readonly string[]> = {
  '01': ['001', '002', '003', '004', '005', '006', '007', '008', '009', '010'],
  '02': ['011', '012', '013', '014', '015', '016', '017', '018', '019', '020'],
  '03': ['021', '022', '023', '024', '025', '026', '027', '028', '029', '030'],
  '04': ['031', '032', '033', '034', '035', '036', '037', '038', '039', '040'],
  '05': ['041', '042', '043', '044', '045', '046', '047', '048', '049', '050'],
  '06': ['051', '052', '053', '054', '055', '056', '057', '058', '059', '060'],
  '07': ['061', '062', '063', '064', '065', '066', '067', '068', '069', '070'],
  '08': ['071', '072', '073', '074', '075', '076', '077', '078', '079', '080'],
  '09': ['081', '082', '083', '084', '085', '086', '087', '088', '089', '090'],
  '10': ['091', '092', '093', '094', '095', '096', '097', '098', '099', '100'],
};

/** Normalize `--batch=2` / `--batch=02` → `02`. */
export function normalizeBatchId(raw: string): string {
  const n = Number.parseInt(raw.trim(), 10);
  if (!Number.isFinite(n) || n < 1) {
    throw new Error(`Invalid batch id: ${raw}`);
  }
  return String(n).padStart(2, '0');
}

export function resolveBatchRecipeIds(batchRaw: string): string[] {
  const batch = normalizeBatchId(batchRaw);
  const ids = BATCH_RECIPE_IDS[batch];
  if (!ids) {
    throw new Error(
      `Unknown batch "${batchRaw}". Known: ${Object.keys(BATCH_RECIPE_IDS).join(', ')}`,
    );
  }
  return [...ids];
}

/**
 * RF-2A required hero filenames for Batch 02 asset production.
 * Independent of current recipe.heroImageKey (recipe data unchanged).
 */
export const BATCH_02_REQUIRED_HERO_FILENAMES: ReadonlyArray<{
  id: string;
  name: string;
  requiredFilename: string;
}> = [
  { id: '011', name: '순두부찌개', requiredFilename: 'soondubu_stew.jpg' },
  { id: '012', name: '닭볶음탕', requiredFilename: 'dakbokkeumtang.jpg' },
  { id: '013', name: '오징어볶음', requiredFilename: 'squid_stir_fry.jpg' },
  { id: '014', name: '갈비탕', requiredFilename: 'galbitang.jpg' },
  { id: '015', name: '육개장', requiredFilename: 'yukgaejang.jpg' },
  { id: '016', name: '미역국', requiredFilename: 'seaweed_soup.jpg' },
  { id: '017', name: '떡국', requiredFilename: 'tteokguk.jpg' },
  { id: '018', name: '감자조림', requiredFilename: 'braised_potatoes.jpg' },
  { id: '019', name: '계란말이', requiredFilename: 'rolled_omelette.jpg' },
  { id: '020', name: '소불고기덮밥', requiredFilename: 'beef_bulgogi_rice_bowl.jpg' },
];
