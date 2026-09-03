/**
 * Build child-missing-hero-queue.json + child-step-pilot-queue.json
 * Run: npx tsx scripts/build-child-image-queues.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HANKKI_RECIPES } from '../data/recipes/hankkiRecipes';
import type { Recipe } from '../data/recipes/types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, '..');
const MEALS_DIR = path.join(APP_ROOT, 'assets', 'meals');
const OUT_DIR = path.join(__dirname, 'reports');

type ChildAudience = 'baby' | 'toddler' | 'elementary';
type StepRow = { order: number; title: string; instruction: string; imageKey: string };

function childAudience(audiences: readonly string[]): ChildAudience | null {
  if (audiences.includes('baby')) return 'baby';
  if (audiences.includes('toddler')) return 'toddler';
  if (audiences.includes('elementary')) return 'elementary';
  return null;
}

function heroFileExists(key: string): boolean {
  if (!key) return false;
  return (
    fs.existsSync(path.join(MEALS_DIR, `${key}.jpg`)) ||
    fs.existsSync(path.join(MEALS_DIR, `${key}.png`))
  );
}

function stepsOf(r: Recipe): StepRow[] {
  return (r.recipe?.steps ?? []).map((s, i) => ({
    order: i + 1,
    title: s.title,
    instruction: s.instruction,
    imageKey: s.imageKey,
  }));
}

function ingredientsOf(r: Recipe) {
  return r.ingredients.map((i) => ({ name: i.name, amount: i.amount }));
}

const TEXTURE_EN: Record<string, string> = {
  thin_puree: 'thin puree',
  thick_puree: 'thick puree',
  mashed: 'mashed',
  soft_chunks: 'soft chunks',
  finger_food: 'finger food',
  family_transition: 'family-transition soft rice',
};

function foodNames(ings: { name: string; amount: string }[]): string[] {
  return ings
    .map((i) => i.name)
    .filter(
      (n) =>
        !/^(불리기 물|끓일 물|찜기 물|묽힐 물|물|식용유|소금|간장|참기름|설탕|꿀|버터)$/i.test(n),
    );
}

function finishDescription(r: Recipe, audience: ChildAudience): string {
  const foods = foodNames(ingredientsOf(r));
  const foodList = (foods.length ? foods : ingredientsOf(r).map((i) => i.name)).slice(0, 5).join(', ');
  const texture = r.familyAudience.babyFood?.texture ?? null;
  const textureLabel = texture ? TEXTURE_EN[texture] ?? texture.replace(/_/g, ' ') : null;
  const stage = r.familyAudience.babyFood?.stage;

  if (audience === 'baby' && textureLabel) {
    const stageBit =
      stage === 'early'
        ? 'Early weaning stage.'
        : stage === 'middle'
          ? 'Middle weaning stage.'
          : stage === 'late'
            ? 'Late weaning stage.'
            : stage === 'completion'
              ? 'Completion / family-transition stage.'
              : '';
    if (texture === 'thin_puree') {
      return `A small plain bowl of smooth, pourable ${textureLabel} from ${foodList}, completely lump-free and watery like thin rice gruel. ${stageBit} Soft daylight, empty table. No people, hands, text, or collage.`;
    }
    if (texture === 'thick_puree') {
      return `A small bowl of dense ${textureLabel} porridge from ${foodList}, soft enough to mound with a spoon trail and no hard pieces. ${stageBit} Soft daylight, empty table. No people, hands, text, or collage.`;
    }
    if (texture === 'mashed') {
      return `A small bowl of soft ${textureLabel} baby food from ${foodList}, fork-mashed with only faint soft flecks and no large chunks. ${stageBit} Soft daylight, empty table. No people, hands, text, or collage.`;
    }
    if (texture === 'soft_chunks') {
      return `A small bowl of soft-cooked ${foodList} as ${textureLabel}: moist tender bite-size pieces a baby can gum, not crispy. ${stageBit} Soft daylight, empty table. No people, hands, text, or collage.`;
    }
    if (texture === 'finger_food') {
      return `Soft ${textureLabel} pieces of ${foodList} on a plain child plate, moist and easy to grasp, not fried. ${stageBit} Soft daylight, empty table. No people, hands, text, or collage.`;
    }
    return `A family-style soft rice bowl of ${foodList} at ${textureLabel} texture: soft grains with finely minced soft vegetables/protein. ${stageBit} Soft daylight, empty table. No people, hands, text, or collage.`;
  }

  if (audience === 'toddler') {
    const mashedLike = /으깨|매시|순두|죽|수프|요거트|오트밀|스크램블/.test(r.name);
    const pancakeLike = /팬케이크|전$|빵/.test(r.name);
    const form = mashedLike
      ? 'soft mashed toddler texture with only tiny soft pieces, not baby puree'
      : pancakeLike
        ? 'home-style small toddler portions, not thick cafe dessert'
        : 'soft toddler-friendly small pieces, moist and easy to chew';
    return `A toddler bowl or plate of ${foodList}, ${form}, mild home cooking look. Soft daylight, empty table. No people, hands, text, or collage.`;
  }

  const mealTypes = r.standardMetadata?.mealTypes ?? [];
  if (mealTypes.includes('snack')) {
    return `After-school snack of ${foodList} on a clean plate, home-style not cafe dessert. Soft daylight, empty table. No people, hands, text, or collage.`;
  }
  if (mealTypes.includes('dinner')) {
    return `Home dinner bowl or plate of ${foodList}, protein and sauce visibly distinct over rice or main. Soft daylight, empty table. No people, hands, text, or collage.`;
  }

  return `School-breakfast style plated ${foodList}, finished and ready to eat on a clean plate. Soft daylight, empty table. No people, hands, text, or collage.`;
}

/** Score steps for slot roles using Korean step text only. */
function pickStepSlots(steps: StepRow[]): { prep: StepRow; cook: StepRow; finish: StepRow } {
  if (!steps.length) throw new Error('no steps');

  const prep =
    steps.find((s) => /불리|헹|손질|다지|껍질|씨|기름 빼|물기|으깨기|반죽 섞|섞기$|토핑 손질/.test(s.title)) ??
    steps[0];

  const cookScore = (s: StepRow) => {
    let n = 0;
    const t = s.title + s.instruction;
    if (/굽|구워|찌|찜|볶|삶|끓|지어|익히|달구|팬에|냄비|중약불|약불|뚜껑/.test(t)) n += 3;
    if (/스크램|오므라|녹여|기포/.test(t)) n += 2;
    if (/바르|올려|섞|쥐|묻히|담/.test(s.title) && !/굽|볶|끓|익|찌|삶|지어/.test(t)) n -= 1;
    if (s.imageKey === prep.imageKey) n -= 5;
    return n;
  };
  const cook = [...steps].sort((a, b) => cookScore(b) - cookScore(a))[0] ?? steps[Math.min(1, steps.length - 1)];

  const finishScore = (s: StepRow) => {
    let n = 0;
    const t = s.title + s.instruction;
    if (/체에|묽|으깨 내|퓌레|미음|진밥|무른|한입|담|내요|묻히|버터 올리|쥐기|형태/.test(t)) n += 3;
    if (/식혀/.test(t)) n += 1;
    if (s.imageKey === prep.imageKey || s.imageKey === cook.imageKey) n -= 5;
    return n;
  };
  const finish = [...steps].sort((a, b) => finishScore(b) - finishScore(a))[0] ?? steps[steps.length - 1];

  return { prep, cook, finish };
}

/**
 * English visual paraphrase grounded only in listed ingredients + this step's title/instruction.
 * Does not invent foods.
 */
function visualForStep(
  slot: 'prep' | 'cook' | 'finish',
  step: StepRow,
  ings: { name: string; amount: string }[],
  audience: ChildAudience,
  texture: string | null,
): string {
  const foods = foodNames(ings);
  const foodBit = (foods.length ? foods : ings.map((i) => i.name)).slice(0, 4).join(', ');
  const t = texture ? TEXTURE_EN[texture] ?? texture : null;
  const title = step.title;
  const inst = step.instruction;
  const text = title + ' ' + inst;

  if (slot === 'prep') {
    if (/불리|헹/.test(text)) {
      return `Prep: rinsed ${foodBit} soaking in a clear bowl of measured water on a clean counter (${title}). No people, hands, or text.`;
    }
    if (/기름 빼|체에 밭|체에 올/.test(text)) {
      return `Prep: ${foodBit} draining in a sieve pressed with a spoon to remove liquid/oil, crumbled finely in a bowl (${title}). No people, hands, or text.`;
    }
    if (/다지|껍질|씨|손질|썰/.test(text)) {
      return `Prep: finely chopped or peeled ${foodBit} in small soft pieces on a clean board (${title}). No people, hands, or text.`;
    }
    if (/으깨/.test(text)) {
      return `Prep: ${foodBit} fully fork-mashed in a bowl until no large lumps remain (${title}). No people, hands, or text.`;
    }
    if (/반죽|섞/.test(text)) {
      return `Prep: mixing bowl with measured ${foodBit} stirred smooth as described (${title}). No people, hands, or text.`;
    }
    return `Prep still-life of ${foodBit} for "${title}": ${inst} Shown as ingredients only on a clean surface. No people, hands, or text.`;
  }

  if (slot === 'cook') {
    if (/찌|찜/.test(text)) {
      return `Cook: ${foodBit} steaming until fork-soft in a pot/steamer (${title}). Visible soft cooked change. No people, hands, or text.`;
    }
    if (/볶/.test(text)) {
      return `Cook: pan gently stir-cooking ${foodBit} until soft and mixed (${title}). Mild color change only. No people, hands, or text.`;
    }
    if (/삶/.test(text)) {
      return `Cook: ${foodBit} simmering in a pot until fully cooked through, then finely minced as described (${title}). No people, hands, or text.`;
    }
    if (/끓|저으며|지어|밥 짓/.test(text)) {
      return `Cook: pot simmering ${foodBit} on low–medium heat, spoon trail showing thickening soft porridge/rice (${title}). No people, hands, or text.`;
    }
    if (/익히|스크램|팬에/.test(text)) {
      return `Cook: pan on low heat softly setting ${foodBit} while stirring (${title}). Moist curds, not browned hard. No people, hands, or text.`;
    }
    if (/굽|구워|달구|기포|치즈를 녹/.test(text)) {
      return `Cook: ${foodBit} cooking on a pan until set/melted as described (${title}). No people, hands, or text.`;
    }
    if (/바르|올려|섞|만들/.test(text)) {
      return `Core assembly change for ${foodBit}: "${title}" — ${inst} Clean counter, food only. No people, hands, or text.`;
    }
    return `Key cooking/assembly change for ${foodBit}: "${title}" — ${inst} No people, hands, or text.`;
  }

  // finish
  if (audience === 'baby' && t) {
    if (/체에|묽|미음/.test(text)) {
      return `Finish texture: strained ${t} of ${foodBit} in a small plain bowl, lump-free pourable look matching the step (${title}). No people, hands, text, or collage.`;
    }
    if (/으깨/.test(text)) {
      return `Finish texture: fork-mashed ${t} bowl of ${foodBit} with no large chunks (${title}). Soft daylight. No people, hands, text, or collage.`;
    }
    if (/진밥|무른|섞어 내|작게 나눠/.test(text)) {
      return `Finish form: plated ${t} serving of ${foodBit} in a small bowl, soft grains/pieces as described (${title}). No people, hands, text, or collage.`;
    }
    return `Finish plated ${t} baby dish of ${foodBit} after "${title}". Small plain bowl, soft daylight. No people, hands, text, or collage.`;
  }

  if (/묻히|주먹|쥐/.test(text)) {
    return `Finish form: completed rice balls of ${foodBit} coated/shaped as described (${title}). Plate only. No people, hands, text, or collage.`;
  }
  if (/버터 올리|접시에|담/.test(text)) {
    return `Finish plated ${foodBit} ready to serve (${title}): ${inst} Empty table, soft daylight. No people, hands, text, or collage.`;
  }
  return `Finish texture/form of ${foodBit} after "${title}": ${inst} No people, hands, text, or collage.`;
}

/** Curated slot picks for the 12-recipe pilot (imageKeys from recipe steps only). */
const PILOT_SLOT_PICKS: Record<
  string,
  { prepOrder: number; cookOrder: number; finishOrder: number }
> = {
  recipe_0336: { prepOrder: 1, cookOrder: 2, finishOrder: 3 }, // soak / boil / strain thin
  recipe_0337: { prepOrder: 1, cookOrder: 2, finishOrder: 3 }, // peel / steam / mash thin
  recipe_0342: { prepOrder: 1, cookOrder: 4, finishOrder: 5 }, // soak / porridge boil / mash
  recipe_0349: { prepOrder: 1, cookOrder: 2, finishOrder: 4 }, // rice soak-boil / egg cook / mash
  recipe_0350: { prepOrder: 1, cookOrder: 3, finishOrder: 5 }, // soak / soft rice / small pieces
  recipe_0358: { prepOrder: 1, cookOrder: 4, finishOrder: 5 }, // soak / thick rice / mix plate
  recipe_0320: { prepOrder: 1, cookOrder: 3, finishOrder: 4 }, // mash tofu / scramble / plate
  recipe_0384: { prepOrder: 2, cookOrder: 4, finishOrder: 5 }, // chop veg / fry with tuna+rice / plate
  recipe_0322: { prepOrder: 1, cookOrder: 2, finishOrder: 3 }, // mash banana / boil oats / mix thick
  recipe_0396: { prepOrder: 1, cookOrder: 4, finishOrder: 5 }, // drain tuna / form ball / seaweed coat
  recipe_0401: { prepOrder: 1, cookOrder: 4, finishOrder: 4 }, // toppings prep / pan bake melt (finish=same plated melt)
  recipe_0311: { prepOrder: 1, cookOrder: 3, finishOrder: 4 }, // batter / flip-bake / butter plate
};

const PILOT_IDS = [
  'recipe_0336',
  'recipe_0337',
  'recipe_0342',
  'recipe_0349',
  'recipe_0350',
  'recipe_0358',
  'recipe_0320',
  'recipe_0384',
  'recipe_0322',
  'recipe_0396',
  'recipe_0401',
  'recipe_0311',
] as const;

/** Batch #3 step pilot — baby 8, toddler 5, elementary 5. */
const BATCH3_STEP_PILOT_IDS = [
  // baby — texture / cooking clarity
  'recipe_0448',
  'recipe_0449',
  'recipe_0451',
  'recipe_0452',
  'recipe_0453',
  'recipe_0454',
  'recipe_0456',
  'recipe_0457',
  // toddler — lunch / soup / side / snack variety
  'recipe_0458',
  'recipe_0461',
  'recipe_0464',
  'recipe_0468',
  'recipe_0471',
  // elementary — lunchbox / breakfast / dinner / snack
  'recipe_0472',
  'recipe_0475',
  'recipe_0477',
  'recipe_0480',
  'recipe_0483',
] as const;

const BATCH3_PILOT_SLOT_PICKS: Record<
  string,
  { prepOrder: number; cookOrder: number; finishOrder: number }
> = {
  recipe_0457: { prepOrder: 1, cookOrder: 2, finishOrder: 5 }, // fish cook + debone + finish
  recipe_0454: { prepOrder: 1, cookOrder: 4, finishOrder: 5 }, // soak / simmer / mash plate
  recipe_0475: { prepOrder: 1, cookOrder: 2, finishOrder: 4 }, // prep / egg / roll
};

/** Batch #4 step pilot — toddler 8, elementary 8. */
const BATCH4_STEP_PILOT_IDS = [
  // toddler — rice/rice ball 2
  'recipe_0484',
  'recipe_0487',
  // toddler — pancake/jeon 2
  'recipe_0492',
  'recipe_0494',
  // toddler — yogurt/snack 2
  'recipe_0496',
  'recipe_0498',
  // toddler — other 2
  'recipe_0485',
  'recipe_0495',
  // elementary — donburi/fried rice 4
  'recipe_0500',
  'recipe_0501',
  'recipe_0503',
  'recipe_0505',
  // elementary — tortilla/toast 2
  'recipe_0510',
  'recipe_0512',
  // elementary — snack 2
  'recipe_0513',
  'recipe_0515',
] as const;

const BATCH4_PILOT_SLOT_PICKS: Record<
  string,
  { prepOrder: number; cookOrder: number; finishOrder: number }
> = {
  recipe_0487: { prepOrder: 1, cookOrder: 3, finishOrder: 5 }, // chop / cook chicken / shape balls
  recipe_0492: { prepOrder: 1, cookOrder: 3, finishOrder: 4 }, // mash / batter / pan cook
  recipe_0512: { prepOrder: 1, cookOrder: 3, finishOrder: 4 }, // prep / fill / roll
};

function buildMissingQueue() {
  const missing = HANKKI_RECIPES.filter((r) => {
    const aud = childAudience(r.familyAudience.audiences);
    if (!aud) return false;
    return !heroFileExists((r.heroImageKey || '').trim());
  });

  const entries = missing.map((r) => {
    const audience = childAudience(r.familyAudience.audiences)!;
    const baby = r.familyAudience.babyFood;
    const entry: Record<string, unknown> = {
      recipeId: r.id,
      name: r.name,
      audience,
      heroImageKey: r.heroImageKey,
      ingredients: ingredientsOf(r),
      steps: stepsOf(r),
      finishDescription: finishDescription(r, audience),
    };
    if (audience === 'baby') {
      entry.stage = baby?.stage ?? null;
      entry.texture = baby?.texture ?? null;
    }
    return entry;
  });

  const rank = { baby: 0, toddler: 1, elementary: 2 } as const;
  entries.sort((a, b) => {
    const ra = rank[a.audience as ChildAudience] - rank[b.audience as ChildAudience];
    if (ra !== 0) return ra;
    return String(a.recipeId).localeCompare(String(b.recipeId));
  });

  return {
    summary: {
      totalMissing: entries.length,
      byAudience: {
        baby: entries.filter((e) => e.audience === 'baby').length,
        toddler: entries.filter((e) => e.audience === 'toddler').length,
        elementary: entries.filter((e) => e.audience === 'elementary').length,
      },
    },
    recipes: entries,
  };
}

function byOrder(steps: StepRow[], order: number): StepRow {
  const s = steps.find((x) => x.order === order);
  if (!s) throw new Error(`Missing step order ${order}`);
  return s;
}

function buildPilotQueueForIds(
  ids: readonly string[],
  slotPicks: Record<string, { prepOrder: number; cookOrder: number; finishOrder: number }>,
) {
  const recipes = ids.map((id) => {
    const r = HANKKI_RECIPES.find((x) => x.id === id);
    if (!r) throw new Error(`Pilot recipe missing: ${id}`);
    const audience = childAudience(r.familyAudience.audiences);
    if (!audience) throw new Error(`Pilot ${id} has no child audience`);
    const steps = stepsOf(r);
    const ings = ingredientsOf(r);
    const texture = r.familyAudience.babyFood?.texture ?? null;
    const picks = slotPicks[id] ?? (() => {
      const auto = pickStepSlots(steps);
      return {
        prepOrder: auto.prep.order,
        cookOrder: auto.cook.order,
        finishOrder: auto.finish.order,
      };
    })();
    const prep = byOrder(steps, picks.prepOrder);
    const cook = byOrder(steps, picks.cookOrder);
    const finish = byOrder(steps, picks.finishOrder);

    const entry: Record<string, unknown> = {
      recipeId: r.id,
      name: r.name,
      audience,
      heroImageKey: r.heroImageKey,
      heroFileExists: heroFileExists(r.heroImageKey),
      ingredients: ings,
      steps,
      finishDescription: finishDescription(r, audience),
      stepSlots: {
        prep: {
          imageKey: prep.imageKey,
          order: prep.order,
          title: prep.title,
          instruction: prep.instruction,
          visualDescription: visualForStep('prep', prep, ings, audience, texture),
        },
        cook: {
          imageKey: cook.imageKey,
          order: cook.order,
          title: cook.title,
          instruction: cook.instruction,
          visualDescription: visualForStep('cook', cook, ings, audience, texture),
        },
        finish: {
          imageKey: finish.imageKey,
          order: finish.order,
          title: finish.title,
          instruction: finish.instruction,
          visualDescription: visualForStep('finish', finish, ings, audience, texture),
        },
      },
    };
    if (audience === 'baby') {
      entry.stage = r.familyAudience.babyFood?.stage ?? null;
      entry.texture = texture;
    }
    return entry;
  });

  return {
    summary: {
      total: recipes.length,
      baby: recipes.filter((r) => r.audience === 'baby').length,
      toddler: recipes.filter((r) => r.audience === 'toddler').length,
      elementary: recipes.filter((r) => r.audience === 'elementary').length,
      stages: {
        early: recipes.filter((r) => r.stage === 'early').length,
        middle: recipes.filter((r) => r.stage === 'middle').length,
        late: recipes.filter((r) => r.stage === 'late').length,
        completion: recipes.filter((r) => r.stage === 'completion').length,
      },
      recipeIds: recipes.map((r) => r.recipeId),
    },
    recipes,
  };
}

function buildPilotQueue() {
  return buildPilotQueueForIds(PILOT_IDS, PILOT_SLOT_PICKS);
}

function buildBatch3PilotQueue() {
  return buildPilotQueueForIds(BATCH3_STEP_PILOT_IDS, {
    ...PILOT_SLOT_PICKS,
    ...BATCH3_PILOT_SLOT_PICKS,
  });
}

function buildBatch4PilotQueue() {
  return buildPilotQueueForIds(BATCH4_STEP_PILOT_IDS, {
    ...PILOT_SLOT_PICKS,
    ...BATCH4_PILOT_SLOT_PICKS,
  });
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const missing = buildMissingQueue();
  const pilot = buildPilotQueue();
  const batch3Pilot = buildBatch3PilotQueue();
  const batch4Pilot = buildBatch4PilotQueue();
  fs.writeFileSync(
    path.join(OUT_DIR, 'child-missing-hero-queue.json'),
    JSON.stringify(missing, null, 2) + '\n',
    'utf8',
  );
  fs.writeFileSync(
    path.join(OUT_DIR, 'child-step-pilot-queue.json'),
    JSON.stringify(pilot, null, 2) + '\n',
    'utf8',
  );
  fs.writeFileSync(
    path.join(OUT_DIR, 'child-step-pilot-queue-batch3.json'),
    JSON.stringify(batch3Pilot, null, 2) + '\n',
    'utf8',
  );
  fs.writeFileSync(
    path.join(OUT_DIR, 'child-step-pilot-queue-batch4.json'),
    JSON.stringify(batch4Pilot, null, 2) + '\n',
    'utf8',
  );
  console.log(
    JSON.stringify(
      {
        missingTotal: missing.summary.totalMissing,
        missingByAudience: missing.summary.byAudience,
        pilotIds: pilot.summary.recipeIds,
        batch3PilotIds: batch3Pilot.summary.recipeIds,
        batch3PilotStages: batch3Pilot.summary.stages,
        batch4PilotIds: batch4Pilot.summary.recipeIds,
      },
      null,
      2,
    ),
  );
}

main();
