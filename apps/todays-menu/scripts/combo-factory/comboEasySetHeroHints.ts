/**
 * Sprint 53 — HANKKI Convenience EASY_SET Hero Style v2.0 prompts.
 */
export const EASY_SET_HERO_V2_VERSION = '2.0';

export const EASY_SET_NEGATIVE_BLOCK =
  'Show only the convenience-store products included in this easy-set combo. Each product stays visually separate — never mixed, stirred, or merged into one bowl or one finished dish. No unrelated foods, no extra utensils, no chopsticks, no spoons unless part of the drink, no napkins, no packaging wrappers, no branded product packages, no people, no hands, no text, no logos, no brand names, no price tags. No wide table spread, no distant camera, no catalog lineup with large empty gaps between items.';

export const EASY_SET_FRAMING_BLOCK =
  'Tight cohesive easy-set layout. All set items arranged closely together in one frame filling approximately 82-90% of the image. Items remain identifiable and separate — the viewer should immediately understand these are bought together as a set, not one mixed hack dish. Drinks and fruit in secondary positions. Warm bright cream-toned background; bright soft natural daylight; close elevated 3/4 camera; 1344x768 JPG 16:9 landscape; harmonize with HANKKI cream-tone mobile UI; modest bottom safe margin for mobile card overlay.';

export const EASY_SET_HERO_BASE = `${EASY_SET_NEGATIVE_BLOCK} ${EASY_SET_FRAMING_BLOCK}`;

/** Per-imageKey dish identity for all 29 EASY_SET combos. */
export const EASY_SET_HERO_HINTS: Record<string, string> = {
  lunchbox_cup_rice_set:
    'Convenience lunchbox tray and heated cup rice side by side, plus a generic drink cup in secondary position; three separate items closely grouped not mixed; lunchbox lid open showing rice and sides; cup rice in its cup container; no merging into one plate.',
  burger_fries_set:
    'Convenience burger, fries portion, and drink cup as three separate items closely arranged; burger not deconstructed; fries beside burger not scattered across table; no brand packaging.',
  sandwich_yogurt_set:
    'Triangle or rectangular sandwich, yogurt cup, and small fruit pieces as separate items in tight grouping; sandwich intact not cut into scattered pieces; yogurt cup beside sandwich; light meal set not cafe plating.',
  gimbap_udon_set:
    'Gimbap roll, cup udon noodles in cup or small bowl, and drink in secondary position; gimbap and udon clearly separate not in same bowl; udon noodles visible in broth; cozy close grouping.',
  chicken_tender_rice_set:
    'Chicken tenders on small plate, instant rice portion, and drink; chicken and rice separate not mixed; tenders golden and identifiable; rice in bowl or tray beside chicken.',
  tofu_bibim_rice_ball_set:
    'Cold tofu bibim noodles in container, rice ball on wrapper or small plate, drink secondary; noodles and rice ball separate items closely placed; not stirred together.',
  salad_chicken_breast_set:
    'Salad container, warmed chicken breast portion, and bread slice as three separate items; salad greens visible; chicken beside salad not mixed in; no extra dressing bottles.',
  triangle_kimbap_triple_set:
    'Three triangle kimbap pieces closely grouped, still wrapped or partially opened; all three visible and identifiable; no other foods added; tight framing of kimbap only.',
  sundae_plate_set:
    'Steamed sundae slices on small plate with dipping sauce in small cup beside; single-plate easy set focused on sundae; sauce close but separate; no unrelated sides.',
  ramen_rice_ball_set:
    'Cup ramen in cup with noodles visible, rice ball beside on wrapper, drink in secondary position; ramen and rice ball separate not mixed into same bowl; close cozy grouping not wide spread.',
  chicken_nugget_plate_set:
    'Chicken nuggets on plate with small sauce cup beside; nuggets golden and grouped; sauce separate small container; no fries or unrelated items.',
  spicy_pepper_ramen_set:
    'Spicy cup ramen in cup with visible chili garnish, no extra items unless in data; ramen as hero with optional small green chili slices on top; not mixed hack dish.',
  spicy_sundae_set:
    'Spicy sundae slices on plate only; red spicy sauce visible on sundae; single-item easy set; tight framing; no unrelated foods.',
  spicy_chicken_feet_set:
    'Spicy chicken feet portion on small plate; single-item easy set; glossy spicy coating visible; tight close framing; no unrelated sides.',
  triangle_kimbap_milk_set:
    'Triangle kimbap, milk carton or bottle, and banana as three separate items closely grouped; kimbap beside milk and banana not merged; banana peel partially visible; budget breakfast set layout.',
  commute_lunchbox_set:
    'Single convenience lunchbox tray open showing rice and sides; one lunchbox only; lid open; tight framing; no extra items beyond lunchbox.',
  lunch_sandwich_set:
    'Single sandwich pack opened showing sandwich; one sandwich hero; tight framing; no unrelated drinks unless in combo data.',
  gimbap_ramen_set:
    'Gimbap roll and cup ramen as two main items closely grouped; gimbap beside ramen cup not in same bowl; ramen noodles visible; optional drink secondary.',
  light_salad_set:
    'Single salad container with greens and vegetables visible; one salad only; tight framing filling frame; no extra protein packs unless in data.',
  fruit_plate_set:
    'Cut fruit pieces in clear container or on small plate; colorful fruit only; tight framing; no yogurt or unrelated items.',
  tofu_salad_set:
    'Tofu salad container with tofu cubes and greens visible; single salad item; light healthy meal; tight framing.',
  vegetable_juice_set:
    'Vegetable juice bottle or cup as single hero item; label-free generic bottle; tight framing; no extra snacks.',
  konjac_light_meal_set:
    'Konjac jelly or konjac snack pack opened showing contents; single light meal item; tight framing; no unrelated sides.',
  boiled_egg_kim_set:
    'Two boiled eggs and dried seaweed sheets as separate items closely grouped; eggs peeled showing white; kim sheets beside eggs not wrapped around; protein snack set not mixed bowl.',
  tofu_protein_set:
    'Tofu block or tofu cup with salad container and drink as separate items; tofu identifiable; closely grouped protein set.',
  chicken_protein_set:
    'Chicken tenders or chicken portion with salad and drink as three separate items closely arranged; protein-focused set not mixed.',
  dessert_bread_set:
    'Sweet bread or pastry, milk drink, and small fruit pieces as three separate dessert items closely grouped; bread hero beside milk and fruit; not merged parfait; cozy dessert set.',
  hangover_bean_sprout_soup_set:
    'Hot bean sprout soup in bowl or heatable container as single hero; steam visible; single soup item; tight framing; no rice or egg mixed in.',
  hangover_dried_pollack_soup_set:
    'Hot dried pollack hangover soup in bowl or container as single hero; broth and pollack visible; single soup item; tight framing.',
};
