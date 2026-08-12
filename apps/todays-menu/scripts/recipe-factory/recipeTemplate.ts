/**
 * Sprint RF-1 — Recipe Factory CLI template facade.
 * Reuses the production master template (no duplicated Recipe types).
 */
export {
  createHankkiRecipe,
  createHankkiRecipeBatch,
  type HankkiRecipeInput,
} from '../../data/recipes/recipeMasterTemplate';

export type { Recipe } from '../../data/recipes/types';

/** Batch 01 expected catalog (must match live HANKKI_RECIPES). */
export const BATCH_01_EXPECTED = [
  { id: '001', name: '제육볶음' },
  { id: '002', name: '계란볶음밥' },
  { id: '003', name: '김치찌개' },
  { id: '004', name: '된장찌개' },
  { id: '005', name: '비빔밥' },
  { id: '006', name: '불고기' },
  { id: '007', name: '김치볶음밥' },
  { id: '008', name: '카레라이스' },
  { id: '009', name: '돈까스' },
  { id: '010', name: '닭갈비' },
] as const;

export const BATCH_02_PLAN_EXPECTED = [
  { id: '011', name: '순두부찌개', heroImageKey: 'sundubu_jjigae' },
  { id: '012', name: '닭볶음탕', heroImageKey: 'dakbokkeumtang' },
  { id: '013', name: '오징어볶음', heroImageKey: 'ojingeo_bokkeum' },
  { id: '014', name: '갈비탕', heroImageKey: 'galbitang' },
  { id: '015', name: '육개장', heroImageKey: 'yukgaejang' },
  { id: '016', name: '미역국', heroImageKey: 'miyeok_guk' },
  { id: '017', name: '떡국', heroImageKey: 'tteokguk' },
  { id: '018', name: '감자조림', heroImageKey: 'gamja_jorim' },
  { id: '019', name: '계란말이', heroImageKey: 'egg_roll' },
  { id: '020', name: '소불고기덮밥', heroImageKey: 'beef_bulgogi_don' },
] as const;

export const BATCH_03_EXPECTED = [
  { id: '021', name: '고등어구이', heroImageKey: 'godeungeo_gui' },
  { id: '022', name: '삼겹살구이', heroImageKey: 'samgyeopsal_gui' },
  { id: '023', name: '돼지불백', heroImageKey: 'dwaeji_bulbaek' },
  { id: '024', name: '부대찌개', heroImageKey: 'budae_jjigae' },
  { id: '025', name: '청국장찌개', heroImageKey: 'cheonggukjang_jjigae' },
  { id: '026', name: '소고기무국', heroImageKey: 'sogogi_muguk' },
  { id: '027', name: '북엇국', heroImageKey: 'bugeo_guk' },
  { id: '028', name: '콩나물국', heroImageKey: 'kongnamul_guk' },
  { id: '029', name: '두부조림', heroImageKey: 'dubu_jorim' },
  { id: '030', name: '멸치볶음', heroImageKey: 'myeolchi_bokkeum' },
] as const;

export const BATCH_04_EXPECTED = [
  { id: '031', name: '오므라이스', heroImageKey: 'omurice' },
  { id: '032', name: '떡갈비', heroImageKey: 'tteokgalbi' },
  { id: '033', name: '갈치조림', heroImageKey: 'galchi_jorim' },
  { id: '034', name: '닭개장', heroImageKey: 'dakgaejang' },
  { id: '035', name: '감자탕', heroImageKey: 'gamjatang' },
  { id: '036', name: '잔치국수', heroImageKey: 'janchi_guksu' },
  { id: '037', name: '비빔국수', heroImageKey: 'bibim_guksu' },
  { id: '038', name: '냉면', heroImageKey: 'naengmyeon' },
  { id: '039', name: '잡채', heroImageKey: 'japchae' },
  { id: '040', name: '김밥', heroImageKey: 'gimbap' },
] as const;

export const BATCH_05_EXPECTED = [
  { id: '041', name: '라면', heroImageKey: 'ramyeon' },
  { id: '042', name: '김치라면', heroImageKey: 'kimchi_ramyeon' },
  { id: '043', name: '치즈라면', heroImageKey: 'cheese_ramyeon' },
  { id: '044', name: '떡볶이', heroImageKey: 'tteokbokki' },
  { id: '045', name: '라볶이', heroImageKey: 'rabokki' },
  { id: '046', name: '순대볶음', heroImageKey: 'sundae_bokkeum' },
  { id: '047', name: '순대국', heroImageKey: 'sundae_guk' },
  { id: '048', name: '칼국수', heroImageKey: 'kalguksu' },
  { id: '049', name: '수제비', heroImageKey: 'sujebi' },
  { id: '050', name: '해물파전', heroImageKey: 'haemul_pajeon' },
] as const;
