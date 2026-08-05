/**
 * Convenience combos QA — Sprint 48-B.
 * Run: npm run test:convenience-combos
 */
import './ingredient-factory/nodePngRequireStub';
import fs from 'node:fs';
import path from 'node:path';
import {
  resolveConvenienceCardWidth,
  resolveConvenienceContentMaxWidth,
  resolveConvenienceGridColumns,
} from '../components/convenience/convenienceGridLayout';
import {
  lookupConvenienceComponentAlias,
} from '../data/content/combos/convenienceComponentCatalog';
import {
  resolveComboItemCardWidth,
  resolveComboItemLayoutMode,
  resolveConvenienceComboItem,
  resolveConvenienceComboItems,
} from '../services/convenience/resolveConvenienceComboItems';
import { MOBILE_MAX_WIDTH, MOBILE_SCREEN_PADDING } from '../constants/mobileLayout';
import {
  COMBO_SITUATION_TAG,
  countCombosByKind,
  countCombosBySituationTag,
  countCombosByStoreScope,
  filterConvenienceCombos,
  findSimilarConvenienceCombos,
  formatComboItemsPreview,
  formatEstimatedPriceRange,
  getConvenienceComboById,
  listAllConvenienceCombos,
  parseEstimatedPriceMin,
  resolveAvailabilityDisclaimer,
  sortConvenienceCombos,
} from '../services/convenience/convenienceComboCatalog';
import {
  CONVENIENCE_FAVORITES_KEY,
  addConvenienceFavorite,
  getConvenienceFavoriteIds,
  getConvenienceFavorites,
  removeConvenienceFavorite,
} from '../services/convenience/convenienceFavoritesStorage';
import type { ConvenienceCombo } from '../data/content/types/convenienceCombo';
import { COMBO_IMAGE_PILOT_IDS } from '../data/content/combos/convenienceComboImagePilots';
import { COMBO_HACK_COMBO_IDS } from '../data/content/combos/convenienceComboHackImageKeys';
import {
  EASY_SET_BATCH_1_IDS,
  EASY_SET_BATCH_2_IDS,
  EASY_SET_BATCH_3_IDS,
  EASY_SET_BATCH_4_IDS,
  EASY_SET_BATCH_5_IDS,
} from './combo-factory/easySetBatchScope';
import { convenienceCombosCopy } from '../constants/convenienceCombosCopy';

const memoryStore = new Map<string, string>();

async function mockAsyncStorage(): Promise<void> {
  const mod = await import('@react-native-async-storage/async-storage');
  const storage = mod.default;
  (storage as { setItem: typeof storage.setItem }).setItem = async (key: string, value: string) => {
    memoryStore.set(key, value);
  };
  (storage as { getItem: typeof storage.getItem }).getItem = async (key: string) =>
    memoryStore.get(key) ?? null;
  (storage as { removeItem: typeof storage.removeItem }).removeItem = async (key: string) => {
    memoryStore.delete(key);
  };
}

let failed = 0;

function assert(condition: boolean, message: string): void {
  if (!condition) {
    failed += 1;
    console.error(`❌ ${message}`);
    throw new Error(message);
  }
  console.log(`✅ ${message}`);
}

const ALL = listAllConvenienceCombos();

function comboWithCalories(): ConvenienceCombo {
  const base = ALL[0]!;
  return { ...base, id: 'combo_test_calories', calories: 450 };
}

async function main(): Promise<void> {
  console.log('Convenience Combos QA — start\n');

  assert(ALL.length === 50, '50개 전체 로드');

  const kindCounts = countCombosByKind();
  assert(kindCounts.hack_combo > 0, 'HACK_COMBO 존재');
  assert(kindCounts.easy_set > 0, 'EASY_SET 분류');
  assert(ALL.every((c) => c.comboKind === 'hack_combo' || c.comboKind === 'easy_set'), 'comboKind 누락 0');

  const bannedTypos = ['퍼롯', '퍼록체'];
  for (const combo of ALL) {
    const blob = [combo.title, combo.description, combo.transformationName ?? '', combo.whyItWorks].join('');
    assert(!bannedTypos.some((t) => blob.includes(t)), `오타 없음: ${combo.id}`);
  }

  const unrealisticPatterns = [/프라이해/, /팬에 계란/, /계란을 풀어 넣/];
  for (const combo of ALL) {
    const guide = combo.assemblyGuide.join(' ');
    const unrealistic = unrealisticPatterns.some((re) => re.test(guide));
    assert(!unrealistic, `현실적 조리법: ${combo.id}`);
  }

  const titles = new Set<string>();
  for (const combo of ALL) {
    const key = combo.title.trim();
    assert(!titles.has(key), `제목 중복 없음: ${key}`);
    titles.add(key);
  }

  const semanticKeys = new Set<string>();
  for (const combo of ALL) {
    const itemKey = combo.items.map((i) => i.name).sort().join('|');
    const semantic = `${combo.comboKind}:${combo.transformationName ?? combo.title}:${itemKey}`;
    assert(!semanticKeys.has(semantic), `의미 중복 없음: ${combo.id}`);
    semanticKeys.add(semantic);
  }

  const hacks = ALL.filter((c) => c.comboKind === 'hack_combo');
  assert(
    hacks.every((c) => c.whyItWorks.trim().length > 0),
    'HACK_COMBO whyItWorks 존재',
  );
  assert(
    hacks.every((c) => c.assemblyGuide.length >= 2),
    'HACK_COMBO assemblyGuide 2단계 이상',
  );
  assert(
    hacks.every((c) => Boolean(c.transformationName?.trim())),
    'HACK_COMBO transformationName 존재',
  );

  const hackFilter = filterConvenienceCombos({ kindFilter: 'hack_combo' });
  assert(hackFilter.length === kindCounts.hack_combo, '꿀조합 필터');
  const easyFilter = filterConvenienceCombos({ kindFilter: 'easy_set' });
  assert(easyFilter.length === kindCounts.easy_set, '간편 세트 필터');

  const hearty = filterConvenienceCombos({ situationFilter: 'hearty' });
  assert(hearty.length > 0, '상황 필터 hearty 결과');
  assert(
    hearty.every((c) => c.tags.includes(COMBO_SITUATION_TAG.hearty)),
    '상황 필터별 결과',
  );

  const common = filterConvenienceCombos({ storeFilter: 'common' });
  assert(common.length === 50, '편의점 공통 필터');

  const counts = countCombosByStoreScope();
  assert(counts.cu === 0, 'cu count 0');
  assert(filterConvenienceCombos({ storeFilter: 'cu' }).length === 0, '개별 편의점 0건');

  const priceSorted = sortConvenienceCombos(ALL, 'price_low');
  const mins = priceSorted.map((c) => parseEstimatedPriceMin(c.estimatedPriceRange) ?? 0);
  for (let i = 1; i < mins.length; i++) {
    assert(mins[i] >= mins[i - 1], '가격 낮은 순 정렬');
  }

  const prepSorted = sortConvenienceCombos(ALL, 'prep_fast');
  for (let i = 1; i < prepSorted.length; i++) {
    assert(
      prepSorted[i].prepTimeMinutes >= prepSorted[i - 1].prepTimeMinutes,
      '준비 시간 순 정렬',
    );
  }

  const preview = formatComboItemsPreview(ALL[0]!.items);
  assert(preview.visible.length <= 3, '카드 items preview');
  const price = formatEstimatedPriceRange(ALL[0]!.estimatedPriceRange);
  assert(price.includes('약'), '카드 가격 approximate');

  const first = ALL[0]!;
  assert(Boolean(getConvenienceComboById(first.id)), '상세 라우트 id resolve');
  const routeFile = path.join(__dirname, '../app/convenience-combos/[id].tsx');
  assert(fs.existsSync(routeFile), '상세 라우트 파일');

  assert(getConvenienceComboById('combo_invalid') == null, '잘못된 id');

  assert(ALL.some((c) => c.assemblyGuide.length > 0), 'assemblyGuide 존재');
  assert(ALL.every((c) => c.calories == null), 'calories null in catalog');
  assert(comboWithCalories().calories === 450, 'calories 존재 시 표시 로직');

  await mockAsyncStorage();
  memoryStore.clear();
  const favId = ALL[0]!.id;
  assert(await addConvenienceFavorite(favId), '즐겨찾기 추가');
  assert((await getConvenienceFavoriteIds()).includes(favId), '즐겨찾기 id 저장');

  const removeId = ALL[1]!.id;
  await addConvenienceFavorite(removeId);
  await removeConvenienceFavorite(removeId);
  assert(!(await getConvenienceFavoriteIds()).includes(removeId), '즐겨찾기 해제');

  const restoreId = ALL[2]!.id;
  memoryStore.set(
    CONVENIENCE_FAVORITES_KEY,
    JSON.stringify({
      version: 1,
      items: [{ comboId: restoreId, savedAt: '2026-01-01T00:00:00.000Z' }],
    }),
  );
  assert(
    (await getConvenienceFavorites()).items.some((i) => i.comboId === restoreId),
    '즐겨찾기 복원',
  );

  memoryStore.clear();
  const dupId = ALL[3]!.id;
  await addConvenienceFavorite(dupId);
  await addConvenienceFavorite(dupId);
  assert(
    (await getConvenienceFavorites()).items.filter((i) => i.comboId === dupId).length === 1,
    '중복 저장 방지',
  );

  const favSet = new Set([ALL[0]!.id, ALL[1]!.id]);
  assert(
    filterConvenienceCombos({ favoriteIds: favSet, favoritesOnly: true }).length === 2,
    '즐겨찾기만 보기',
  );

  const base = ALL.find((c) => c.tags.includes(COMBO_SITUATION_TAG.lateNight))!;
  const similar = findSimilarConvenienceCombos(base, 3);
  assert(similar.length <= 3, '비슷한 조합 최대 3개');
  assert(!similar.some((c) => c.id === base.id), '현재 조합 제외');

  assert(
    ALL.every((c) => resolveAvailabilityDisclaimer(c).length > 0),
    'availability disclaimer resolve',
  );
  assert(
    resolveAvailabilityDisclaimer(ALL[0]!) === convenienceCombosCopy.priceDisclaimer,
    'fallback disclaimer',
  );

  const detailSource = fs.readFileSync(
    path.join(__dirname, '../components/convenience/ConvenienceComboDetailScreen.tsx'),
    'utf8',
  );
  assert(detailSource.includes('resolveAvailabilityDisclaimer'), 'detail single disclaimer helper');
  assert(
    !detailSource.includes('combo.availabilityNote'),
    'detail availabilityNote 직접 출력 제거',
  );
  assert(!detailSource.includes('priceDisclaimer'), 'detail priceDisclaimer 중복 출력 제거');

  const fridgeSource = fs.readFileSync(
    path.join(__dirname, '../services/fridge/buildFridgeRaidCandidates.ts'),
    'utf8',
  );
  assert(!fridgeSource.includes('convenienceCombo'), '냉장고 털기 회귀 없음');

  const homeSource = fs.readFileSync(
    path.join(__dirname, '../components/home/HomeScreen.tsx'),
    'utf8',
  );
  assert(homeSource.includes('/convenience-combos'), '홈 편의점 진입');

  const indexRoute = path.join(__dirname, '../app/convenience-combos/index.tsx');
  const indexSource = fs.readFileSync(indexRoute, 'utf8');
  assert(
    indexSource.includes('ConvenienceComboRecommendationScreen'),
    'index 추천형 화면',
  );
  assert(fs.existsSync(path.join(__dirname, '../app/convenience-combos/all.tsx')), 'all route');

  assert(detailSource.includes('summaryThumb'), 'detail summary thumbnail');
  assert(!detailSource.includes('detailHeroImage'), 'detail large hero removed');
  assert(parseEstimatedPriceMin({ min: '3500', max: 5000 }) === 3500, '가격 파싱 string');
  assert(parseEstimatedPriceMin({ min: 'bad' }) == null, '가격 파싱 실패');

  const tags = countCombosBySituationTag();
  assert(tags[COMBO_SITUATION_TAG.hearty] > 0, '상황 집계');
  assert(countCombosByStoreScope().all === 50, '편의점 집계');

  assert(resolveConvenienceGridColumns(390) === 1, '390px → 1열');
  assert(resolveConvenienceGridColumns(768) === 2, '768px → 2열');
  assert(resolveConvenienceGridColumns(1024) === 3, '1024px → 3열');
  assert(resolveConvenienceGridColumns(1440) === 4, '1440px → 4열');
  assert(resolveConvenienceContentMaxWidth(390, 1) <= 430, 'mobile max width');
  assert(resolveConvenienceContentMaxWidth(1440, 4) > 430, 'desktop widens frame');
  assert(resolveConvenienceCardWidth(1024, 3) > 200, 'card width at 3-col');

  const cardSource = fs.readFileSync(
    path.join(__dirname, '../components/convenience/ConvenienceComboCard.tsx'),
    'utf8',
  );
  assert(cardSource.includes('BODY_MIN_HEIGHT'), 'card body min height');
  assert(cardSource.includes('resolveConvenienceCardHeroHeight'), 'responsive hero height');
  assert(cardSource.includes('hasDistinctTransformation'), 'card title 중복 표시 방지');
  assert(detailSource.includes('whyItWorks'), 'detail whyItWorks retained');
  assert(cardSource.includes('numberOfLines={DESC_LINES}'), 'description line limit');

  assert(detailSource.includes('assemblyGuide'), 'detail assemblyGuide retained');
  assert(detailSource.includes('hasDistinctTransformation'), 'detail title 중복 표시 방지');

  const withImageKey = ALL.filter((c) => c.imageKey);
  const hackCombos = ALL.filter((c) => c.comboKind === 'hack_combo');
  const easySets = ALL.filter((c) => c.comboKind === 'easy_set');
  const easySetsWithImage = easySets.filter((c) => c.imageKey);
  assert(withImageKey.length === 50, 'HACK+EASY_SET imageKey 50개');
  assert(hackCombos.length === 21, 'HACK_COMBO 21개');
  assert(
    hackCombos.every((c) => Boolean(c.imageKey)),
    '모든 HACK_COMBO imageKey 존재',
  );
  assert(easySetsWithImage.length === 29, 'EASY_SET production imageKey 29개');
  assert(
    easySets.filter((c) => !c.imageKey).length === 0,
    'EASY_SET imageKey 없음 0개',
  );
  for (const comboId of EASY_SET_BATCH_1_IDS) {
    const combo = getConvenienceComboById(comboId);
    assert(Boolean(combo?.imageKey), `easy_set batch1 ${comboId} imageKey`);
  }
  for (const comboId of EASY_SET_BATCH_2_IDS) {
    const combo = getConvenienceComboById(comboId);
    assert(Boolean(combo?.imageKey), `easy_set batch2 ${comboId} imageKey`);
  }
  for (const comboId of EASY_SET_BATCH_3_IDS) {
    const combo = getConvenienceComboById(comboId);
    assert(Boolean(combo?.imageKey), `easy_set batch3 ${comboId} imageKey`);
  }
  for (const comboId of EASY_SET_BATCH_4_IDS) {
    const combo = getConvenienceComboById(comboId);
    assert(Boolean(combo?.imageKey), `easy_set batch4 ${comboId} imageKey`);
  }
  for (const comboId of EASY_SET_BATCH_5_IDS) {
    const combo = getConvenienceComboById(comboId);
    assert(Boolean(combo?.imageKey), `easy_set batch5 ${comboId} imageKey`);
  }
  for (const comboId of COMBO_HACK_COMBO_IDS) {
    const combo = getConvenienceComboById(comboId);
    assert(Boolean(combo?.imageKey), `hack ${comboId} imageKey`);
  }
  const combo20 = getConvenienceComboById('combo_0020')!;
  assert(
    combo20.imageKey === 'spicy_cheese_stir_noodles_combo',
    'combo_0020 imageKey',
  );
  const registrySource = fs.readFileSync(
    path.join(__dirname, '../services/images/convenienceComboImageAssets.ts'),
    'utf8',
  );
  for (const comboId of COMBO_HACK_COMBO_IDS) {
    const combo = getConvenienceComboById(comboId)!;
    const key = combo.imageKey!;
    assert(registrySource.includes(key), `registry require ${key}`);
    const productionPath = path.join(
      __dirname,
      '../assets/convenience-combos',
      `${key}.jpg`,
    );
    assert(fs.existsSync(productionPath), `production JPG ${key}`);
  }
  for (const comboId of EASY_SET_BATCH_1_IDS) {
    const combo = getConvenienceComboById(comboId)!;
    const key = combo.imageKey!;
    assert(registrySource.includes(key), `registry require ${key}`);
    const productionPath = path.join(
      __dirname,
      '../assets/convenience-combos',
      `${key}.jpg`,
    );
    assert(fs.existsSync(productionPath), `production JPG ${key}`);
  }
  for (const comboId of EASY_SET_BATCH_2_IDS) {
    const combo = getConvenienceComboById(comboId)!;
    const key = combo.imageKey!;
    assert(registrySource.includes(key), `registry require ${key}`);
    const productionPath = path.join(
      __dirname,
      '../assets/convenience-combos',
      `${key}.jpg`,
    );
    assert(fs.existsSync(productionPath), `production JPG ${key}`);
  }
  for (const comboId of EASY_SET_BATCH_3_IDS) {
    const combo = getConvenienceComboById(comboId)!;
    const key = combo.imageKey!;
    assert(registrySource.includes(key), `registry require ${key}`);
    const productionPath = path.join(
      __dirname,
      '../assets/convenience-combos',
      `${key}.jpg`,
    );
    assert(fs.existsSync(productionPath), `production JPG ${key}`);
  }
  for (const comboId of EASY_SET_BATCH_4_IDS) {
    const combo = getConvenienceComboById(comboId)!;
    const key = combo.imageKey!;
    assert(registrySource.includes(key), `registry require ${key}`);
    const productionPath = path.join(
      __dirname,
      '../assets/convenience-combos',
      `${key}.jpg`,
    );
    assert(fs.existsSync(productionPath), `production JPG ${key}`);
  }
  for (const comboId of EASY_SET_BATCH_5_IDS) {
    const combo = getConvenienceComboById(comboId)!;
    const key = combo.imageKey!;
    assert(registrySource.includes(key), `registry require ${key}`);
    const productionPath = path.join(
      __dirname,
      '../assets/convenience-combos',
      `${key}.jpg`,
    );
    assert(fs.existsSync(productionPath), `production JPG ${key}`);
  }
  assert(
    !registrySource.includes('invalid_key_combo'),
    '잘못된 imageKey registry 없음',
  );
  assert(cardSource.includes('resolveConvenienceComboImage'), 'card shared resolver');
  assert(detailSource.includes('resolveConvenienceComboImage'), 'detail shared resolver');
  assert(cardSource.includes('heroImage'), 'card conditional hero');
  assert(!detailSource.includes('detailHeroImage'), 'detail no large hero image');

  assert(detailSource.includes('ConvenienceComboItemCards'), '구성품 텍스트 카드');

  const itemCardsSource = fs.readFileSync(
    path.join(__dirname, '../components/convenience/ConvenienceComboItemCards.tsx'),
    'utf8',
  );
  assert(!itemCardsSource.includes('resolveConvenienceComboItemImage'), '구성품 이미지 resolver 제거');
  assert(!itemCardsSource.includes('convenienceComponentImage'), '구성품 이미지 registry 제거');
  assert(!itemCardsSource.includes('<Image'), '구성품 Image 렌더 0');
  assert(!itemCardsSource.includes('imageSlot'), '구성품 imageSlot 제거');
  assert(itemCardsSource.includes('chipLabel'), '구성품 텍스트 chipLabel');
  assert(itemCardsSource.includes('optionalBadge'), '구성품 optional 배지');
  assert(itemCardsSource.includes('flexWrap'), '4개+ wrap layout');

  assert(
    !fs.existsSync(path.join(process.cwd(), 'services/images/convenienceComponentImageAssets.ts')),
    'component image registry 파일 삭제',
  );
  assert(
    !fs.existsSync(path.join(process.cwd(), 'services/convenience/resolveConvenienceComboItemImage.ts')),
    'combo item image resolver 삭제',
  );

  for (const combo of ALL) {
    for (const item of combo.items) {
      assert(
        Boolean(lookupConvenienceComponentAlias(item.name)),
        `catalog alias: ${combo.id} ${item.name}`,
      );
    }
  }

  const combo1 = getConvenienceComboById('combo_0001')!;
  const combo1Items = resolveConvenienceComboItems(combo1.items);
  assert(combo1Items.length === 2, 'combo_0001 구성품 2개');
  assert(combo1Items[0].label === '컵라면', 'combo_0001 컵라면 label');
  assert(combo1Items[0].iconKey !== 'rice_cake', '컵라면 rice_cake 오매핑 방지');
  assert(combo1Items[0].fallbackCategory === 'grain', '컵라면 grain fallback');
  assert(combo1Items[1].label === '삼각김밥', 'combo_0001 삼각김밥 label');
  assert(combo1Items[1].iconKey === 'rice', '삼각김밥 rice icon');

  const cupRamen = resolveConvenienceComboItem({ name: '컵라면' });
  assert(cupRamen.fallbackCategory === 'grain', '컵라면 → grain');
  assert(cupRamen.iconKey !== 'rice_cake', '컵라면 alias rice_cake 차단');

  const kimbap = resolveConvenienceComboItem({ name: '삼각김밥' });
  assert(kimbap.iconKey === 'rice', '삼각김밥 → rice');

  const egg = resolveConvenienceComboItem({ name: '반숙란' });
  assert(egg.iconKey === 'egg', '반숙란 → egg');

  const cheese = resolveConvenienceComboItem({ name: '치즈' });
  assert(cheese.iconKey === 'cheese', '치즈 → cheese');

  const chicken = resolveConvenienceComboItem({ name: '닭가슴살' });
  assert(chicken.iconKey === 'chicken', '닭가슴살 → chicken');

  const hotbar = resolveConvenienceComboItem({ name: '핫바' });
  assert(hotbar.iconKey === 'sausage', '핫바 → sausage');

  const unknown = resolveConvenienceComboItem({ name: '알수없는상품' });
  assert(
    unknown.fallbackCategory === 'generic' || unknown.fallbackCategory !== undefined,
    'unknown fallback category',
  );

  const optionalEgg = resolveConvenienceComboItem({
    name: '반숙란',
    optional: true,
  });
  assert(optionalEgg.optional === true, 'optional item flag');
  const parsedOptional = resolveConvenienceComboItem({ name: '김(선택)' });
  assert(parsedOptional.optional === true, 'optional (선택) parse');
  assert(parsedOptional.label === '김', 'optional label strip');

  assert(resolveComboItemLayoutMode(2) === 'two-col', '2개 2열');
  assert(resolveComboItemLayoutMode(3) === 'three-col', '3개 3열');
  assert(resolveComboItemLayoutMode(4) === 'wrap', '4개+ wrap');

  const contentWidth390 = Math.min(390, MOBILE_MAX_WIDTH) - MOBILE_SCREEN_PADDING * 2;
  const width2 = resolveComboItemCardWidth(2, contentWidth390, 'two-col');
  assert(width2 >= 120 && width2 <= 140, `2열 카드 폭 ${width2}`);
  const width3 = resolveComboItemCardWidth(3, contentWidth390, 'three-col');
  assert(width3 >= 90 && width3 <= 105, `3열 카드 폭 ${width3}`);
  const widthWrap = resolveComboItemCardWidth(4, contentWidth390, 'wrap');
  assert(widthWrap >= 90 && widthWrap <= 105, `wrap 카드 폭 ${widthWrap}`);

  const coffee = resolveConvenienceComboItem({ name: '커피' });
  assert(coffee.iconKey !== 'milk', '커피 milk 오매핑 방지');
  assert(coffee.fallbackCategory === 'generic', '커피 generic fallback');

  const recommendationSource = fs.readFileSync(
    path.join(__dirname, '../components/convenience/ConvenienceComboRecommendationScreen.tsx'),
    'utf8',
  );
  const combosSource = fs.readFileSync(
    path.join(__dirname, '../components/convenience/ConvenienceCombosScreen.tsx'),
    'utf8',
  );
  const navSource = fs.readFileSync(
    path.join(__dirname, '../services/convenience/convenienceComboNavigation.ts'),
    'utf8',
  );
  const replaceNavSource = fs.readFileSync(
    path.join(__dirname, '../components/ui/ScreenReplaceNavButton.tsx'),
    'utf8',
  );

  assert(!detailSource.includes('router.back'), 'detail router.back 없음');
  assert(!detailSource.includes('ScreenBackButton'), 'detail ScreenBackButton 제거');
  assert(!detailSource.includes('navigateBack'), 'detail navigateBack 없음');
  assert(detailSource.includes('ScreenReplaceNavButton'), 'detail replace nav');
  assert(detailSource.includes('APP_HOME_HREF'), 'detail 홈 route 상수');
  assert(detailSource.includes('accessibilityLabel="홈으로"'), 'detail 홈 accessibility');
  assert(
    detailSource.includes('navigateToConvenienceDetailFromDetail'),
    '상세→상세 replace helper',
  );
  assert(!detailSource.includes('router.push'), 'detail direct push 없음');

  assert(!recommendationSource.includes('router.back'), '추천 router.back 없음');
  assert(!recommendationSource.includes('ScreenBackButton'), '추천 ScreenBackButton 제거');
  assert(recommendationSource.includes('APP_HOME_HREF'), '추천 홈 route');
  assert(recommendationSource.includes('navigateToConvenienceDetail'), '추천 detail push helper');

  assert(!combosSource.includes('router.back'), '목록 router.back 없음');
  assert(!combosSource.includes('ScreenBackButton'), '목록 ScreenBackButton 제거');
  assert(combosSource.includes('ScreenReplaceNavButton'), '목록 replace nav');
  assert(combosSource.includes('편의점 추천으로'), '목록 accessibility');

  assert(replaceNavSource.includes('router.replace(href)'), 'replace nav explicit replace');
  assert(!replaceNavSource.includes('router.back('), 'replace nav no back call');
  assert(!replaceNavSource.includes('navigateBack'), 'replace nav no navigateBack');

  assert(navSource.includes('router.replace(APP_HOME_HREF)'), 'nav helper home replace');
  assert(navSource.includes('router.replace(href)'), 'nav helper detail replace option');

  const mockCalls: { method: string; href: unknown }[] = [];
  const mockRouter = {
    push: (href: unknown) => mockCalls.push({ method: 'push', href }),
    replace: (href: unknown) => mockCalls.push({ method: 'replace', href }),
  };
  const { navigateToConvenienceDetail, navigateToConvenienceDetailFromDetail } = await import(
    '../services/convenience/convenienceComboNavigation',
  );
  navigateToConvenienceDetail(mockRouter, 'combo_0001');
  assert(mockCalls[0]?.method === 'push', 'helper push for first detail');
  mockCalls.length = 0;
  navigateToConvenienceDetailFromDetail(mockRouter, 'combo_0002');
  assert(mockCalls[0]?.method === 'replace', 'helper replace for detail chain');

  console.log(`\nConvenience Combos QA — done (${failed} failed)`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
