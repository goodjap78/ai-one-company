/**
 * Name / ingredient / steps consistency gate (scoped).
 * Rules aligned with test-child-content-expansion-batch1.ts.
 * CRITICAL/HIGH → blockers. MEDIUM/LOW → warnings only.
 */
import type { Recipe } from '../../data/recipes/types';
import type { ConsistencyFinding, Severity } from './types';

const CORE: Array<{ re: RegExp; keys: RegExp }> = [
  { re: /참치/, keys: /참치|tuna/i },
  { re: /멸치/, keys: /멸치|anchovy/i },
  { re: /계란|에그|스크램블|오믈렛/, keys: /계란|egg/i },
  { re: /소고기|불고기/, keys: /소고기|beef/i },
  { re: /닭|치킨/, keys: /닭|chicken/i },
  { re: /두부/, keys: /두부|tofu/i },
  { re: /김가루|김밥|^김/, keys: /김|seaweed/i },
  { re: /치즈/, keys: /치즈|cheese/i },
  { re: /햄/, keys: /햄|ham/i },
  { re: /바나나/, keys: /바나나|banana/i },
  { re: /사과/, keys: /사과|apple|pear/i },
  { re: /배(?!추)/, keys: /배|pear/i },
  { re: /단호박/, keys: /단호박|pumpkin|sweet_potato/i },
  { re: /브로콜리/, keys: /브로콜리|broccoli/i },
  { re: /애호박/, keys: /애호박|zucchini/i },
  { re: /양배추/, keys: /양배추|cabbage/i },
  { re: /청경채/, keys: /청경채|spinach|cabbage/i },
  { re: /당근/, keys: /당근|carrot/i },
  { re: /감자/, keys: /감자|potato/i },
  { re: /버섯/, keys: /버섯|mushroom/i },
  { re: /콩나물/, keys: /콩나물|bean_sprout|sprout/i },
  { re: /흰살생선|생선/, keys: /흰살생선|생선|fish/i },
  { re: /요거트|요구르트/, keys: /요거트|요구르트|yogurt|milk/i },
  { re: /마요(?!거트)/, keys: /마요|mayo/i },
  { re: /토마토|피자/, keys: /토마토|tomato/i },
  { re: /우동/, keys: /우동|udon|rice_cake/i },
  { re: /토스트|식빵/, keys: /식빵|bread/i },
];

function push(
  findings: ConsistencyFinding[],
  recipe: Recipe,
  code: string,
  severity: Severity,
  issue: string,
): void {
  findings.push({
    recipeId: recipe.id,
    recipeName: recipe.name,
    code,
    severity,
    issue,
  });
}

export function runConsistencyGate(recipes: Recipe[]): ConsistencyFinding[] {
  const findings: ConsistencyFinding[] = [];

  for (const r of recipes) {
    const ingBlob = r.ingredients.map((i) => `${i.name} ${i.iconKey ?? ''}`).join(' ');
    const stepBlob = r.recipe.steps.map((s) => `${s.title} ${s.instruction}`).join(' ');

    for (const rule of CORE) {
      if (!rule.re.test(r.name)) continue;
      if (!rule.keys.test(ingBlob)) {
        push(
          findings,
          r,
          'NAME_CORE_INGREDIENT_MISSING',
          'CRITICAL',
          `name matches ${rule.re} but ingredients lack match`,
        );
      } else if (!rule.keys.test(stepBlob)) {
        push(
          findings,
          r,
          'NAME_CORE_INGREDIENT_NOT_USED_IN_STEPS',
          'HIGH',
          `core ingredient for ${rule.re} not used in steps`,
        );
      }
    }

    if (/로제/.test(r.name) && !/토마토|우유|크림|치즈/.test(ingBlob)) {
      push(findings, r, 'STYLE_MISMATCH', 'CRITICAL', 'rose style missing tomato/dairy');
    }
    if (/마요(?!거트)/.test(r.name) && !/마요/.test(ingBlob)) {
      push(findings, r, 'STYLE_MISMATCH', 'HIGH', 'mayo missing in ingredients');
    }
    if (/피자/.test(r.name) && !/토마토|치즈/.test(ingBlob)) {
      push(findings, r, 'STYLE_MISMATCH', 'HIGH', 'pizza sauce/cheese missing');
    }

    if (r.nutrition.source !== 'unverified') {
      push(findings, r, 'NUTRITION_SOURCE', 'MEDIUM', 'nutrition.source not unverified');
    }
    if (!r.heroImageKey?.trim() || r.heroImageKey.length < 4) {
      push(findings, r, 'HERO_KEY', 'MEDIUM', 'missing heroImageKey');
    }

    const allergy = r.standardMetadata.allergyTags ?? [];
    if (/참치|멸치|흰살생선|생선/.test(r.name) && !allergy.includes('fish')) {
      push(findings, r, 'ALLERGY_MISMATCH', 'HIGH', 'fish allergy tag missing');
    }
    if (/계란|스크램블|오믈렛/.test(r.name) && !allergy.includes('egg')) {
      push(findings, r, 'ALLERGY_MISMATCH', 'HIGH', 'egg allergy tag missing');
    }
    if (/소고기/.test(r.name) && !allergy.includes('beef')) {
      push(findings, r, 'ALLERGY_MISMATCH', 'HIGH', 'beef allergy tag missing');
    }
    if (/닭/.test(r.name) && !allergy.includes('chicken')) {
      push(findings, r, 'ALLERGY_MISMATCH', 'HIGH', 'chicken allergy tag missing');
    }
    if (/두부/.test(r.name) && !allergy.includes('soy')) {
      push(findings, r, 'ALLERGY_MISMATCH', 'HIGH', 'soy allergy tag missing');
    }
    if (
      /요거트|요구르트|치즈|버터|우유/.test(r.name) &&
      !allergy.includes('milk') &&
      /요거트|요구르트|치즈/.test(r.name)
    ) {
      push(findings, r, 'ALLERGY_MISMATCH', 'HIGH', 'milk allergy tag missing');
    }

    if (r.recipe.steps.length < 4 || r.recipe.steps.length > 6) {
      push(findings, r, 'STEP_COUNT', 'MEDIUM', `steps count ${r.recipe.steps.length}`);
    }
  }

  return findings;
}
