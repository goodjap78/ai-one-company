/**
 * Canonical convenience combo component names — alias normalization for combo items.
 * Image pipeline removed; text UI uses combo item names + this catalog for validation.
 */
import type {
  ConvenienceComponentCategory,
  ConvenienceComponentEntry,
} from '../../../types/convenienceComponent';
import type { ConvenienceIllustrationIconKey } from '../../../types/convenienceIllustrationIcon';

const C = (
  key: string,
  label: string,
  aliases: string[],
  category: ConvenienceComponentCategory,
  reuseIngredientKey?: string,
  illustrationIconKey?: ConvenienceIllustrationIconKey,
): ConvenienceComponentEntry => ({
  key,
  label,
  aliases,
  category,
  reuseIngredientKey,
  illustrationIconKey,
});

/**
 * Every raw item name across CONVENIENCE_COMBOS must appear exactly once in aliases.
 * No store brand strings (CU, GS25, 세븐일레븐, 이마트24).
 */
export const CONVENIENCE_COMPONENT_CATALOG: ConvenienceComponentEntry[] = [
  C('beverage_generic', '음료', ['음료', '주스', '채소주스'], 'beverage'),
  C('coffee_drink', '커피 음료', ['커피 음료'], 'beverage'),
  C('salad_pack', '샐러드', ['샐러드', '포장샐러드'], 'vegetable', undefined, 'salad'),
  C('tofu_salad', '두부샐러드', ['두부샐러드'], 'vegetable'),
  C('cheese_slice', '슬라이스 치즈', ['슬라이스 치즈'], 'dairy', 'cheese'),
  C(
    'cup_ramen',
    '컵라면',
    ['컵라면', '라면', '매운 컵라면', '매운컵라면'],
    'noodle',
    undefined,
    'cup_ramen',
  ),
  C('triangle_kimbap', '삼각김밥', ['삼각김밥'], 'rice_dish', undefined, 'triangle_kimbap'),
  C('fruit_pack', '과일', ['과일'], 'fruit'),
  C('rice_ball', '주먹밥', ['주먹밥'], 'rice_dish'),
  C('seaweed_sheet', '김', ['김'], 'other', 'seaweed'),
  C('yogurt_cup', '요구르트', ['요구르트'], 'dairy'),
  C('soft_boiled_egg', '반숙란', ['반숙란'], 'protein'),
  C('rice_portion', '밥', ['밥'], 'rice_dish', 'rice'),
  C('cup_rice', '컵밥', ['컵밥', '즉석밥'], 'rice_dish', undefined, 'cup_rice'),
  C('sandwich', '샌드위치', ['샌드위치'], 'snack', undefined, 'sandwich'),
  C('chicken_breast', '닭가슴살', ['닭가슴살'], 'protein'),
  C(
    'sauce_packet',
    '소스',
    ['소스', '샐러드 소스', '떡볶이 소스'],
    'sauce',
  ),
  C('lunch_box', '도시락', ['도시락'], 'rice_dish', undefined, 'lunchbox'),
  C('french_fries', '감자튀김', ['감자튀김'], 'snack'),
  C('gimbap_roll', '김밥', ['김밥'], 'rice_dish'),
  C('chicken_tender', '치킨텐더', ['치킨텐더'], 'protein'),
  C('cup_noodle', '컵누들', ['컵누들'], 'noodle'),
  C('bread_loaf', '빵', ['빵'], 'snack'),
  C('milk_carton', '우유', ['우유'], 'dairy', 'milk', 'milk'),
  C('ice_cream', '아이스크림', ['아이스크림', '바닐라 아이스크림'], 'dessert'),
  C('bean_sprout_soup', '콩나물국', ['콩나물국'], 'soup'),
  C('hamburger', '햄버거', ['햄버거'], 'snack', undefined, 'hamburger'),
  C('cup_udon', '컵우동', ['컵우동', '우동컵', '즉석우동'], 'noodle', undefined, 'cup_udon'),
  C('cup_bibim_noodle', '두부비빔면', ['두부비빔면'], 'noodle'),
  C('rice_cake_snack', '떡', ['떡'], 'snack', 'rice_cake'),
  C('sundae', '순대', ['순대'], 'snack'),
  C('tteokbokki', '떡볶이', ['떡볶이', '매운 떡볶이'], 'snack'),
  C('hot_bar', '핫바', ['핫바'], 'snack', undefined, 'hot_bar'),
  C('hotdog', '핫도그', ['핫도그'], 'snack'),
  C('chicken_nugget', '치킨너겟', ['치킨너겟'], 'protein'),
  C('green_chili_pack', '청양고추', ['청양고추'], 'vegetable', 'green_chili'),
  C('spicy_stir_noodles', '매운 볶음면', ['매운 볶음면'], 'noodle'),
  C('spicy_sundae', '매운순대', ['매운순대'], 'snack'),
  C('spicy_chicken_feet', '매운닭발', ['매운닭발'], 'protein'),
  C('canned_tuna', '참치', ['참치', '참치캔'], 'protein', 'tuna'),
  C('fruit_banana', '바나나', ['바나나'], 'fruit', 'banana'),
  C('kimchi_pack', '김치', ['김치'], 'vegetable', 'kimchi'),
  C('butter_pack', '버터', ['버터'], 'dairy', 'butter'),
  C('seaweed_flakes', '김가루', ['김가루'], 'other', 'seaweed'),
  C('konjac_snack', '곤약', ['곤약'], 'snack'),
  C('nuts_pack', '견과', ['견과'], 'snack', 'peanut'),
  C('boiled_egg', '삶은계란', ['삶은계란'], 'protein', 'egg'),
  C('tofu_pack', '두부', ['두부'], 'protein', 'tofu'),
  C('cake_slice', '케이크', ['케이크'], 'dessert'),
  C('hotteok', '호떡', ['호떡'], 'dessert'),
  C('dried_pollack_soup', '북어국', ['북어국'], 'soup'),
  C('sausage', '소시지', ['소시지'], 'snack', 'sausage'),
];

const aliasToKey = new Map<string, string>();

for (const entry of CONVENIENCE_COMPONENT_CATALOG) {
  for (const alias of entry.aliases) {
    if (aliasToKey.has(alias)) {
      throw new Error(
        `Duplicate convenience component alias "${alias}" → ${aliasToKey.get(alias)} vs ${entry.key}`,
      );
    }
    aliasToKey.set(alias, entry.key);
  }
}

export function lookupConvenienceComponentAlias(
  rawName: string,
): ConvenienceComponentEntry | undefined {
  const trimmed = rawName.trim();
  const key = aliasToKey.get(trimmed);
  if (!key) return undefined;
  return CONVENIENCE_COMPONENT_CATALOG.find((e) => e.key === key);
}
