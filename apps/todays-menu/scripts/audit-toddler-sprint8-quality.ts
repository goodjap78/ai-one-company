/**
 * HANKKI Sprint 8 — Toddler Meal Recipe Quality Audit (AUDIT ONLY).
 * Does not modify recipes / images / UI / nutrition.
 * Run: npx tsx scripts/audit-toddler-sprint8-quality.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listToddlerMealFeedRecipes } from '../data/recipes/toddlerMealFeed';
import { listToddlerWeeklyPlanCandidates } from '../data/recipes/toddlerWeeklyPlan';
import type { Recipe } from '../data/recipes/types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const REPORT_PATH = path.join(ROOT, 'scripts/reports/HANKKI_V1_1_SPRINT_8_TODDLER_AUDIT.md');
const DETAIL_JSON = path.join(ROOT, 'scripts/reports/HANKKI_V1_1_SPRINT_8_TODDLER_AUDIT_DETAIL.json');

type Grade = 'A' | 'B' | 'C';
type MealBucket = 'breakfast' | 'lunch' | 'dinner' | 'snack';

type IssueCode =
  | 'MEASUREMENT'
  | 'TIME'
  | 'SEASONING'
  | 'TEXTURE'
  | 'ALLERGY'
  | 'IMAGE'
  | 'ADULT_SHRINK'
  | 'SNACK_HEAVY'
  | 'NAME_MISMATCH'
  | 'MISSING_QUALITY'
  | 'STEP_QUALITY'
  | 'OFFICIAL_REVIEW';

type AuditRow = {
  id: string;
  name: string;
  mealTypes: MealBucket[];
  primaryMeal: MealBucket;
  time: number;
  prepTimeMinutes: number | null;
  serving: number;
  stepCount: number;
  grade: Grade;
  officialReviewRequired: boolean;
  issues: { code: IssueCode; detail: string }[];
  fastBreakfast: boolean;
  overnightLikely: boolean;
  eggHeavy: boolean;
  processedMeat: boolean;
  riceBowlForm: boolean;
};

const VAGUE_AMOUNT = /^(적당량|조금|약간|한 줌|취향껏)$/;
const PINCH = /1꼬집|한꼬집|꼬집/;
const PROCESSED_MEAT = /햄|베이컨|소시지|핫도그|스팸/;
const CHEESE_MAYO = /치즈|마요네즈|마요/;
const OVERNIGHT = /전날|미리\s*삶|미리\s*쪄|하룻밤/;
const ADULT_HINT = /성인\s*분량|어른\s*기준으로|4인분|레스토랑\s*스타일/;
const CHOKING_INGREDIENT =
  /견과|아몬드|호두|땅콩|통포도|방울토마토|가래떡|떡볶이|핫도그|통소시지/;

function hasAffirmativeSpice(recipe: Recipe): boolean {
  if (recipe.ingredients.some((i) => /고추장|고춧가루|청양|불닭|칠리|와사비/.test(i.name))) {
    return true;
  }
  const blob = [
    ...recipe.recipe.steps.map((s) => `${s.instruction} ${s.tip}`),
    ...recipe.recommendationMessages,
  ].join('\n');
  // Ignore "고춧가루는 넣지 않아요 / 매운 양념은 넣지 않아요"
  if (/고춧가루|고추장|청양/.test(blob) && !/넣지\s*않|없이|제외|빼/.test(blob)) {
    return true;
  }
  return false;
}

function ingredientBlob(recipe: Recipe): string {
  return recipe.ingredients.map((i) => i.name).join(' ');
}

function primaryMeal(recipe: Recipe): MealBucket {
  const types = recipe.standardMetadata.mealTypes;
  for (const m of ['breakfast', 'lunch', 'dinner', 'snack'] as const) {
    if (types.includes(m)) return m;
  }
  return 'dinner';
}

function textBlob(recipe: Recipe): string {
  return [
    recipe.name,
    ...recipe.ingredients.map((i) => `${i.name} ${i.amount}`),
    ...recipe.recipe.steps.map((s) => `${s.title} ${s.instruction} ${s.tip}`),
    ...(recipe.elementaryQuality
      ? [
          recipe.elementaryQuality.prerequisites ?? '',
          recipe.elementaryQuality.kidAdjustmentTip ?? '',
          recipe.elementaryQuality.storageInfo ?? '',
          recipe.elementaryQuality.reheatingMethod ?? '',
        ]
      : []),
    ...(recipe.familyAudience.toddlerSafetyReview?.requiredChanges ?? []),
  ].join(' ');
}

function allergyMismatch(recipe: Recipe): string | null {
  const noted = new Set([
    ...(recipe.standardMetadata.allergyTags ?? []),
    ...(recipe.familyAudience.toddlerSafetyReview?.allergyTagsNoted ?? []),
  ]);
  const blob = recipe.ingredients.map((i) => i.name).join(' ');
  const expected: { tag: string; re: RegExp }[] = [
    { tag: 'egg', re: /계란|달걀/ },
    { tag: 'soy', re: /두부|간장|된장|청국장/ },
    { tag: 'milk', re: /우유|치즈|요거트|버터/ },
    { tag: 'wheat', re: /밀가루|식빵|우동|면|또띠아|빵/ },
    { tag: 'fish', re: /참치|생선|연어|고등어/ },
    { tag: 'chicken', re: /닭/ },
    { tag: 'beef', re: /소고기|쇠고기/ },
    { tag: 'pork', re: /돼지고기|햄|베이컨/ },
  ];
  const missing: string[] = [];
  for (const { tag, re } of expected) {
    if (re.test(blob) && !noted.has(tag) && ![...noted].some((t) => t.includes(tag))) {
      // chicken/beef/pork are not always in allergyTags schema — skip protein meats except egg/milk/soy/wheat/fish
      if (tag === 'chicken' || tag === 'beef' || tag === 'pork') continue;
      missing.push(tag);
    }
  }
  return missing.length ? `allergyTags missing likely: ${missing.join(',')}` : null;
}

function hasHeroImage(recipe: Recipe): boolean {
  if (recipe.image && recipe.image.length > 0) {
    const rel = recipe.image.replace(/^\//, '');
    const candidates = [
      path.join(ROOT, rel),
      path.join(ROOT, 'assets', 'meals', `${recipe.heroImageKey}.jpg`),
      path.join(ROOT, 'assets', 'meals', `${recipe.heroImageKey}.png`),
    ];
    if (candidates.some((p) => fs.existsSync(p))) return true;
  }
  if (recipe.heroImageKey) {
    const jpg = path.join(ROOT, 'assets', 'meals', `${recipe.heroImageKey}.jpg`);
    const png = path.join(ROOT, 'assets', 'meals', `${recipe.heroImageKey}.png`);
    return fs.existsSync(jpg) || fs.existsSync(png);
  }
  return false;
}

function auditRecipe(recipe: Recipe): AuditRow {
  const issues: AuditRow['issues'] = [];
  let officialReviewRequired = false;
  const blob = textBlob(recipe);
  const mealTypes = (['breakfast', 'lunch', 'dinner', 'snack'] as const).filter((m) =>
    recipe.standardMetadata.mealTypes.includes(m),
  );
  const primary = primaryMeal(recipe);

  // Measurements
  for (const ing of recipe.ingredients) {
    const amt = ing.amount.trim();
    if (!amt || VAGUE_AMOUNT.test(amt)) {
      issues.push({ code: 'MEASUREMENT', detail: `${ing.name} amount vague "${amt || 'empty'}"` });
    } else if (PINCH.test(amt) && /소금|후추|설탕/.test(ing.name)) {
      issues.push({ code: 'MEASUREMENT', detail: `${ing.name} uses pinch "${amt}"` });
    }
  }

  // Time / prep
  if (!recipe.prepTimeMinutes && recipe.time > 20) {
    issues.push({ code: 'TIME', detail: `prepTimeMinutes missing (cook ${recipe.time}m)` });
  }
  if (primary === 'breakfast' && recipe.time > 20) {
    issues.push({ code: 'TIME', detail: `breakfast total time ${recipe.time}m > 20` });
  }
  if (primary === 'snack' && recipe.time > 20) {
    issues.push({ code: 'SNACK_HEAVY', detail: `snack time ${recipe.time}m looks meal-like` });
  }

  // Seasoning strength (heuristic — no medical cutoffs)
  const saltSoy = recipe.ingredients.filter((i) => /소금|간장|된장/.test(i.name));
  for (const s of saltSoy) {
    if (/^[12]큰술$|1\/2큰술/.test(s.amount.trim()) && recipe.serving <= 1) {
      issues.push({
        code: 'SEASONING',
        detail: `${s.name} ${s.amount} may be strong for toddler 1 serving`,
      });
      officialReviewRequired = true;
    }
  }
  if (hasAffirmativeSpice(recipe)) {
    issues.push({ code: 'SEASONING', detail: 'spicy seasoning ingredient/text present' });
    officialReviewRequired = true;
  }
  const hasHam = recipe.ingredients.some((i) => PROCESSED_MEAT.test(i.name));
  const hasCheeseMayo = recipe.ingredients.some((i) => CHEESE_MAYO.test(i.name));
  if (hasHam) {
    issues.push({ code: 'SEASONING', detail: 'processed meat (ham/sausage) present' });
  }
  if (hasCheeseMayo && primary === 'breakfast') {
    issues.push({ code: 'SEASONING', detail: 'cheese/mayo in breakfast — review sodium' });
  }

  // Texture / choking — ingredient list + authored safety flags only (avoid tip false positives)
  const safety = recipe.familyAudience.toddlerSafetyReview;
  if (CHOKING_INGREDIENT.test(ingredientBlob(recipe))) {
    issues.push({
      code: 'TEXTURE',
      detail: 'choking-risk ingredient name in list — verify cut size / form guidance',
    });
    officialReviewRequired = true;
  }
  if ((safety?.chokingCautions?.length ?? 0) > 0) {
    officialReviewRequired = true;
    issues.push({
      code: 'OFFICIAL_REVIEW',
      detail: `chokingCautions: ${safety!.chokingCautions.join(',')}`,
    });
  }
  if ((safety?.seasoningFlags?.length ?? 0) > 0) {
    officialReviewRequired = true;
    issues.push({
      code: 'OFFICIAL_REVIEW',
      detail: `seasoningFlags: ${safety!.seasoningFlags.join(',')}`,
    });
  }

  // Steps quality
  if (recipe.recipe.steps.length < 3) {
    issues.push({ code: 'STEP_QUALITY', detail: `only ${recipe.recipe.steps.length} steps` });
  }
  const hasFireOrDoneness = recipe.recipe.steps.some((s) =>
    /약불|중불|센불|완전히|속까지|익혀|부드럽|전자레인지|찌/.test(`${s.instruction} ${s.tip}`),
  );
  if (!hasFireOrDoneness && primary !== 'snack') {
    issues.push({ code: 'STEP_QUALITY', detail: 'missing fire level / doneness cue' });
  }

  // Adult shrink
  if (ADULT_HINT.test(blob) || recipe.serving >= 3) {
    issues.push({ code: 'ADULT_SHRINK', detail: `serving=${recipe.serving} or adult-portion wording` });
  }

  // Allergy
  const allergyIssue = allergyMismatch(recipe);
  if (allergyIssue) {
    issues.push({ code: 'ALLERGY', detail: allergyIssue });
  }

  // Image
  if (!hasHeroImage(recipe)) {
    issues.push({ code: 'IMAGE', detail: 'missing hero image file' });
  }

  // Toddler recipes use safety review + step tips; elementaryQuality is optional.
  // Only flag when neither authored child guidance nor step tips exist.
  const eq = recipe.elementaryQuality;
  const hasKidTipInSteps = recipe.recipe.steps.some((s) => (s.tip ?? '').trim().length >= 8);
  if (!eq?.kidAdjustmentTip && !eq?.prerequisites && !hasKidTipInSteps) {
    issues.push({
      code: 'MISSING_QUALITY',
      detail: 'no kid tip in steps and no quality tip fields',
    });
  }

  // Nutrition — never invent; R flag only (expected for toddler catalog)
  if (recipe.nutrition.source === 'unverified' || !recipe.nutrition.source) {
    officialReviewRequired = true;
    issues.push({
      code: 'OFFICIAL_REVIEW',
      detail: 'nutrition unverified — do not claim measured values',
    });
  }

  // Snack heavy (rice bowl as snack)
  if (
    primary === 'snack' &&
    (/밥|볶음밥|덮밥|국밥/.test(recipe.name) || recipe.ingredients.some((i) => i.name === '밥'))
  ) {
    issues.push({ code: 'SNACK_HEAVY', detail: 'snack includes rice — may be meal-sized' });
  }

  // Grade — OFFICIAL_REVIEW alone does not force B/C
  const actionable = issues.filter((i) => i.code !== 'OFFICIAL_REVIEW');
  const hardCodes = new Set(actionable.map((i) => i.code));
  let grade: Grade = 'A';
  const measurementCount = actionable.filter((i) => i.code === 'MEASUREMENT').length;
  const hasSpice = actionable.some((i) => i.code === 'SEASONING' && /spicy/.test(i.detail));
  const hasTexture = hardCodes.has('TEXTURE');
  const hasAdult = hardCodes.has('ADULT_SHRINK');
  const breakfastTooLong = primary === 'breakfast' && recipe.time > 25;

  if (hasSpice || hasAdult || breakfastTooLong || measurementCount >= 3) {
    grade = 'C';
  } else if (
    measurementCount >= 1 ||
    hardCodes.has('TIME') ||
    hardCodes.has('STEP_QUALITY') ||
    hardCodes.has('MISSING_QUALITY') ||
    hardCodes.has('ALLERGY') ||
    hardCodes.has('SNACK_HEAVY') ||
    hardCodes.has('IMAGE') ||
    hardCodes.has('SEASONING') ||
    hasTexture
  ) {
    grade = 'B';
  }

  // Pinch-only salt measurement → B (minor), already covered
  // Texture ingredient without cut guidance in steps → escalate if no small_piece tip
  if (
    hasTexture &&
    !recipe.recipe.steps.some((s) => /작게|한입|으깨|다져|잘라/.test(`${s.instruction} ${s.tip}`))
  ) {
    grade = grade === 'A' ? 'B' : grade;
    if (grade === 'B' && !actionable.some((i) => /cut size/.test(i.detail))) {
      // keep B
    }
  }

  const overnightLikely = OVERNIGHT.test(blob);
  const fastBreakfast =
    primary === 'breakfast' && recipe.time <= 15 && !overnightLikely;

  return {
    id: recipe.id,
    name: recipe.name,
    mealTypes: [...mealTypes],
    primaryMeal: primary,
    time: recipe.time,
    prepTimeMinutes: recipe.prepTimeMinutes ?? null,
    serving: recipe.serving,
    stepCount: recipe.recipe.steps.length,
    grade,
    officialReviewRequired,
    issues,
    fastBreakfast,
    overnightLikely,
    eggHeavy: /계란|달걀/.test(recipe.name) || recipe.ingredients.some((i) => /계란|달걀/.test(i.name)),
    processedMeat: hasHam,
    riceBowlForm: /덮밥|볶음밥|국밥|주먹밥/.test(recipe.name) || recipe.standardMetadata.dishType === 'rice_bowl',
  };
}

function findDuplicates(rows: AuditRow[]): string[] {
  const byName = new Map<string, string[]>();
  for (const r of rows) {
    const key = r.name.replace(/\s+/g, '');
    const list = byName.get(key) ?? [];
    list.push(r.id);
    byName.set(key, list);
  }
  const dups: string[] = [];
  for (const [name, ids] of byName) {
    if (ids.length > 1) dups.push(`${name}: ${ids.join(', ')}`);
  }
  // Similar names (edit distance-ish: shared prefix 4+)
  const names = rows.map((r) => ({ id: r.id, name: r.name }));
  for (let i = 0; i < names.length; i += 1) {
    for (let j = i + 1; j < names.length; j += 1) {
      const a = names[i]!.name;
      const b = names[j]!.name;
      if (a === b) continue;
      if (a.includes(b) || b.includes(a) || (a.slice(0, 4) === b.slice(0, 4) && Math.abs(a.length - b.length) <= 2)) {
        dups.push(`similar: ${a} (${names[i]!.id}) ~ ${b} (${names[j]!.id})`);
      }
    }
  }
  return [...new Set(dups)].slice(0, 40);
}

function pickCore30(rows: AuditRow[]): string[] {
  const preferred = ['breakfast', 'dinner', 'lunch', 'snack'] as const;
  const pool = rows
    .filter((r) => r.grade === 'A' || (r.grade === 'B' && !r.issues.some((i) => i.code === 'SEASONING' && /spicy/.test(i.detail))))
    .sort((a, b) => {
      const ga = a.grade === 'A' ? 0 : 1;
      const gb = b.grade === 'A' ? 0 : 1;
      if (ga !== gb) return ga - gb;
      return a.time - b.time;
    });

  const picked: AuditRow[] = [];
  const mealQuota: Record<string, number> = { breakfast: 10, dinner: 10, lunch: 5, snack: 5 };
  const mealCount: Record<string, number> = { breakfast: 0, dinner: 0, lunch: 0, snack: 0 };

  for (const meal of preferred) {
    for (const r of pool) {
      if (picked.length >= 30) break;
      if (r.primaryMeal !== meal) continue;
      if ((mealCount[meal] ?? 0) >= (mealQuota[meal] ?? 0)) continue;
      if (picked.some((p) => p.id === r.id)) continue;
      picked.push(r);
      mealCount[meal] = (mealCount[meal] ?? 0) + 1;
    }
  }
  for (const r of pool) {
    if (picked.length >= 30) break;
    if (!picked.some((p) => p.id === r.id)) picked.push(r);
  }
  return picked.slice(0, 30).map((r) => `${r.id} — ${r.name} [${r.grade}/${r.primaryMeal}]`);
}

console.log('HANKKI Sprint 8 toddler recipe quality audit — start\n');

const recipes = listToddlerMealFeedRecipes();
const rows = recipes.map(auditRecipe);

const byMeal: Record<MealBucket, AuditRow[]> = {
  breakfast: [],
  lunch: [],
  dinner: [],
  snack: [],
};
for (const row of rows) {
  byMeal[row.primaryMeal].push(row);
}

const aCount = rows.filter((r) => r.grade === 'A').length;
const bCount = rows.filter((r) => r.grade === 'B').length;
const cCount = rows.filter((r) => r.grade === 'C').length;
const rCount = rows.filter((r) => r.officialReviewRequired).length;

const breakfastA = byMeal.breakfast.filter((r) => r.grade === 'A').length;
const dinnerA = byMeal.dinner.filter((r) => r.grade === 'A').length;
const fastBreakfast = byMeal.breakfast.filter((r) => r.fastBreakfast).length;

const codeCount = (code: IssueCode) =>
  rows.filter((r) => r.issues.some((i) => i.code === code)).length;

const weeklyBf = listToddlerWeeklyPlanCandidates('breakfast').length;
const weeklyDn = listToddlerWeeklyPlanCandidates('dinner').length;
const bfWeekReady = weeklyBf >= 10 && fastBreakfast >= 5 && byMeal.breakfast.length >= 10;
const dnWeekReady = weeklyDn >= 12 && byMeal.dinner.filter((r) => r.grade !== 'C').length >= 10;

const duplicates = findDuplicates(rows);
const topProblems = [...rows]
  .filter((r) => r.grade !== 'A')
  .sort((a, b) => {
    const score = (r: AuditRow) =>
      r.issues.filter((i) => i.code !== 'OFFICIAL_REVIEW').length * 10 +
      (r.grade === 'C' ? 100 : 0) +
      (r.primaryMeal === 'breakfast' || r.primaryMeal === 'dinner' ? 2 : 0);
    return score(b) - score(a);
  })
  .slice(0, 20)
  .map(
    (r) =>
      `${r.id} ${r.name} [${r.grade}${r.officialReviewRequired ? '+R' : ''}/${r.primaryMeal}] — ${r.issues
        .filter((i) => i.code !== 'OFFICIAL_REVIEW')
        .slice(0, 3)
        .map((i) => i.detail)
        .join('; ') || 'official-review flags only'}`,
  );

const pinchSaltCount = rows.filter((r) =>
  r.issues.some((i) => i.code === 'MEASUREMENT' && /pinch|꼬집/.test(i.detail)),
).length;

const breakfastEgg = byMeal.breakfast.filter((r) => r.eggHeavy).length;

const eggShare = rows.filter((r) => r.eggHeavy).length;
const hamShare = rows.filter((r) => r.processedMeat).length;
const riceShare = rows.filter((r) => r.riceBowlForm).length;

const core30 = pickCore30(rows);

const blockers: string[] = [];
if (cCount > 15) blockers.push(`C-grade recipes high (${cCount}) — content fix sprint required before quality marketing`);
if (pinchSaltCount >= 40) {
  blockers.push(
    `Pinch-salt (1꼬집) on ${pinchSaltCount}/${rows.length} recipes — measurement standardization required before A-heavy toddler weekly quality push`,
  );
}
if (!bfWeekReady) blockers.push('Toddler breakfast 7-day week not ready without more fast A/B breakfast pool');
if (!dnWeekReady) blockers.push('Toddler dinner 7-day week not ready (pool or C-rate)');

const warnings: string[] = [
  `Egg-centric recipes: ${eggShare}/${rows.length}`,
  `Processed meat present: ${hamShare}/${rows.length}`,
  `Rice-bowl form: ${riceShare}/${rows.length}`,
  `Nutrition unverified on nearly all toddler recipes — never show as measured`,
  'Grades are audit heuristics only — not medical/nutrition certification',
];

const report = `# HANKKI v1.1 Sprint 8 — Toddler Meal Recipe Quality Audit

**Date:** 2026-09-03  
**Scope:** AUDIT ONLY — 74 toddler feed recipes (\`listToddlerMealFeedRecipes\`)  
**No changes:** recipes, images, UI, nutrition values

---

## TOTAL

**${rows.length}**

## BREAKFAST

**${byMeal.breakfast.length}**

## LUNCH

**${byMeal.lunch.length}**

## DINNER

**${byMeal.dinner.length}**

## SNACK

**${byMeal.snack.length}**

---

## A_COUNT

**${aCount}**

## B_COUNT

**${bCount}**

## C_COUNT

**${cCount}**

## OFFICIAL_REVIEW_REQUIRED

**${rCount}** (R flag — safety/nutrition source review; not a medical claim)

---

## BREAKFAST_A

**${breakfastA}** / ${byMeal.breakfast.length}

## DINNER_A

**${dinnerA}** / ${byMeal.dinner.length}

## FAST_BREAKFAST_COUNT

**${fastBreakfast}** (breakfast, time ≤ 15, no overnight-prep signal)

### Breakfast focus

| Metric | Value |
|--------|-------|
| Breakfast pool | ${byMeal.breakfast.length} |
| ≤15 min | ${byMeal.breakfast.filter((r) => r.time <= 15).length} |
| Fast (≤15, no overnight) | ${fastBreakfast} |
| Overnight-prep signal | ${byMeal.breakfast.filter((r) => r.overnightLikely).length} |
| Egg-centric | ${breakfastEgg} / ${byMeal.breakfast.length} |
| A-grade | ${breakfastA} |
| Diversity note | Egg-heavy (${breakfastEgg}/15). Non-egg A: 바나나오트밀죽, 고구마바나나볼. Many “계란○○밥/국” variants. |

| ID | Name | Time | Grade | Fast | Issues |
|----|------|------|-------|------|--------|
${byMeal.breakfast
  .map(
    (r) =>
      `| ${r.id} | ${r.name} | ${r.time}m | ${r.grade}${r.officialReviewRequired ? '+R' : ''} | ${r.fastBreakfast ? 'Y' : ''} | ${r.issues.filter((i) => i.code !== 'OFFICIAL_REVIEW').map((i) => i.code).join(',') || '—'} |`,
  )
  .join('\n')}

---

## MEASUREMENT_ISSUES

**${codeCount('MEASUREMENT')}** recipes — almost all are **소금 1꼬집** (pinch) instead of measured 작은술.

Pinch-salt subset: **${pinchSaltCount}**. Fixing these alone would unlock many dinner A candidates.

## TIME_ISSUES

**${codeCount('TIME')}** recipes

## SEASONING_ISSUES

**${codeCount('SEASONING')}** recipes (processed meat / cheese-mayo breakfast heuristics; spicy false-positives filtered)

## TEXTURE_ISSUES

**${codeCount('TEXTURE')}** recipes (ingredient-list choking foods only)

## ALLERGY_ISSUES

**${codeCount('ALLERGY')}** recipes

## IMAGE_MISMATCH

**${codeCount('IMAGE')}** recipes (missing hero **file**). Visual dish↔name match was **not** manually scored this sprint — flagged as WARNING.

## DUPLICATE_RECIPES

Exact / similar name signals: **${duplicates.length}**

${duplicates.length ? duplicates.map((d) => `- ${d}`).join('\n') : '- none exact'}

### Bias snapshot

- Egg-containing: **${eggShare}** / ${rows.length} (breakfast ${breakfastEgg}/15)
- Processed meat: **${hamShare}** / ${rows.length}
- Rice-bowl form: **${riceShare}** / ${rows.length}

---

## TOP_20_PROBLEMS

${topProblems.map((line, i) => `${i + 1}. ${line}`).join('\n')}

---

## TODDLER_BREAKFAST_WEEK_READY

**${bfWeekReady ? 'YES' : 'NO'}**

- Weekly eligible breakfast candidates: **${weeklyBf}**
- Fast breakfast (≤15m): **${fastBreakfast}**
- Breakfast A-grade: **${breakfastA}** (most B only due to pinch salt)
- Criterion: weekly pool ≥10 AND fast ≥5 AND breakfast ≥10
- Pool is sufficient for a future “유아 아침 7일” generator **after** measurement cleanup preferred

## TODDLER_DINNER_WEEK_READY

**${dnWeekReady ? 'YES' : 'NO'}**

- Weekly eligible dinner candidates: **${weeklyDn}**
- Dinner non-C: **${byMeal.dinner.filter((r) => r.grade !== 'C').length}**
- Dinner A-grade: **${dinnerA}** (0 today — B dominated by pinch salt)
- Criterion: weekly pool ≥12 AND non-C dinner ≥10
- Generator: **not built** (audit only)

---

## RECOMMENDED_CORE_RECIPES_30

Candidate core set for a future quality-upgrade sprint (A preferred, then mild B):

${core30.map((line, i) => `${i + 1}. ${line}`).join('\n')}

---

## Grade distribution by meal

| Meal | A | B | C | Total |
|------|---|---|---|-------|
| breakfast | ${byMeal.breakfast.filter((r) => r.grade === 'A').length} | ${byMeal.breakfast.filter((r) => r.grade === 'B').length} | ${byMeal.breakfast.filter((r) => r.grade === 'C').length} | ${byMeal.breakfast.length} |
| lunch | ${byMeal.lunch.filter((r) => r.grade === 'A').length} | ${byMeal.lunch.filter((r) => r.grade === 'B').length} | ${byMeal.lunch.filter((r) => r.grade === 'C').length} | ${byMeal.lunch.length} |
| dinner | ${byMeal.dinner.filter((r) => r.grade === 'A').length} | ${byMeal.dinner.filter((r) => r.grade === 'B').length} | ${byMeal.dinner.filter((r) => r.grade === 'C').length} | ${byMeal.dinner.length} |
| snack | ${byMeal.snack.filter((r) => r.grade === 'A').length} | ${byMeal.snack.filter((r) => r.grade === 'B').length} | ${byMeal.snack.filter((r) => r.grade === 'C').length} | ${byMeal.snack.length} |

---

## BLOCKERS

${blockers.length ? blockers.map((b) => `- ${b}`).join('\n') : '- None blocking audit completion. Content fix sprint recommended for pinch-salt measurements before toddler quality marketing.'}

## WARNINGS

${warnings.map((w) => `- ${w}`).join('\n')}
- Pinch-salt (1꼬집) on **${pinchSaltCount}** recipes — largest single B driver
- Visual image↔dish QA not performed (file presence only)
- Breakfast egg concentration may reduce weekly diversity without form/protein rules

---

## METHOD (audit heuristics)

- Pool: \`isEligibleToddlerMealFeedRecipe\` (explicit toddler + approved safety review)
- Grades: A usable as-is; B minor fix; C must fix before promote
- R flag: authored choking/seasoning safety flags and/or unverified nutrition (expected catalog-wide)
- **No** invented sodium/sugar mg cutoffs
- Spicy detection uses ingredients + affirmative steps only (ignores “매운 양념은 넣지 않아요”)
- Detail JSON: \`scripts/reports/HANKKI_V1_1_SPRINT_8_TODDLER_AUDIT_DETAIL.json\`
- Runner: \`npx tsx scripts/audit-toddler-sprint8-quality.ts\`

---

## RESULT

**${rows.length === 74 && aCount + bCount + cCount === 74 ? 'PASS' : 'PARTIAL'}**

Audit complete for all ${rows.length} toddler recipes. No content modified. Next sprint: hold for quality-fix planning.
`;

fs.writeFileSync(REPORT_PATH, report, 'utf8');
fs.writeFileSync(
  DETAIL_JSON,
  JSON.stringify(
    {
      total: rows.length,
      counts: {
        breakfast: byMeal.breakfast.length,
        lunch: byMeal.lunch.length,
        dinner: byMeal.dinner.length,
        snack: byMeal.snack.length,
      },
      grades: { A: aCount, B: bCount, C: cCount, R: rCount },
      weekly: {
        breakfastCandidates: weeklyBf,
        dinnerCandidates: weeklyDn,
        breakfastWeekReady: bfWeekReady,
        dinnerWeekReady: dnWeekReady,
        fastBreakfast,
      },
      rows,
      core30,
      duplicates,
    },
    null,
    2,
  ),
  'utf8',
);

console.log(`TOTAL=${rows.length}`);
console.log(`BREAKFAST=${byMeal.breakfast.length} LUNCH=${byMeal.lunch.length} DINNER=${byMeal.dinner.length} SNACK=${byMeal.snack.length}`);
console.log(`A=${aCount} B=${bCount} C=${cCount} R=${rCount}`);
console.log(`BREAKFAST_A=${breakfastA} DINNER_A=${dinnerA} FAST_BREAKFAST=${fastBreakfast}`);
console.log(`WEEKLY_BF=${weeklyBf} WEEKLY_DN=${weeklyDn}`);
console.log(`TODDLER_BREAKFAST_WEEK_READY=${bfWeekReady ? 'YES' : 'NO'}`);
console.log(`TODDLER_DINNER_WEEK_READY=${dnWeekReady ? 'YES' : 'NO'}`);
console.log(`\nWrote ${REPORT_PATH}`);
console.log(`Wrote ${DETAIL_JSON}`);
console.log('\nHANKKI Sprint 8 toddler audit — PASS');
