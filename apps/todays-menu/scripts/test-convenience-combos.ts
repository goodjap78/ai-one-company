/**
 * Convenience combos QA — Sprint 48-B.
 * Run: npm run test:convenience-combos
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  resolveConvenienceCardWidth,
  resolveConvenienceContentMaxWidth,
  resolveConvenienceGridColumns,
} from '../components/convenience/convenienceGridLayout';
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
  assert(cardSource.includes('CARD_MIN_HEIGHT = 148'), 'compact card height');
  assert(cardSource.includes('hasDistinctTransformation'), 'card title 중복 표시 방지');
  assert(detailSource.includes('whyItWorks'), 'detail whyItWorks retained');
  assert(cardSource.includes('numberOfLines={DESC_LINES}'), 'description line limit');

  assert(detailSource.includes('assemblyGuide'), 'detail assemblyGuide retained');
  assert(detailSource.includes('hasDistinctTransformation'), 'detail title 중복 표시 방지');

  console.log(`\nConvenience Combos QA — done (${failed} failed)`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
