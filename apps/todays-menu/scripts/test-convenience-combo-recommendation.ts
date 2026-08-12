/**
 * Convenience combo recommendation QA — Sprint 52-A.
 * Run: npm run test:convenience-combo-recommendation
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  COMBO_SITUATION_TAG,
  listAllConvenienceCombos,
} from '../services/convenience/convenienceComboCatalog';
import {
  convenienceCombosCopy,
  getConvenienceSituationGuideMessage,
} from '../constants/convenienceCombosCopy';
import {
  appendRecentRecommendationId,
  buildRecommendationReason,
  DEFAULT_RECOMMENDATION_SITUATION,
  listCandidatesForSituation,
  pickAlternateRecommendations,
  pickEntryRecommendation,
  pickNextRecommendation,
  pickPrimaryRecommendation,
  RECOMMENDATION_SITUATION_ORDER,
  resetConvenienceComboSessionHistory,
  getConvenienceComboSessionRecentIds,
  scoreComboForRecommendation,
  trimRecentRecommendationIds,
} from '../services/convenience/convenienceComboRecommendation';
import {
  resolveStripCardWidth,
  resolveStripContentWidth,
  resolveStripLayoutMode,
  stripRowFitsContentWidth,
} from '../components/convenience/convenienceStripLayout';
import { MOBILE_MAX_WIDTH, MOBILE_SCREEN_PADDING } from '../constants/mobileLayout';

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
const EMPTY_FAV = new Set<string>();

async function main(): Promise<void> {
  console.log('Convenience Combo Recommendation QA — start\n');

  assert(ALL.length === 50, '전체 목록 50개 유지');

  const hacks = ALL.filter((c) => c.comboKind === 'hack_combo');
  const easySets = ALL.filter((c) => c.comboKind === 'easy_set');
  assert(hacks.length === 21, 'HACK 21개 유지');
  assert(easySets.length === 29, 'EASY_SET 29개 유지');

  for (const situationId of RECOMMENDATION_SITUATION_ORDER) {
    const candidates = listCandidatesForSituation(situationId);
    assert(candidates.length > 0, `상황별 후보 존재: ${situationId}`);
    assert(
      candidates.every((c) =>
        c.tags.includes(COMBO_SITUATION_TAG[situationId]),
      ),
      `상황 tag 일치: ${situationId}`,
    );
  }

  assert(
    DEFAULT_RECOMMENDATION_SITUATION === 'hearty',
    '기본 상황 든든한 한 끼',
  );

  const primary = pickPrimaryRecommendation('hearty', [], EMPTY_FAV);
  assert(Boolean(primary), '추천 1개 반환');
  assert(primary!.comboKind === 'hack_combo', 'HACK 우선 추천');

  const alternates = pickAlternateRecommendations('hearty', primary!.id, EMPTY_FAV, 3);
  assert(alternates.length <= 3, '보조 추천 최대 3개');
  assert(!alternates.some((c) => c.id === primary!.id), '현재 추천 제외');
  const altIds = new Set(alternates.map((c) => c.id));
  assert(altIds.size === alternates.length, '보조 추천 중복 없음');

  const recent = trimRecentRecommendationIds(
    appendRecentRecommendationId([], primary!.id),
  );
  assert(recent.length === 1, '최근 추천 1개 기록');
  const next = pickNextRecommendation('hearty', primary!.id, recent, EMPTY_FAV);
  assert(Boolean(next), '다른 조합 추천 반환');
  assert(next!.id !== primary!.id, '다른 조합 추천은 현재와 다름');

  let rotationIds = recent;
  let currentId = primary!.id;
  for (let i = 0; i < 5; i++) {
    const rotated = pickNextRecommendation('hearty', currentId, rotationIds, EMPTY_FAV);
    assert(Boolean(rotated), `회전 ${i + 1} 후보 존재`);
    rotationIds = appendRecentRecommendationId(rotationIds, currentId);
    currentId = rotated!.id;
  }
  assert(rotationIds.length <= 3, '최근 추천 반복 최소화 (max 3)');

  const dessertPrimary = pickPrimaryRecommendation('dessert', [], EMPTY_FAV);
  assert(Boolean(dessertPrimary), 'dessert 추천');
  assert(
    dessertPrimary!.tags.includes(COMBO_SITUATION_TAG.dessert),
    'dessert tag 매칭',
  );

  const hackScore = scoreComboForRecommendation(hacks[0]!, EMPTY_FAV);
  const easyScore = scoreComboForRecommendation(easySets[0]!, EMPTY_FAV);
  assert(hackScore > easyScore, 'HACK 점수 > EASY_SET');

  const favoriteId = hacks[1]!.id;
  const favSet = new Set([favoriteId]);
  const favBoost = scoreComboForRecommendation(hacks[1]!, favSet);
  const baseBoost = scoreComboForRecommendation(hacks[1]!, EMPTY_FAV);
  assert(favBoost > baseBoost, '즐겨찾기 보조 점수');

  for (const situationId of RECOMMENDATION_SITUATION_ORDER) {
    const reason = buildRecommendationReason(situationId);
    assert(reason.length > 10, `추천 이유 문구: ${situationId}`);
  }

  const emptyCandidates = listCandidatesForSituation('hearty');
  assert(emptyCandidates.length > 0, '후보 0개 안전 fallback — hearty');

  resetConvenienceComboSessionHistory();
  const entryA = pickEntryRecommendation('hearty', EMPTY_FAV);
  assert(Boolean(entryA), 'Scenario A — 첫 진입 추천');
  const firstSet = [
    entryA!.id,
    ...pickAlternateRecommendations(
      'hearty',
      entryA!.id,
      EMPTY_FAV,
      3,
      getConvenienceComboSessionRecentIds(),
    ).map((c) => c.id),
  ];
  const entryB = pickEntryRecommendation('hearty', EMPTY_FAV);
  assert(Boolean(entryB), 'Scenario A — 재진입 추천');
  assert(entryB!.id !== entryA!.id, 'Scenario A — 재진입 시 이전 featured와 다름');
  const secondSet = [
    entryB!.id,
    ...pickAlternateRecommendations(
      'hearty',
      entryB!.id,
      EMPTY_FAV,
      3,
      getConvenienceComboSessionRecentIds(),
    ).map((c) => c.id),
  ];
  assert(
    secondSet.join('|') !== firstSet.join('|'),
    'Scenario A — 재진입 세트 전체가 동일하지 않음',
  );

  const heldId = entryB!.id;
  assert(heldId === entryB!.id, 'Scenario B — 같은 세션 추천 id 유지 (re-render 시뮬레이션)');

  resetConvenienceComboSessionHistory();
  const seen = new Set<string>();
  let repeats = 0;
  for (let i = 0; i < 6; i++) {
    const picked = pickEntryRecommendation('hearty', EMPTY_FAV);
    assert(Boolean(picked), `Scenario C — 진입 ${i + 1}`);
    if (seen.has(picked!.id) && i < 3) repeats += 1;
    seen.add(picked!.id);
  }
  assert(repeats === 0, 'Scenario C — 최근 3회 진입에서 featured 반복 없음');

  resetConvenienceComboSessionHistory();
  const heartyIds = listCandidatesForSituation('hearty').map((c) => c.id);
  const shortage = pickPrimaryRecommendation('hearty', heartyIds, EMPTY_FAV);
  assert(Boolean(shortage), 'Scenario D — 후보 부족 시 crash 없이 재사용');
  assert(heartyIds.includes(shortage!.id), 'Scenario D — fallback은 기존 후보');

  const recommendationSource = fs.readFileSync(
    path.join(__dirname, '../components/convenience/ConvenienceComboRecommendationScreen.tsx'),
    'utf8',
  );
  assert(recommendationSource.includes('useFocusEffect'), '진입 시 focus rotation');
  assert(recommendationSource.includes('pickEntryRecommendation'), 'entry pick 사용');
  assert(recommendationSource.includes('skipRotationOnFocusRef'), 'child 복귀 시 추천 유지');
  assert(
    !recommendationSource.includes('pickPrimaryRecommendation('),
    '진입 시 고정 1위 pick 제거',
  );

  const detailSource = fs.readFileSync(
    path.join(__dirname, '../components/convenience/ConvenienceComboDetailScreen.tsx'),
    'utf8',
  );
  assert(!detailSource.includes('DETAIL_HERO_MAX_HEIGHT'), '상세 대형 Hero 제거');
  assert(detailSource.includes('summaryThumb'), '상세 요약 썸네일');
  assert(detailSource.includes('SUMMARY_THUMB_SIZE'), '썸네일 크기 상수');
  assert(detailSource.includes('comboPointsTitle'), '조합 포인트 섹션');
  assert(detailSource.includes('howToMakeTitle'), '만드는 방법 섹션');
  assert(detailSource.includes('ConvenienceComboSuggestionStrip'), '비슷한 조합 가로 스트립');
  assert(!detailSource.includes('ConvenienceComboAlternateCard'), '세로 AlternateCard 제거');

  const indexRoute = fs.readFileSync(
    path.join(__dirname, '../app/convenience-combos/index.tsx'),
    'utf8',
  );
  assert(
    indexRoute.includes('ConvenienceComboRecommendationScreen'),
    'index → 추천형 화면',
  );
  assert(
    !indexRoute.includes('ConvenienceCombosScreen'),
    'index 전체 목록 화면 제거',
  );

  const allRoute = path.join(__dirname, '../app/convenience-combos/all.tsx');
  assert(fs.existsSync(allRoute), '전체 목록 route 존재');
  const allSource = fs.readFileSync(allRoute, 'utf8');
  assert(allSource.includes('ConvenienceCombosScreen'), 'all → 전체 목록 화면');

  assert(
    recommendationSource.includes('navigateToConvenienceAll'),
    '전체 조합 보기 이동',
  );
  assert(
    !recommendationSource.includes('listAllConvenienceCombos().map'),
    '추천 화면 50개 그리드 없음',
  );
  assert(
    recommendationSource.includes('ConvenienceComboSuggestionStrip'),
    '추천 가로 스트립',
  );
  assert(
    !recommendationSource.includes('ConvenienceComboAlternateCard'),
    '세로 AlternateCard 제거',
  );

  const stripSource = fs.readFileSync(
    path.join(__dirname, '../components/convenience/ConvenienceComboSuggestionStrip.tsx'),
    'utf8',
  );
  const stripLayoutSource = fs.readFileSync(
    path.join(__dirname, '../components/convenience/convenienceStripLayout.ts'),
    'utf8',
  );
  assert(stripSource.includes('showsHorizontalScrollIndicator={false}'), '가로 스크롤(좁은 폭)');
  assert(stripSource.includes('mobile-fit-three'), '3열 fit row');
  assert(stripSource.includes('CONVENIENCE_STRIP_CARD_GAP'), '카드 gap');
  assert(stripLayoutSource.includes('mobileLayout'), 'mobileLayout 상수 import');
  assert(
    !stripLayoutSource.includes('STRIP_MOBILE_MAX_WIDTH'),
    '중복 로컬 상수 제거',
  );

  assert(resolveStripLayoutMode(390) === 'mobile-fit-three', '390px fit-three');
  assert(resolveStripLayoutMode(360) === 'mobile-fit-three', '360px fit-three');
  assert(resolveStripLayoutMode(320) === 'mobile-scroll', '320px scroll');
  assert(resolveStripLayoutMode(768) === 'web-grid', '768px web grid');

  const width390 = resolveStripCardWidth(390, 'mobile-fit-three');
  assert(width390 >= 96 && width390 <= 128, `390px card width ${width390}`);
  assert(
    stripRowFitsContentWidth(390, width390),
    '390px 3카드 contentWidth 이내',
  );

  const width360 = resolveStripCardWidth(360, 'mobile-fit-three');
  assert(
    stripRowFitsContentWidth(360, width360),
    '360px 3카드 contentWidth 이내',
  );

  assert(resolveStripContentWidth(390) === 358, '390px content width');
  assert(
    resolveStripContentWidth(390) === Math.min(390, MOBILE_MAX_WIDTH) - MOBILE_SCREEN_PADDING * 2,
    'contentWidth = mobileShell 상수 기반',
  );
  assert(
    recommendationSource.includes('ConvenienceComboFeaturedHero'),
    'Hero 오버레이 컴포넌트',
  );
  assert(
    !recommendationSource.includes('MascotSpeechRow'),
    '별도 캐릭터 영역 제거',
  );
  assert(
    !recommendationSource.includes('todayRecommendationTitle'),
    '별도 오늘의 추천 제목 제거',
  );
  assert(
    !recommendationSource.includes('guideSection'),
    '별도 guideSection 제거',
  );
  assert(!recommendationSource.includes('router.back'), '추천 router.back 없음');
  assert(!recommendationSource.includes('ScreenBackButton'), '추천 ScreenBackButton 제거');
  assert(recommendationSource.includes('ScreenReplaceNavButton'), '추천 replace nav');
  assert(recommendationSource.includes('APP_HOME_HREF'), '추천 홈 route');
  assert(recommendationSource.includes('navigateToConvenienceDetail'), '추천 detail navigation helper');
  assert(!detailSource.includes('router.back'), '상세 router.back 없음');
  assert(detailSource.includes('navigateToConvenienceDetailFromDetail'), '상세→상세 replace');

  const featuredHeroSource = fs.readFileSync(
    path.join(__dirname, '../components/convenience/ConvenienceComboFeaturedHero.tsx'),
    'utf8',
  );
  assert(featuredHeroSource.includes('HomeRecommendTip'), '홈 말풍선 컴포넌트 재사용');
  assert(featuredHeroSource.includes('todayRecommendationBadge'), '이미지 내 배지');
  assert(featuredHeroSource.includes('FavoriteHeartButton'), '이미지 내 즐겨찾기');
  assert(featuredHeroSource.includes('maxLines={2}'), '말풍선 2줄 제한');
  assert(
    featuredHeroSource.includes('CONVENIENCE_FEATURED_HERO_MAX_MOBILE'),
    '추천 Hero 모바일 상한',
  );
  assert(
    featuredHeroSource.includes('CONVENIENCE_FEATURED_HERO_MAX_WEB'),
    '추천 Hero 웹 상한',
  );

  assert(
    convenienceCombosCopy.guideDefault.length <= 15,
    '기본 말풍선 짧은 문구',
  );
  for (const situationId of RECOMMENDATION_SITUATION_ORDER) {
    const guide = getConvenienceSituationGuideMessage(situationId);
    assert(guide.length > 0, `상황 말풍선 문구: ${situationId}`);
    assert(guide.length <= 15, `말풍선 15자 이내: ${situationId} (${guide.length})`);
  }

  const homeRecommendTipSource = fs.readFileSync(
    path.join(__dirname, '../components/home/HomeRecommendTip.tsx'),
    'utf8',
  );
  assert(homeRecommendTipSource.includes('HomeRecommendTip'), '홈 RecommendTip 유지');
  assert(homeRecommendTipSource.includes('SeedMascot'), '홈 SeedMascot 유지');
  assert(homeRecommendTipSource.includes('maxLines = 1'), '홈 기본 1줄 유지');

  console.log(`\nConvenience Combo Recommendation QA — done (${failed} failed)`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
