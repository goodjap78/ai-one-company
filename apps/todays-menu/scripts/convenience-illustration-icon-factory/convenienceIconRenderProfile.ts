/**
 * Sprint 56-A — derived from production ingredient PNG measurements.
 * Run: npx tsx scripts/convenience-illustration-icon-factory/buildRenderProfile.ts
 */
import type { IngredientPngMetrics } from './analyzeIngredientPng';
import { INGREDIENT_IMAGE_SPEC } from '../ingredient-factory/config';
import {
  HANKKI_INGREDIENT_ICON_STYLE_VERSION,
  buildIngredientPromptText,
} from '../ingredient-factory/buildPrompts';
import {
  buildConvenienceIconPromptHeader,
  CUP_RICE_NEXT_PILOT,
  CUP_RICE_V11_GENERATION,
  TRIANGLE_KIMBAP_NEXT_PILOT,
  TRIANGLE_KIMBAP_PILOT_GENERATION,
  TRIANGLE_KIMBAP_V11_GENERATION,
  TRIANGLE_KIMBAP_V12_GENERATION,
  MILK_NEXT_PILOT,
  MILK_PILOT_GENERATION,
  SALAD_NEXT_PILOT,
  SALAD_PILOT_GENERATION,
  LUNCHBOX_NEXT_PILOT,
  PHASE1_BATCH_GENERATION,
  SANDWICH_NEXT_PILOT,
  HAMBURGER_NEXT_PILOT,
  HOT_BAR_NEXT_PILOT,
  CUP_UDON_NEXT_PILOT,
} from './convenienceIconStyleLock';

export type ConvenienceIconRenderProfile = {
  version: '56-A-v1';
  derivedFrom: string[];
  masterSpec: typeof INGREDIENT_IMAGE_SPEC;
  styleVersion: typeof HANKKI_INGREDIENT_ICON_STYLE_VERSION;
  background: {
    policy: 'opaque_uniform' | 'transparent' | 'mixed';
    rgb: { r: number; g: number; b: number };
    alphaMean: number;
    /** Do not use transparent PNG unless production set uses transparent. */
    forbidArbitraryTransparency: true;
  };
  layout: {
    bboxAreaRatioMean: number;
    bboxAreaRatioMin: number;
    bboxAreaRatioMax: number;
    foregroundPixelRatioMean: number;
    paddingTopPctMean: number;
    paddingBottomPctMean: number;
    paddingLeftPctMean: number;
    paddingRightPctMean: number;
  };
  shadow: {
    bottomBandStartPct: number;
    meanPixelCount: number;
    meanDarkening: number;
  };
  uiDisplaySizesPx: readonly [40, 48, 64, 128];
  appCardPreviewBg: '#FFFCF7';
};

export function buildRenderProfileFromMetrics(
  metrics: IngredientPngMetrics[],
): ConvenienceIconRenderProfile {
  const layoutMetrics = metrics.filter((m) => m.bboxAreaRatio < 0.85);
  const n = layoutMetrics.length > 0 ? layoutMetrics.length : metrics.length;
  const layoutSet = layoutMetrics.length > 0 ? layoutMetrics : metrics;
  const sum = (fn: (m: IngredientPngMetrics) => number) =>
    layoutSet.reduce((s, m) => s + fn(m), 0) / n;

  const opaqueRefs = metrics.filter((m) => m.backgroundPolicy === 'opaque_uniform');
  const bgSource = opaqueRefs.length > 0 ? opaqueRefs : metrics;

  const bgR = Math.round(
    bgSource.reduce((s, m) => s + m.backgroundRgb.r, 0) / bgSource.length,
  );
  const bgG = Math.round(
    bgSource.reduce((s, m) => s + m.backgroundRgb.g, 0) / bgSource.length,
  );
  const bgB = Math.round(
    bgSource.reduce((s, m) => s + m.backgroundRgb.b, 0) / bgSource.length,
  );

  const bgPolicies = metrics.map((m) => m.backgroundPolicy);
  const policy = bgPolicies.every((p) => p === 'opaque_uniform')
    ? 'opaque_uniform'
    : bgPolicies.every((p) => p === 'transparent')
      ? 'transparent'
      : opaqueRefs.length >= 4
        ? 'opaque_uniform'
        : 'mixed';

  return {
    version: '56-A-v1',
    derivedFrom: metrics.map((m) => m.iconKey),
    masterSpec: INGREDIENT_IMAGE_SPEC,
    styleVersion: HANKKI_INGREDIENT_ICON_STYLE_VERSION,
    background: {
      policy,
      rgb: { r: bgR, g: bgG, b: bgB },
      alphaMean: sum((m) => m.backgroundAlphaMean),
      forbidArbitraryTransparency: true,
    },
    layout: {
      bboxAreaRatioMean: sum((m) => m.bboxAreaRatio),
      bboxAreaRatioMin: Math.min(...layoutSet.map((m) => m.bboxAreaRatio)),
      bboxAreaRatioMax: Math.max(...layoutSet.map((m) => m.bboxAreaRatio)),
      foregroundPixelRatioMean: sum((m) => m.foregroundPixelRatio),
      paddingTopPctMean: sum((m) => m.paddingTopPct),
      paddingBottomPctMean: sum((m) => m.paddingBottomPct),
      paddingLeftPctMean: sum((m) => m.paddingLeftPct),
      paddingRightPctMean: sum((m) => m.paddingRightPct),
    },
    shadow: {
      bottomBandStartPct: sum((m) => (m.shadowBand.bottomRowStart / m.height) * 100),
      meanPixelCount: sum((m) => m.shadowBand.pixelCount),
      meanDarkening: sum((m) => m.shadowBand.meanDarkening),
    },
    uiDisplaySizesPx: [40, 48, 64, 128],
    appCardPreviewBg: '#FFFCF7',
  };
}

export function buildCupRamenPrompt(profile: ConvenienceIconRenderProfile): string {
  const base = buildIngredientPromptText({
    iconKey: 'cup_ramen',
    koreanName: '컵라면',
    aliases: ['라면', '매운 컵라면'],
  });

  const bg = profile.background;
  const bgLine =
    bg.policy === 'opaque_uniform'
      ? `Background must match production ingredient icons: solid opaque warm cream RGB(${bg.rgb.r},${bg.rgb.g},${bg.rgb.b}), not transparent, no chroma key, no cutout.`
      : 'Background must match production ingredient icon transparency policy exactly.';

  const layout = profile.layout;
  const subjectLines = [
    'Subject: a single convenience-store cup ramen (not a paper cup, not a real brand package).',
    'Shape: cup wider at top, tapered below; lid rim or open top edge clearly visible.',
    'Show 2-3 noodle strands peeking from the top only.',
    'Cup body white or warm cream; one horizontal orange brand-free band (#FF8C42) with NO text, logo, barcode, or Korean/English letters.',
    'No store brands, no photo realism, no glossy stock-photo look.',
    `Object scale: match production ingredient icon average footprint (~${(layout.bboxAreaRatioMean * 100).toFixed(1)}% bbox area, padding top ~${layout.paddingTopPctMean.toFixed(1)}%, bottom ~${layout.paddingBottomPctMean.toFixed(1)}%).`,
    'Soft contact shadow under the cup like other HANKKI ingredient icons.',
  ].join(' ');

  return `${base} ${bgLine} ${subjectLines}`;
}

/** Sprint 56-A.1 — same style, fewer details for small UI legibility. */
export function buildCupRamenSimplifiedPrompt(profile: ConvenienceIconRenderProfile): string {
  const base = buildIngredientPromptText({
    iconKey: 'cup_ramen',
    koreanName: '컵라면',
    aliases: ['라면', '매운 컵라면'],
  });

  const bg = profile.background;
  const bgLine =
    bg.policy === 'opaque_uniform'
      ? `Background must match production ingredient icons: solid opaque warm cream RGB(${bg.rgb.r},${bg.rgb.g},${bg.rgb.b}), not transparent, no chroma key, no cutout.`
      : 'Background must match production ingredient icon transparency policy exactly.';

  const layout = profile.layout;
  const bboxTarget = (layout.bboxAreaRatioMean * 100).toFixed(1);

  const simplifyLines = [
    'Subject: ONE simple convenience-store cup ramen icon (not paper cup, not brand package).',
    'CRITICAL simplification: NO silver foil lid, NO peeled lid, NO metallic lid, NO lid flap.',
    'Open cup top with a simple rounded rim only; matte cream cup body, no photo gloss, no HDR, no hyper-real shine.',
    'Noodles: only 2 or 3 short noodle strands barely peeking INSIDE the cup opening; NO lifted noodles, NO floating noodles, NO chopsticks, NO steam.',
    'Toppings: maximum 1 or 2 tiny flat color dots only (e.g. one green dot, one orange dot); no vegetables, no garnish piles.',
    'One plain horizontal orange band (#FF8C42) on cup midsection — NO text, logo, barcode, Korean or English letters.',
    'Cup silhouette (tapered cup ramen shape) + orange band must be the strongest recognition cues at 40px.',
    `Keep object footprint between 32% and 38% bbox area (reference mean ~${bboxTarget}%); padding similar to ingredient icons (~${layout.paddingTopPctMean.toFixed(1)}% top, ~${layout.paddingBottomPctMean.toFixed(1)}% bottom).`,
    'Soft matte contact shadow only; same semi-flat 3D illustration family as HANKKI ingredient icons.',
    'Fewer lines and fewer colors than a hero food photo; cute, rounded, friendly, child-safe simplicity.',
  ].join(' ');

  return `${base} ${bgLine} ${simplifyLines}`;
}

/** Sprint 56-A.2 — v1 master footprint; trim lid/lifted noodles only. */
export function buildCupRamenV15Prompt(profile: ConvenienceIconRenderProfile): string {
  const base = buildIngredientPromptText({
    iconKey: 'cup_ramen',
    koreanName: '컵라면',
    aliases: ['라면', '매운 컵라면'],
  });

  const bg = profile.background;
  const bgLine =
    bg.policy === 'opaque_uniform'
      ? `Background must match production ingredient icons: solid opaque warm cream RGB(${bg.rgb.r},${bg.rgb.g},${bg.rgb.b}), not transparent, no chroma key, no cutout.`
      : 'Background must match production ingredient icon transparency policy exactly.';

  const layout = profile.layout;
  const v15Lines = [
    'Subject: ONE convenience-store cup ramen icon with v1 master recognition (not paper cup, not brand package).',
    'MASTER v1 fidelity: keep the SAME cup size, overall proportions, orange horizontal band (#FF8C42), tapered cup ramen silhouette, warm cream cup body, and ingredient-icon tone as the approved v1 pilot.',
    'REMOVE from v1 only: NO silver foil lid, NO metallic film lid, NO peeled lid flap, NO sealed lid.',
    'Open cup top with a clean rounded rim (opened cup, rim clearly visible).',
    'Noodles: only 2 or 3 short noodle strands barely visible INSIDE the cup opening; NO lifted noodles above the rim, NO floating noodles, NO chopsticks, NO steam.',
    'Toppings: maximum 1 or 2 tiny flat color dots only (e.g. one green dot, one orange dot); no garnish piles, no vegetables.',
    'Gloss: slightly softer than v1 — gentle matte semi-flat finish, NOT hyper-real shine, NOT HDR, NOT stock-photo gloss.',
    'DO NOT shrink the cup like the v2 simplified pilot — object footprint must stay at v1 scale (~35-38% bbox area; reference v1 ~36.9%); padding similar to v1 (~21% top, ~24% bottom), NOT the smaller v2 footprint.',
    'One plain horizontal orange band (#FF8C42) on cup midsection — NO text, logo, barcode, Korean or English letters.',
    'Soft contact shadow under the cup; same semi-flat 3D illustration family as HANKKI ingredient icons.',
    `Reference ingredient icon layout mean ~${(layout.bboxAreaRatioMean * 100).toFixed(1)}% bbox — match v1 presence, not v2 minimalism.`,
    'Cute, rounded, friendly, child-safe; fewer lid/noodle clutter than v1 but stronger cup presence than v2.',
  ].join(' ');

  return `${base} ${bgLine} ${v15Lines}`;
}

/** Sprint 56-A.3 — cup_rice pilot prompt (write-only until generation approved). */
export function buildCupRicePilotPrompt(profile: ConvenienceIconRenderProfile): string {
  const base = buildConvenienceIconPromptHeader({
    iconKey: CUP_RICE_NEXT_PILOT.iconKey,
    koreanName: CUP_RICE_NEXT_PILOT.koreanName,
    aliases: [...CUP_RICE_NEXT_PILOT.aliases],
  });

  const bg = profile.background;
  const bgLine =
    bg.policy === 'opaque_uniform'
      ? `Background must match locked style: solid opaque warm cream RGB(${bg.rgb.r},${bg.rgb.g},${bg.rgb.b}), not transparent, no chroma key, no cutout.`
      : 'Background must match production ingredient icon transparency policy exactly.';

  const layout = profile.layout;
  const cupRiceLines = [
    'Subject: ONE convenience-store cup rice / instant rice cup icon (NOT a rice bowl, NOT a paper cup, NOT brand package).',
    'Shape: SHORTER and WIDER than cup ramen — low wide convenience cup silhouette; clearly different from tapered tall cup ramen.',
    `Cup body dark charcoal or near-black ${CUP_RICE_NEXT_PILOT.bodyHex}; one horizontal yellow or orange band (${CUP_RICE_NEXT_PILOT.accentBandHex} or ${CUP_RICE_NEXT_PILOT.accentBandAltHex}) on midsection — NO text, logo, barcode, Korean or English letters.`,
    'Top opening: open rounded rim; a few tiny cream-white rice grains barely visible at the top opening only (3-5 small grains max); NOT a rice pile, NOT garnish.',
    'NO silver foil lid, NO metallic film, NO peeled flap, NO chopsticks, NO steam.',
    'Match approved cup_ramen master family: semi-flat matte finish, soft contact shadow, rounded friendly silhouette, same warm cream background family.',
    `Object footprint ~35-38% bbox area (reference mean ~${(layout.bboxAreaRatioMean * 100).toFixed(1)}%, cup_ramen master ~37.4%); padding similar to cup_ramen master for 40px legibility.`,
    'DO NOT look like a dining rice bowl; DO NOT copy instant-rice brand packaging exactly.',
  ].join(' ');

  return `${base} ${bgLine} ${cupRiceLines}`;
}

/** Sprint 56-B.1 — same cup_rice v1 design; scale object ~12-18% larger for bbox 33-38%. */
export function buildCupRiceV11Prompt(profile: ConvenienceIconRenderProfile): string {
  const base = buildConvenienceIconPromptHeader({
    iconKey: CUP_RICE_NEXT_PILOT.iconKey,
    koreanName: CUP_RICE_NEXT_PILOT.koreanName,
    aliases: [...CUP_RICE_NEXT_PILOT.aliases],
  });

  const bg = profile.background;
  const bgLine =
    bg.policy === 'opaque_uniform'
      ? `Background must match locked style: solid opaque warm cream RGB(${bg.rgb.r},${bg.rgb.g},${bg.rgb.b}), not transparent, no chroma key, no cutout — SAME as cup_rice v1.`
      : 'Background must match production ingredient icon transparency policy exactly.';

  const layout = profile.layout;
  const v11Lines = [
    'SCALE-UP ONLY of approved cup_rice v1 — preserve exact design: low wide dark cup, yellow band, rice mound at top.',
    'DO NOT redesign colors, background, shadow style, or matte finish.',
    'Subject: SAME cup rice icon (NOT rice bowl, NOT paper cup, NOT brand package).',
    'Shape: low wide cup — wider than tall, NOT tall like cup ramen.',
    `Cup body ${CUP_RICE_NEXT_PILOT.bodyHex}; yellow band ${CUP_RICE_NEXT_PILOT.accentBandHex}; rice mound at top — NO text, logo, barcode.`,
    'SCALE-UP ONLY: render IDENTICAL v1 design at 1.35x–1.5x on canvas — same proportions, bigger footprint.',
    `Mandatory bbox ${CUP_RICE_V11_GENERATION.targetBboxMinPct}-${CUP_RICE_V11_GENERATION.targetBboxMaxPct}% (v1 ~26.6% too small; master ~37.4%).`,
    'Match cup_ramen master visual mass at 40px; reduce empty margin; NO edge cropping; soft contact shadow under cup.',
    `Ref layout mean ~${(layout.bboxAreaRatioMean * 100).toFixed(1)}%.`,
  ].join(' ');

  return `${base} ${bgLine} ${v11Lines}`;
}

/** Sprint 56-B.2 — triangle_kimbap pilot prompt (write-only until generation approved). */
export function buildTriangleKimbapPilotPrompt(profile: ConvenienceIconRenderProfile): string {
  const base = buildConvenienceIconPromptHeader({
    iconKey: TRIANGLE_KIMBAP_NEXT_PILOT.iconKey,
    koreanName: TRIANGLE_KIMBAP_NEXT_PILOT.koreanName,
    aliases: [...TRIANGLE_KIMBAP_NEXT_PILOT.aliases],
  });

  const bg = profile.background;
  const bgLine =
    bg.policy === 'opaque_uniform'
      ? `Background must match locked style: solid opaque warm cream RGB(${bg.rgb.r},${bg.rgb.g},${bg.rgb.b}), not transparent, no chroma key, no cutout.`
      : 'Background must match production ingredient icon transparency policy exactly.';

  const layout = profile.layout;
  const kimbapLines = [
    'Subject: ONE convenience-store triangle kimbap icon (NOT round rice ball / jumeokbap, NOT brand package).',
    'Shape: CLEAR TRIANGLE silhouette — triangular onigiri-style pack; point-up triangle readable at 40px.',
    `Seaweed wrap: matte black ${TRIANGLE_KIMBAP_NEXT_PILOT.seaweedHex} OR dark green ${TRIANGLE_KIMBAP_NEXT_PILOT.seaweedGreenHex} — strong contrast with rice.`,
    `Cream rice exposed at lower third ${TRIANGLE_KIMBAP_NEXT_PILOT.riceHex}; NOT a round ball shape.`,
    'Inside filling: maximum 1-2 tiny flat color dots only; NO garnish piles, NO visible chunks.',
    'Plastic wrap: NONE or extremely minimal simple edge — NO glossy plastic bag, NO brand packaging copy.',
    'NO flavor label, NO barcode, NO Korean/English text, NO logo.',
    'Style: semi-flat matte 3D, rounded friendly edges, soft contact shadow — same family as cup_ramen and cup_rice masters.',
    `Object footprint ${TRIANGLE_KIMBAP_PILOT_GENERATION.targetBboxMinPct}-${TRIANGLE_KIMBAP_PILOT_GENERATION.targetBboxMaxPct}% bbox (cup_ramen ~37.4%, cup_rice ~33.5%); balanced padding; ref mean ~${(layout.bboxAreaRatioMean * 100).toFixed(1)}%.`,
    'Distinct from cup_ramen and cup_rice — triangle only, not cylindrical cup.',
  ].join(' ');

  return `${base} ${bgLine} ${kimbapLines}`;
}

/** Sprint 56-C.2 — triangle_kimbap v1.1 (bottom/side seaweed wrap, rice at top). */
export function buildTriangleKimbapV11Prompt(profile: ConvenienceIconRenderProfile): string {
  const base = buildConvenienceIconPromptHeader({
    iconKey: TRIANGLE_KIMBAP_NEXT_PILOT.iconKey,
    koreanName: TRIANGLE_KIMBAP_NEXT_PILOT.koreanName,
    aliases: [...TRIANGLE_KIMBAP_NEXT_PILOT.aliases],
  });

  const bg = profile.background;
  const bgLine =
    bg.policy === 'opaque_uniform'
      ? `Background must match locked style: solid opaque warm cream RGB(${bg.rgb.r},${bg.rgb.g},${bg.rgb.b}), not transparent, no chroma key, no cutout.`
      : 'Background must match production ingredient icon transparency policy exactly.';

  const layout = profile.layout;
  const v11Lines = [
    'Subject: ONE convenience-store triangle kimbap icon (NOT round rice ball / jumeokbap, NOT brand package).',
    'Shape: rounded equilateral TRIANGLE silhouette — point-up triangle readable at 40px.',
    'CRITICAL seaweed placement — NOT like v1 wrong top-cap:',
    'DO NOT put seaweed on the top half like a hat or cap covering the top vertex.',
    `Cream rice ${TRIANGLE_KIMBAP_NEXT_PILOT.riceHex} must dominate the TOP and CENTER — top vertex and upper two-thirds show rice clearly.`,
    `Seaweed wrap matte black ${TRIANGLE_KIMBAP_NEXT_PILOT.seaweedHex} OR dark green ${TRIANGLE_KIMBAP_NEXT_PILOT.seaweedGreenHex} wraps ONLY the BOTTOM 35-50% of the triangle.`,
    'Seaweed continues along BOTH lower sides wrapping upward slightly for 3D depth — like a real triangle kimbap pack.',
    'Inside filling: maximum 1-2 tiny flat color dots OR none; NO 4 dots, NO garnish piles.',
    'Plastic wrap: NONE or extremely minimal — NO glossy bag, NO brand packaging.',
    'NO flavor label, NO barcode, NO Korean/English text, NO logo.',
    'Style: semi-flat matte 3D, rounded friendly edges, soft contact shadow — same family as cup_ramen and cup_rice masters.',
    `Object footprint ${TRIANGLE_KIMBAP_V11_GENERATION.targetBboxMinPct}-${TRIANGLE_KIMBAP_V11_GENERATION.targetBboxMaxPct}% bbox (cup_ramen ~37.4%, cup_rice ~33.5%); balanced padding; ref mean ~${(layout.bboxAreaRatioMean * 100).toFixed(1)}%.`,
    'Distinct from cup_ramen and cup_rice — triangle only, not cylindrical cup.',
  ].join(' ');

  return `${base} ${bgLine} ${v11Lines}`;
}

/** Sprint 56-C.3 — triangle_kimbap v1.2 (center vertical seaweed band, no face). */
export function buildTriangleKimbapV12Prompt(profile: ConvenienceIconRenderProfile): string {
  const base = buildConvenienceIconPromptHeader({
    iconKey: TRIANGLE_KIMBAP_NEXT_PILOT.iconKey,
    koreanName: TRIANGLE_KIMBAP_NEXT_PILOT.koreanName,
    aliases: [...TRIANGLE_KIMBAP_NEXT_PILOT.aliases],
  });

  const bg = profile.background;
  const bgLine =
    bg.policy === 'opaque_uniform'
      ? `Background must match locked style: solid opaque warm cream RGB(${bg.rgb.r},${bg.rgb.g},${bg.rgb.b}), not transparent, no chroma key, no cutout.`
      : 'Background must match production ingredient icon transparency policy exactly.';

  const layout = profile.layout;
  const v12Lines = [
    'Subject: ONE convenience-store triangle kimbap icon (NOT round rice ball / jumeokbap, NOT brand package).',
    'Shape: rounded equilateral TRIANGLE silhouette — point-up triangle readable at 40px; distinct from round onigiri.',
    `Rice body: cream rice ${TRIANGLE_KIMBAP_NEXT_PILOT.riceHex} dominates MOST of the triangle — top vertex, both side edges, and center margins show rice clearly.`,
    'CRITICAL seaweed band — center vertical strip on front face ONLY:',
    `Matte black ${TRIANGLE_KIMBAP_NEXT_PILOT.seaweedHex} or dark green ${TRIANGLE_KIMBAP_NEXT_PILOT.seaweedGreenHex} vertical band centered on front, width ~25-35% of triangle width.`,
    'Band starts from bottom and rises to ~60-75% height — NOT full height, NOT covering top vertex.',
    'FORBIDDEN structures: NO top seaweed cap/hat (like v1); NO bottom-only seaweed base (like v1.1); NO full-triangle seaweed wrap.',
    'Both left and right rice edges must remain visible — seaweed is ONE central vertical stripe, not side wraps.',
    'NO face, NO eyes, NO mouth, NO cute character expression, NO anthropomorphism.',
    'Filling: zero OR one tiny flat color dot maximum; NO multiple red dots, NO garnish piles.',
    'Plastic wrap: NONE; NO brand label, barcode, Korean/English text, logo.',
    'Style: semi-flat matte 3D, rounded friendly edges, soft contact shadow — same family as cup_ramen and cup_rice masters.',
    `Object footprint ${TRIANGLE_KIMBAP_V12_GENERATION.targetBboxMinPct}-${TRIANGLE_KIMBAP_V12_GENERATION.targetBboxMaxPct}% bbox; ref mean ~${(layout.bboxAreaRatioMean * 100).toFixed(1)}%.`,
    'At 40px: triangle silhouette + center dark vertical band must read clearly.',
  ].join(' ');

  return `${base} ${bgLine} ${v12Lines}`;
}

/** Sprint 56-C.1 — milk pilot prompt (write-only until generation approved). */
export function buildMilkPilotPrompt(profile: ConvenienceIconRenderProfile): string {
  const base = buildConvenienceIconPromptHeader({
    iconKey: MILK_NEXT_PILOT.iconKey,
    koreanName: MILK_NEXT_PILOT.koreanName,
    aliases: [...MILK_NEXT_PILOT.aliases],
  });

  const bg = profile.background;
  const bgLine =
    bg.policy === 'opaque_uniform'
      ? `Background must match locked style: solid opaque warm cream RGB(${bg.rgb.r},${bg.rgb.g},${bg.rgb.b}), not transparent, no chroma key, no cutout.`
      : 'Background must match production ingredient icon transparency policy exactly.';

  const layout = profile.layout;
  const milkLines = [
    'Subject: ONE small convenience-store milk mini-carton / milk pack icon (NOT glass bottle, NOT coffee drink, NOT generic brown cardboard box).',
    `Carton body matte cream-white ${MILK_NEXT_PILOT.cartonHex} — clearly a MILK carton, NOT a plain shipping box.`,
    'Shape: small mini milk carton with rounded friendly corners; top has folded peaked carton closure (gable top) clearly visible — NOT flat box lid.',
    `One blue accent panel or horizontal band ${MILK_NEXT_PILOT.accentHex} on upper front — generic milk cue, NOT real brand packaging, NOT barcode area.`,
    'Straw: omit entirely OR one tiny simple dot only — NO prominent drinking straw.',
    'NO cow illustration, NO milk splash photo, NO nutrition label, NO Korean/English text, NO logo, NO barcode.',
    'Style: semi-flat matte 3D, rounded friendly silhouette, soft contact shadow — same family as cup_ramen, cup_rice, triangle_kimbap masters.',
    `Object footprint ${MILK_PILOT_GENERATION.targetBboxMinPct}-${MILK_PILOT_GENERATION.targetBboxMaxPct}% bbox (cup_ramen ~37.4%, cup_rice ~33.5%, triangle_kimbap ~33.2%); padding similar to masters; ref mean ~${(layout.bboxAreaRatioMean * 100).toFixed(1)}%.`,
    'At 40px: mini carton silhouette + blue accent must read as milk pack, distinct from cup and triangle shapes.',
  ].join(' ');

  return `${base} ${bgLine} ${milkLines}`;
}

/** Sprint 56-E — salad pilot prompt (convenience packaged salad). */
export function buildSaladPilotPrompt(profile: ConvenienceIconRenderProfile): string {
  const base = buildConvenienceIconPromptHeader({
    iconKey: SALAD_NEXT_PILOT.iconKey,
    koreanName: SALAD_NEXT_PILOT.koreanName,
    aliases: [...SALAD_NEXT_PILOT.aliases],
  });

  const bg = profile.background;
  const bgLine =
    bg.policy === 'opaque_uniform'
      ? `Background must match locked style: solid opaque warm cream RGB(${bg.rgb.r},${bg.rgb.g},${bg.rgb.b}), not transparent, no chroma key, no cutout.`
      : 'Background must match production ingredient icon transparency policy exactly.';

  const layout = profile.layout;
  const saladLines = [
    'Subject: ONE convenience-store PACKAGED salad icon — low wide rectangular salad container/tray (NOT restaurant salad bowl, NOT ceramic bowl, NOT plate).',
    `Container: low wide transparent or semi-transparent plastic tray ${SALAD_NEXT_PILOT.containerHex} with rounded friendly edges — convenience-store salad pack silhouette.`,
    `Green accent: clear green rim band or lid edge ${SALAD_NEXT_PILOT.rimHex} around container top — must read at small size.`,
    `Inside: 3-5 simple leafy greens ${SALAD_NEXT_PILOT.leafHex} clearly visible through container — NOT hyper-detailed lettuce photo.`,
    `Optional: one tiny ${SALAD_NEXT_PILOT.accentHex} tomato dot inside — max 1-2 tiny color points.`,
    'NO separate plate, NO fork, NO dressing bottle, NO nutrition label, NO Korean/English text, NO logo, NO barcode.',
    'NO face, NO anthropomorphism.',
    'Style: semi-flat matte 3D, rounded friendly silhouette, soft contact shadow — same family as cup_ramen, cup_rice, triangle_kimbap, milk masters.',
    `Object footprint ${SALAD_PILOT_GENERATION.targetBboxMinPct}-${SALAD_PILOT_GENERATION.targetBboxMaxPct}% bbox (cup_ramen ~37.4%, cup_rice ~33.5%, triangle_kimbap ~33.2%, milk ~33.4%); ref mean ~${(layout.bboxAreaRatioMean * 100).toFixed(1)}%.`,
    'At 40px: low wide pack + green rim + green leaves must read as convenience packaged salad, NOT generic bowl.',
  ].join(' ');

  return `${base} ${bgLine} ${saladLines}`;
}

/** Sprint 56-E.1 — lunchbox pilot prompt (write-only until generation approved). */
export function buildLunchboxPilotPrompt(profile: ConvenienceIconRenderProfile): string {
  const base = buildConvenienceIconPromptHeader({
    iconKey: LUNCHBOX_NEXT_PILOT.iconKey,
    koreanName: LUNCHBOX_NEXT_PILOT.koreanName,
    aliases: [...LUNCHBOX_NEXT_PILOT.aliases],
  });

  const bg = profile.background;
  const bgLine =
    bg.policy === 'opaque_uniform'
      ? `Background must match locked style: solid opaque warm cream RGB(${bg.rgb.r},${bg.rgb.g},${bg.rgb.b}), not transparent, no chroma key, no cutout.`
      : 'Background must match production ingredient icon transparency policy exactly.';

  const layout = profile.layout;
  const lunchboxLines = [
    'Subject: ONE convenience-store lunchbox / meal tray icon (NOT restaurant bento with chopsticks, NOT cafeteria metal tray).',
    `Tray: low wide rectangular divided lunchbox ${LUNCHBOX_NEXT_PILOT.trayHex} dark charcoal or deep gray plastic — 2-3 compartments visible.`,
    `Rice section: cream rice mound ${LUNCHBOX_NEXT_PILOT.riceHex} in one compartment — simple semi-flat shape.`,
    `Side compartments: simple side dish accents ${LUNCHBOX_NEXT_PILOT.accentHex} — max 1-2 tiny color points, NOT hyper-detailed food photo.`,
    'NOT a round cafeteria plate, NOT chopsticks, NOT fork, NO nutrition label, NO Korean/English text, NO logo, NO barcode.',
    'NO face, NO anthropomorphism.',
    'Style: semi-flat matte 3D, rounded friendly silhouette, soft contact shadow — same family as approved masters.',
    `Object footprint ~33-38% bbox; ref mean ~${(layout.bboxAreaRatioMean * 100).toFixed(1)}%.`,
    'At 40px: low wide dark tray + rice + side compartments must read as convenience lunchbox.',
  ].join(' ');

  return `${base} ${bgLine} ${lunchboxLines}`;
}

/** Sprint 56-F — sandwich batch prompt. */
export function buildSandwichPilotPrompt(profile: ConvenienceIconRenderProfile): string {
  const base = buildConvenienceIconPromptHeader({
    iconKey: SANDWICH_NEXT_PILOT.iconKey,
    koreanName: SANDWICH_NEXT_PILOT.koreanName,
    aliases: [...SANDWICH_NEXT_PILOT.aliases],
  });
  const bg = profile.background;
  const bgLine =
    bg.policy === 'opaque_uniform'
      ? `Background must match locked style: solid opaque warm cream RGB(${bg.rgb.r},${bg.rgb.g},${bg.rgb.b}), not transparent, no chroma key, no cutout.`
      : 'Background must match production ingredient icon transparency policy exactly.';
  const layout = profile.layout;
  const lines = [
    'Subject: ONE triangular or diagonal-cut sandwich icon (NOT wrapped in plastic film, NOT sub sandwich).',
    `Bread: beige sandwich bread ${SANDWICH_NEXT_PILOT.breadHex} with rounded friendly edges.`,
    `Layers: minimal green leaf ${SANDWICH_NEXT_PILOT.leafHex} + yellow cheese ${SANDWICH_NEXT_PILOT.cheeseHex} — max 2-3 simple layers, NOT overstuffed.`,
    'NO plastic wrap, NO nutrition label, NO Korean/English text, NO logo, NO barcode.',
    'NO face, NO anthropomorphism.',
    'Style: semi-flat matte 3D, rounded friendly silhouette, soft contact shadow — same family as approved masters.',
    `Object footprint ~33-38% bbox; ref mean ~${(layout.bboxAreaRatioMean * 100).toFixed(1)}%.`,
    'At 40px: triangular sandwich silhouette must read clearly.',
  ].join(' ');
  return `${base} ${bgLine} ${lines}`;
}

/** Sprint 56-F — hamburger batch prompt. */
export function buildHamburgerPilotPrompt(profile: ConvenienceIconRenderProfile): string {
  const base = buildConvenienceIconPromptHeader({
    iconKey: HAMBURGER_NEXT_PILOT.iconKey,
    koreanName: HAMBURGER_NEXT_PILOT.koreanName,
    aliases: [...HAMBURGER_NEXT_PILOT.aliases],
  });
  const bg = profile.background;
  const bgLine =
    bg.policy === 'opaque_uniform'
      ? `Background must match locked style: solid opaque warm cream RGB(${bg.rgb.r},${bg.rgb.g},${bg.rgb.b}), not transparent, no chroma key, no cutout.`
      : 'Background must match production ingredient icon transparency policy exactly.';
  const layout = profile.layout;
  const lines = [
    'Subject: ONE simple convenience-store hamburger icon (NOT fast-food ad photo, NOT giant stacked burger).',
    `Bun: round brown bun ${HAMBURGER_NEXT_PILOT.bunHex} top and bottom — cute rounded silhouette.`,
    `Patty: simple dark brown patty ${HAMBURGER_NEXT_PILOT.pattyHex}.`,
    `Cheese: one yellow cheese slice ${HAMBURGER_NEXT_PILOT.cheeseHex}.`,
    `Greens: minimal green leaf ${HAMBURGER_NEXT_PILOT.leafHex} peeking — max 1 small leaf.`,
    'NO sesame overload, NO ketchup squirt art, NO nutrition label, NO text, NO logo, NO barcode.',
    'NO face, NO anthropomorphism.',
    'Style: semi-flat matte 3D, rounded friendly, soft contact shadow — same family as approved masters.',
    `Object footprint ~33-38% bbox; ref mean ~${(layout.bboxAreaRatioMean * 100).toFixed(1)}%.`,
    'At 40px: round bun + patty must read as simple cute hamburger.',
  ].join(' ');
  return `${base} ${bgLine} ${lines}`;
}

/** Sprint 56-F — hot_bar batch prompt. */
export function buildHotBarPilotPrompt(profile: ConvenienceIconRenderProfile): string {
  const base = buildConvenienceIconPromptHeader({
    iconKey: HOT_BAR_NEXT_PILOT.iconKey,
    koreanName: HOT_BAR_NEXT_PILOT.koreanName,
    aliases: [...HOT_BAR_NEXT_PILOT.aliases],
  });
  const bg = profile.background;
  const bgLine =
    bg.policy === 'opaque_uniform'
      ? `Background must match locked style: solid opaque warm cream RGB(${bg.rgb.r},${bg.rgb.g},${bg.rgb.b}), not transparent, no chroma key, no cutout.`
      : 'Background must match production ingredient icon transparency policy exactly.';
  const layout = profile.layout;
  const lines = [
    'Subject: ONE convenience-store hot bar / fishcake bar icon (NOT sausage, NOT hot dog in bun, NOT ketchup decoration).',
    `Body: flat wide oval or fishcake-bar shape ${HOT_BAR_NEXT_PILOT.bodyHex} orange-brown — stick/bar silhouette.`,
    `Accent: subtle darker edge ${HOT_BAR_NEXT_PILOT.accentHex} — simple matte finish.`,
    'NO plastic wrapper, NO ketchup squiggle, NO stick handle, NO nutrition label, NO text, NO logo.',
    'NO face, NO anthropomorphism.',
    'Style: semi-flat matte 3D, rounded friendly silhouette, soft contact shadow — distinct from sausage/hotdog.',
    `Object footprint ~33-38% bbox; ref mean ~${(layout.bboxAreaRatioMean * 100).toFixed(1)}%.`,
    'At 40px: flat wide bar shape must read as convenience hot bar / fishcake bar.',
  ].join(' ');
  return `${base} ${bgLine} ${lines}`;
}

/** Sprint 56-F — cup_udon batch prompt. */
export function buildCupUdonPilotPrompt(profile: ConvenienceIconRenderProfile): string {
  const base = buildConvenienceIconPromptHeader({
    iconKey: CUP_UDON_NEXT_PILOT.iconKey,
    koreanName: CUP_UDON_NEXT_PILOT.koreanName,
    aliases: [...CUP_UDON_NEXT_PILOT.aliases],
  });
  const bg = profile.background;
  const bgLine =
    bg.policy === 'opaque_uniform'
      ? `Background must match locked style: solid opaque warm cream RGB(${bg.rgb.r},${bg.rgb.g},${bg.rgb.b}), not transparent, no chroma key, no cutout.`
      : 'Background must match production ingredient icon transparency policy exactly.';
  const layout = profile.layout;
  const lines = [
    'Subject: ONE convenience-store cup udon icon — same cup family as cup_ramen master but UDON not ramen.',
    `Cup body: cream-white cup ${CUP_UDON_NEXT_PILOT.cupHex} with rounded friendly silhouette.`,
    `Accent band: brown/dark gold band ${CUP_UDON_NEXT_PILOT.accentHex} — NOT orange ramen band — clearly udon cue.`,
    `Noodles: thick udon noodles ${CUP_UDON_NEXT_PILOT.noodleHex} slightly visible inside cup top — NOT lifted noodles, NOT ramen curly noodles.`,
    'NO orange ramen stripe, NO nutrition label, NO Korean/English text, NO logo, NO barcode.',
    'NO face, NO anthropomorphism.',
    'Style: semi-flat matte 3D, soft contact shadow — cup family matching cup_ramen master.',
    `Object footprint ~33-38% bbox; ref mean ~${(layout.bboxAreaRatioMean * 100).toFixed(1)}%.`,
    'At 40px: cup + brown band + thick noodles must read as cup udon, distinct from cup_ramen orange.',
  ].join(' ');
  return `${base} ${bgLine} ${lines}`;
}

export function buildPhase1BatchPrompt(
  iconKey: string,
  profile: ConvenienceIconRenderProfile,
): string {
  switch (iconKey) {
    case 'lunchbox':
      return buildLunchboxPilotPrompt(profile);
    case 'sandwich':
      return buildSandwichPilotPrompt(profile);
    case 'hamburger':
      return buildHamburgerPilotPrompt(profile);
    case 'hot_bar':
      return buildHotBarPilotPrompt(profile);
    case 'cup_udon':
      return buildCupUdonPilotPrompt(profile);
    default:
      throw new Error(`Unknown Phase 1 batch iconKey: ${iconKey}`);
  }
}

export const CONVENIENCE_ICON_RENDER_PROFILE: ConvenienceIconRenderProfile | null = null;
