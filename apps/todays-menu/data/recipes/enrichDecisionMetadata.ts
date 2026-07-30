/**
 * Sprint R8 — Derive decision metadata from existing recipe fields.
 * Keeps Batch 01/02 compatible without rewriting every ingredient line.
 */
import type { RecipeDecisionInput, RecipeDecisionTags } from './decisionTypes';
import type {
  DecisionBudget,
  DecisionDifficulty,
  DecisionMealTime,
  DecisionMood,
  DecisionSeason,
  DecisionSituation,
  DecisionTimeRequired,
  DecisionWeather,
} from './decisionTypes';

type EnrichSource = {
  id: string;
  name: string;
  mealType: string[];
  time: number;
  difficulty: string;
  serving: number;
  tags: string[];
  situation: string[];
  aiTags: string[];
  category: string[];
  recommendationMessages: string[];
  nutrition: { calorie: number };
};

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function mapMealTime(mealType: string[]): DecisionMealTime[] {
  const out: DecisionMealTime[] = [];
  for (const raw of mealType) {
    const t = raw.trim().toLowerCase();
    if (t === '아침' || t === 'breakfast') out.push('breakfast');
    else if (t === '점심' || t === 'lunch') out.push('lunch');
    else if (t === '저녁' || t === 'dinner') out.push('dinner');
    else if (t === '야식' || t === '간식' || t === 'late_night' || t === 'snack') {
      out.push('late_night');
    }
  }
  return unique(out.length > 0 ? out : (['dinner'] as DecisionMealTime[]));
}

function mapDifficulty(difficulty: string): DecisionDifficulty {
  const d = difficulty.trim().toLowerCase();
  if (d === '쉬움' || d === 'easy') return 'easy';
  if (d === '어려움' || d === 'hard') return 'hard';
  return 'normal';
}

function mapTimeRequired(time: number): DecisionTimeRequired {
  if (time <= 10) return 10;
  if (time <= 20) return 20;
  if (time <= 30) return 30;
  if (time <= 40) return 40;
  return 60;
}

function mapMood(aiTags: string[], tags: string[]): DecisionMood[] {
  const blob = [...aiTags, ...tags].join(' ').toLowerCase();
  const moods: DecisionMood[] = [];
  if (/comfort|든든|구수|따뜻|집밥/.test(blob)) moods.push('comfort');
  if (/healthy|건강|다이어트|담백|가벼운/.test(blob)) moods.push('healthy');
  if (/lazy|quick|간단|빠른|초간단/.test(blob)) moods.push('lazy');
  if (/stress|매콤|spicy|칼칼|해장/.test(blob)) moods.push('stress');
  if (/celebration|파티|잔치|특별|손님/.test(blob)) moods.push('celebration');
  if (/happy|아이|kids|달콤|재미/.test(blob)) moods.push('happy');
  if (moods.length === 0) moods.push('comfort');
  return unique(moods);
}

function mapSituation(
  aiTags: string[],
  tags: string[],
  situation: string[],
  serving: number,
): DecisionSituation[] {
  const blob = [...aiTags, ...tags, ...situation].join(' ').toLowerCase();
  const out: DecisionSituation[] = [];
  if (/solo|alone|혼밥|혼자/.test(blob) || serving === 1) out.push('alone');
  if (/family|가족/.test(blob) || serving >= 3) out.push('family');
  if (/couple|데이트|둘|연인/.test(blob)) out.push('couple');
  if (/kids|아이|어린이/.test(blob)) out.push('kids');
  if (/guest|손님|파티|초대/.test(blob)) out.push('guest');
  if (out.length === 0) out.push(serving <= 2 ? 'alone' : 'family');
  return unique(out);
}

function mapBudget(time: number, calorie: number, difficulty: DecisionDifficulty): DecisionBudget {
  if (difficulty === 'hard' || time >= 50 || calorie >= 650) return 'high';
  if (difficulty === 'easy' && time <= 20) return 'low';
  return 'medium';
}

function mapWeather(aiTags: string[], tags: string[], category: string[]): DecisionWeather[] {
  const blob = [...aiTags, ...tags, ...category].join(' ').toLowerCase();
  if (/soup|국물|찌개|탕|해장|따뜻한/.test(blob)) return ['cold', 'rain', 'any'];
  if (/여름|시원|냉|샐러드|비빔/.test(blob)) return ['hot', 'any'];
  if (/튀김|분식|야식/.test(blob)) return ['rain', 'any'];
  return ['any'];
}

function mapSeason(aiTags: string[], tags: string[], category: string[]): DecisionSeason[] {
  const blob = [...aiTags, ...tags, ...category].join(' ').toLowerCase();
  if (/여름|시원|냉면|삼계/.test(blob)) return ['summer', 'any'];
  if (/겨울|호떡|따뜻한|국물/.test(blob)) return ['winter', 'any'];
  if (/봄|나물/.test(blob)) return ['spring', 'any'];
  if (/가을/.test(blob)) return ['autumn', 'any'];
  return ['any'];
}

function buildSearchTags(source: EnrichSource): string[] {
  const tags = new Set<string>();
  for (const c of source.category) {
    if (c.includes('국물')) tags.add('국물요리');
    if (c.includes('한식')) tags.add('한식');
    if (c.includes('중식')) tags.add('중식');
    if (c.includes('일식')) tags.add('일식');
    if (c.includes('양식')) tags.add('양식');
    if (c.includes('분식') || c.includes('간식')) tags.add('분식');
    if (c.includes('건강')) tags.add('다이어트');
    if (c.includes('덮밥') || c.includes('한그릇')) tags.add('든든한한끼');
    if (c.includes('도시락') || c.includes('김밥')) tags.add('도시락');
  }
  for (const t of source.tags) {
    if (/매콤|매운/.test(t)) tags.add('매운음식');
    if (/든든/.test(t)) tags.add('든든한한끼');
    if (/간단|빠른|초간단/.test(t)) tags.add('20분완성');
    if (/건강|담백|가벼운/.test(t)) tags.add('다이어트');
    if (/아이/.test(t)) tags.add('아이반찬');
    if (/국물/.test(t)) tags.add('국물요리');
  }
  for (const a of source.aiTags) {
    if (a === 'spicy') tags.add('매운음식');
    if (a === 'soup' || a === 'one_pot') tags.add('국물요리');
    if (a === 'solo') tags.add('혼밥');
    if (a === 'kids') tags.add('아이반찬');
    if (a === 'healthy') tags.add('다이어트');
    if (a === 'meal_prep') tags.add('도시락');
    if (a === 'quick') tags.add('20분완성');
    if (a === 'late_night') tags.add('야식');
    if (a === 'family') tags.add('가족식사');
    if (a === 'rice_based') tags.add('든든한한끼');
  }
  if (source.time <= 20) tags.add('20분완성');
  if (source.serving === 1) tags.add('혼밥');
  if (tags.size === 0) tags.add('집밥');
  return [...tags].slice(0, 12);
}

function buildRecommendationReasons(source: EnrichSource): string[] {
  const fromMessages = source.recommendationMessages
    .map((m) => m.trim())
    .filter(Boolean)
    .slice(0, 3);
  if (fromMessages.length >= 3) return fromMessages;

  const extras = [
    `${source.time}분 안에 만들기 좋아요.`,
    source.serving >= 3
      ? '가족과 함께 먹기 좋은 메뉴예요.'
      : '혼자 먹기에도 부담 없는 메뉴예요.',
    source.aiTags.includes('comfort') || source.tags.some((t) => /든든|집밥/.test(t))
      ? '든든하게 먹고 싶은 날 추천해요.'
      : `${source.name}으로 오늘 한 끼를 정해 보세요.`,
  ];
  return unique([...fromMessages, ...extras]).slice(0, 3);
}

function mapKidFriendly(aiTags: string[], tags: string[]): boolean {
  const blob = [...aiTags, ...tags].join(' ').toLowerCase();
  if (/spicy|매콤|매운|청양|어른/.test(blob) && !/kids|아이|어린이/.test(blob)) {
    return false;
  }
  return /kids|아이|어린이|순한|담백|mild/.test(blob);
}

function mapSpicyLevel(aiTags: string[], tags: string[]): 0 | 1 | 2 | 3 {
  const blob = [...aiTags, ...tags].join(' ').toLowerCase();
  if (/마라|아주매운|매우매운/.test(blob)) return 3;
  if (/spicy|매콤|매운|고추장|고춧가루|칼칼/.test(blob)) return 2;
  if (/살짝매운|중간/.test(blob)) return 1;
  if (/mild|담백|순한|아이/.test(blob)) return 0;
  return /국물|찌개|볶음/.test(blob) ? 1 : 0;
}

function buildPriority(source: EnrichSource, tags: RecipeDecisionTags): number {
  let score = 55;
  if (tags.timeRequired <= 20) score += 12;
  else if (tags.timeRequired <= 30) score += 6;
  else if (tags.timeRequired >= 60) score -= 8;

  if (tags.difficultyLevel === 'easy') score += 8;
  if (tags.difficultyLevel === 'hard') score -= 10;

  if (tags.budget === 'low') score += 6;
  if (tags.budget === 'high') score -= 4;

  if (tags.kidFriendly) score += 3;
  if (tags.spicyLevel >= 2) score += 1;

  if (source.aiTags.includes('comfort')) score += 5;
  if (source.aiTags.includes('quick')) score += 5;
  if (source.aiTags.includes('family')) score += 4;
  if (source.aiTags.includes('spicy')) score += 2;
  if (source.aiTags.includes('healthy')) score += 3;

  // Flagship / early ids slightly preferred for stable catalog demos
  const idNum = Number.parseInt(source.id, 10);
  if (idNum >= 1 && idNum <= 10) score += 10;
  else if (idNum <= 20) score += 5;
  else if (idNum <= 30) score += 3;

  return Math.max(1, Math.min(100, Math.round(score)));
}

export type DecisionEnrichment = {
  decisionTags: RecipeDecisionTags;
  recommendationReasons: string[];
  searchTags: string[];
  recommendationPriority: number;
};

/** Build full decision block; explicit overrides win over derived defaults. */
export function enrichDecisionMetadata(
  source: EnrichSource,
  overrides?: RecipeDecisionInput,
): DecisionEnrichment {
  const difficultyLevel =
    overrides?.decisionTags?.difficultyLevel ?? mapDifficulty(source.difficulty);
  const timeRequired =
    overrides?.decisionTags?.timeRequired ?? mapTimeRequired(source.time);

  const derived: RecipeDecisionTags = {
    mealTime: overrides?.decisionTags?.mealTime ?? mapMealTime(source.mealType),
    mood: overrides?.decisionTags?.mood ?? mapMood(source.aiTags, source.tags),
    situation:
      overrides?.decisionTags?.situation ??
      mapSituation(source.aiTags, source.tags, source.situation, source.serving),
    timeRequired,
    budget:
      overrides?.decisionTags?.budget ??
      mapBudget(source.time, source.nutrition.calorie, difficultyLevel),
    difficultyLevel,
    weather:
      overrides?.decisionTags?.weather ??
      mapWeather(source.aiTags, source.tags, source.category),
    season:
      overrides?.decisionTags?.season ??
      mapSeason(source.aiTags, source.tags, source.category),
    kidFriendly:
      overrides?.decisionTags?.kidFriendly ??
      mapKidFriendly(source.aiTags, source.tags),
    spicyLevel:
      overrides?.decisionTags?.spicyLevel ??
      mapSpicyLevel(source.aiTags, source.tags),
  };

  const recommendationReasons = (
    overrides?.recommendationReasons?.map((r) => r.trim()).filter(Boolean) ??
    buildRecommendationReasons(source)
  ).slice(0, 3);

  while (recommendationReasons.length < 3) {
    recommendationReasons.push(`${source.name}을 오늘 한 끼로 추천해요.`);
  }

  const searchTags =
    overrides?.searchTags?.map((t) => t.trim()).filter(Boolean) ??
    buildSearchTags(source);

  const recommendationPriority = Math.max(
    1,
    Math.min(
      100,
      overrides?.recommendationPriority ?? buildPriority(source, derived),
    ),
  );

  return {
    decisionTags: {
      mealTime: unique(derived.mealTime),
      mood: unique(derived.mood),
      situation: unique(derived.situation),
      timeRequired: derived.timeRequired,
      budget: derived.budget,
      difficultyLevel: derived.difficultyLevel,
      weather: unique(derived.weather),
      season: unique(derived.season),
      kidFriendly: derived.kidFriendly,
      spicyLevel: derived.spicyLevel,
    },
    recommendationReasons: recommendationReasons.slice(0, 3),
    searchTags: unique(searchTags),
    recommendationPriority,
  };
}
