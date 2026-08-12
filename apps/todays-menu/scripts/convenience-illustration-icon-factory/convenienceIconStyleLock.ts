/**
 * HANKKI Convenience Illustration Icon Style — locked on cup_ramen + cup_rice + triangle_kimbap masters.
 * Aligned with HANKKI Ingredient Icon Style v1.0 render family.
 */
import { HANKKI_INGREDIENT_ICON_STYLE_VERSION } from '../ingredient-factory/buildPrompts';
import { INGREDIENT_IMAGE_SPEC } from '../ingredient-factory/config';

/** Locked convenience illustration style id. */
export const HANKKI_CONVENIENCE_ILLUSTRATION_ICON_STYLE_VERSION = 'v1.0' as const;

/** Approved master reference (Sprint 56-A.3). */
export const CUP_RAMEN_APPROVED_MASTER = {
  iconKey: 'cup_ramen' as const,
  approvedSprint: '56-A.3',
  sourceReviewFile: 'cup_ramen_v15.png',
  masterRelativePath: 'masters/cup_ramen.png',
  referenceMetrics: {
    bboxAreaPct: 37.4,
    bboxTargetMinPct: 35,
    bboxTargetMaxPct: 38,
    backgroundRgb: { r: 240, g: 225, b: 199 },
    backgroundPolicy: 'opaque_uniform' as const,
    paddingTopPct: 21.7,
    paddingBottomPct: 22.0,
  },
  historyFiles: [
    'history/cup_ramen/cup_ramen_v1.png',
    'history/cup_ramen/cup_ramen_v2.png',
  ],
} as const;

/** Approved master reference (Sprint 56-B.2). */
export const CUP_RICE_APPROVED_MASTER = {
  iconKey: 'cup_rice' as const,
  approvedSprint: '56-B.2',
  sourceReviewFile: 'cup_rice_v11.png',
  masterRelativePath: 'masters/cup_rice.png',
  referenceMetrics: {
    bboxAreaPct: 33.5,
    bboxTargetMinPct: 33,
    bboxTargetMaxPct: 38,
    backgroundRgb: { r: 252, g: 238, b: 211 },
    backgroundPolicy: 'opaque_uniform' as const,
    paddingTopPct: 21.3,
    paddingBottomPct: 18.0,
    bodyHex: '#2D2D2D',
    accentBandHex: '#F5C542',
    silhouette: 'low_wide_dark_charcoal_cup',
    legibilityPx: 40,
  },
  historyFiles: ['history/cup_rice/cup_rice_v1.png'],
} as const;

/** Reverted master approval (Sprint 56-C.1 — wrong top-seaweed structure). */
export const TRIANGLE_KIMBAP_V1_REJECTED_MASTER = {
  iconKey: 'triangle_kimbap' as const,
  rejectedSprint: '56-C.1-R',
  reason: 'top_seaweed_cap_structure_wrong',
  sourceReviewFile: 'triangle_kimbap_v1.png',
  archivedPath: 'history/triangle_kimbap/triangle_kimbap_v1.png',
  note: 'Seaweed covered top half like a cap; v1.1 required with bottom/side wrap',
} as const;

/** Rejected reference (Sprint 56-C.2 — bottom kim + face). */
export const TRIANGLE_KIMBAP_V11_REJECTED = {
  iconKey: 'triangle_kimbap' as const,
  rejectedSprint: '56-C.2',
  reason: 'bottom_seaweed_only_plus_face',
  sourceReviewFile: 'triangle_kimbap_v11.png',
  referencePath: 'review/triangle_kimbap_v11.png',
  note: 'Bottom-heavy seaweed wrap with anthropomorphic face; v1.2 center band required',
} as const;

/** Approved master reference (Sprint 56-C.4). */
export const TRIANGLE_KIMBAP_APPROVED_MASTER = {
  iconKey: 'triangle_kimbap' as const,
  approvedSprint: '56-C.4',
  sourceReviewFile: 'triangle_kimbap_v12.png',
  masterRelativePath: 'masters/triangle_kimbap.png',
  referenceMetrics: {
    bboxAreaPct: 33.2,
    bboxTargetMinPct: 33,
    bboxTargetMaxPct: 38,
    backgroundRgb: { r: 253, g: 240, b: 212 },
    backgroundPolicy: 'opaque_uniform' as const,
    paddingTopPct: 24.5,
    paddingBottomPct: 20.7,
    riceHex: '#FFF5E6',
    seaweedHex: '#2A2A2A',
    silhouette: 'cream_rice_triangle_center_vertical_seaweed_band',
    legibilityPx: 40,
    face: false,
    fillingDotsMax: 1,
  },
  historyFiles: ['history/triangle_kimbap/triangle_kimbap_v1.png'],
  rejectedReferenceFiles: ['review/triangle_kimbap_v11.png'],
} as const;

/** triangle_kimbap pilot spec. */
export const TRIANGLE_KIMBAP_NEXT_PILOT = {
  iconKey: 'triangle_kimbap' as const,
  koreanName: '삼각김밥',
  aliases: ['김밥', '삼각김밥'],
  seaweedHex: '#2A2A2A',
  seaweedGreenHex: '#1E3D2F',
  riceHex: '#FFF5E6',
  generationApproved: false,
} as const;

/** Approved master reference (Sprint 56-D.1). */
export const MILK_APPROVED_MASTER = {
  iconKey: 'milk' as const,
  approvedSprint: '56-D.1',
  sourceReviewFile: 'milk_v1.png',
  masterRelativePath: 'masters/milk.png',
  referenceMetrics: {
    bboxAreaPct: 33.4,
    bboxTargetMinPct: 33,
    bboxTargetMaxPct: 38,
    backgroundRgb: { r: 251, g: 246, b: 226 },
    backgroundPolicy: 'opaque_uniform' as const,
    paddingTopPct: 19.6,
    paddingBottomPct: 20.4,
    cartonHex: '#F8F6F2',
    accentHex: '#6BA3D6',
    silhouette: 'cream_mini_carton_gable_top_blue_band',
    legibilityPx: 40,
    face: false,
    straw: false,
  },
  historyFiles: [] as const,
} as const;

/** salad pilot spec (Sprint 56-D.1 — prompt only). */
export const SALAD_NEXT_PILOT = {
  iconKey: 'salad' as const,
  koreanName: '샐러드',
  aliases: ['샐러드', '야채샐러드', '그린샐러드'],
  containerHex: '#E8F4F0',
  rimHex: '#4CAF50',
  leafHex: '#6BBF59',
  accentHex: '#FF8C42',
  generationApproved: false,
} as const;

/** Sprint 56-E — single-shot salad review generation gate. */
export const SALAD_PILOT_GENERATION = {
  approvedSprint: '56-E',
  reviewFile: 'salad_v1.png',
  allowedAssetKey: 'salad_v1',
  allowedIconKey: 'salad' as const,
  targetBboxMinPct: 33,
  targetBboxMaxPct: 38,
} as const;

/** Approved master reference (Sprint 56-E.1). */
export const SALAD_APPROVED_MASTER = {
  iconKey: 'salad' as const,
  approvedSprint: '56-E.1',
  sourceReviewFile: 'salad_v1.png',
  masterRelativePath: 'masters/salad.png',
  referenceMetrics: {
    bboxAreaPct: 33.2,
    bboxTargetMinPct: 33,
    bboxTargetMaxPct: 38,
    backgroundRgb: { r: 252, g: 241, b: 207 },
    backgroundPolicy: 'opaque_uniform' as const,
    paddingTopPct: 34.2,
    paddingBottomPct: 26.2,
    containerHex: '#E8F4F0',
    rimHex: '#4CAF50',
    leafHex: '#6BBF59',
    accentHex: '#FF8C42',
    silhouette: 'low_wide_transparent_pack_green_rim',
    legibilityPx: 40,
    face: false,
  },
  historyFiles: [] as const,
} as const;

/** lunchbox pilot spec (Sprint 56-E.1 — prompt only). */
export const LUNCHBOX_NEXT_PILOT = {
  iconKey: 'lunchbox' as const,
  koreanName: '도시락',
  aliases: ['도시락', '편의점도시락', '백반도시락'],
  trayHex: '#2D2D2D',
  lidHex: '#FFFFFF',
  riceHex: '#FFF5E6',
  accentHex: '#E8A838',
  generationApproved: false,
} as const;

/** sandwich pilot spec (Sprint 56-F batch). */
export const SANDWICH_NEXT_PILOT = {
  iconKey: 'sandwich' as const,
  koreanName: '샌드위치',
  aliases: ['샌드위치', '편의점샌드위치'],
  breadHex: '#F5E6C8',
  leafHex: '#6BBF59',
  cheeseHex: '#F5C542',
  generationApproved: false,
} as const;

/** hamburger pilot spec (Sprint 56-F batch). */
export const HAMBURGER_NEXT_PILOT = {
  iconKey: 'hamburger' as const,
  koreanName: '햄버거',
  aliases: ['햄버거', '편의점햄버거'],
  bunHex: '#D4A574',
  pattyHex: '#5C4033',
  cheeseHex: '#F5C542',
  leafHex: '#6BBF59',
  generationApproved: false,
} as const;

/** hot_bar pilot spec (Sprint 56-F batch). */
export const HOT_BAR_NEXT_PILOT = {
  iconKey: 'hot_bar' as const,
  koreanName: '핫바',
  aliases: ['핫바', '편의점핫바', '어묵바'],
  bodyHex: '#E8A050',
  accentHex: '#C87830',
  generationApproved: false,
} as const;

/** cup_udon pilot spec (Sprint 56-F batch). */
export const CUP_UDON_NEXT_PILOT = {
  iconKey: 'cup_udon' as const,
  koreanName: '컵우동',
  aliases: ['컵우동', '우동컵', '즉석우동'],
  cupHex: '#F8F6F2',
  accentHex: '#8B6914',
  noodleHex: '#D4A574',
  generationApproved: false,
} as const;

/** Approved master reference (Sprint 56-F Final). */
export const LUNCHBOX_APPROVED_MASTER = {
  iconKey: 'lunchbox' as const,
  approvedSprint: '56-F',
  sourceReviewFile: 'lunchbox_v1.png',
  masterRelativePath: 'masters/lunchbox.png',
  referenceMetrics: {
    bboxAreaPct: 34.6,
    bboxTargetMinPct: 33,
    bboxTargetMaxPct: 38,
    backgroundRgb: { r: 250, g: 241, b: 215 },
    backgroundPolicy: 'opaque_uniform' as const,
    paddingTopPct: 32.1,
    paddingBottomPct: 24.5,
    trayHex: '#2D2D2D',
    lidHex: '#FFFFFF',
    riceHex: '#FFF5E6',
    accentHex: '#E8A838',
    silhouette: 'low_wide_meal_tray_dark_base',
    legibilityPx: 40,
    face: false,
  },
  historyFiles: [] as const,
} as const;

/** Approved master reference (Sprint 56-F Final). */
export const SANDWICH_APPROVED_MASTER = {
  iconKey: 'sandwich' as const,
  approvedSprint: '56-F',
  sourceReviewFile: 'sandwich_v1.png',
  masterRelativePath: 'masters/sandwich.png',
  referenceMetrics: {
    bboxAreaPct: 34.1,
    bboxTargetMinPct: 33,
    bboxTargetMaxPct: 38,
    backgroundRgb: { r: 253, g: 238, b: 203 },
    backgroundPolicy: 'opaque_uniform' as const,
    paddingTopPct: 28.0,
    paddingBottomPct: 20.9,
    breadHex: '#F5E6C8',
    leafHex: '#6BBF59',
    cheeseHex: '#F5C542',
    silhouette: 'rounded_sandwich_stack',
    legibilityPx: 40,
    face: false,
  },
  historyFiles: [] as const,
} as const;

/** Approved master reference (Sprint 56-F Final). */
export const HAMBURGER_APPROVED_MASTER = {
  iconKey: 'hamburger' as const,
  approvedSprint: '56-F',
  sourceReviewFile: 'hamburger_v1.png',
  masterRelativePath: 'masters/hamburger.png',
  referenceMetrics: {
    bboxAreaPct: 34.6,
    bboxTargetMinPct: 33,
    bboxTargetMaxPct: 38,
    backgroundRgb: { r: 253, g: 237, b: 209 },
    backgroundPolicy: 'opaque_uniform' as const,
    paddingTopPct: 24.7,
    paddingBottomPct: 22.4,
    bunHex: '#D4A574',
    pattyHex: '#5C4033',
    cheeseHex: '#F5C542',
    leafHex: '#6BBF59',
    silhouette: 'rounded_burger_stack',
    legibilityPx: 40,
    face: false,
  },
  historyFiles: [] as const,
} as const;

/** Approved master reference (Sprint 56-F Final — bbox above target, human approved). */
export const HOT_BAR_APPROVED_MASTER = {
  iconKey: 'hot_bar' as const,
  approvedSprint: '56-F',
  sourceReviewFile: 'hot_bar_v1.png',
  masterRelativePath: 'masters/hot_bar.png',
  referenceMetrics: {
    bboxAreaPct: 42.1,
    bboxTargetMinPct: 33,
    bboxTargetMaxPct: 38,
    backgroundRgb: { r: 254, g: 238, b: 206 },
    backgroundPolicy: 'opaque_uniform' as const,
    paddingTopPct: 21.7,
    paddingBottomPct: 11.1,
    bodyHex: '#E8A050',
    accentHex: '#C87830',
    silhouette: 'elongated_fishcake_bar',
    legibilityPx: 40,
    face: false,
    manualApprovalNote: 'bbox 42.1% — approved at 40px without regeneration',
  },
  historyFiles: [] as const,
} as const;

/** Approved master reference (Sprint 56-F Final — bg drift, human approved). */
export const CUP_UDON_APPROVED_MASTER = {
  iconKey: 'cup_udon' as const,
  approvedSprint: '56-F',
  sourceReviewFile: 'cup_udon_v1.png',
  masterRelativePath: 'masters/cup_udon.png',
  referenceMetrics: {
    bboxAreaPct: 35.9,
    bboxTargetMinPct: 33,
    bboxTargetMaxPct: 38,
    backgroundRgb: { r: 252, g: 235, b: 202 },
    backgroundPolicy: 'opaque_uniform' as const,
    paddingTopPct: 20.3,
    paddingBottomPct: 19.5,
    cupHex: '#F8F6F2',
    accentHex: '#8B6914',
    noodleHex: '#D4A574',
    silhouette: 'cup_udon_same_family_as_cup_ramen',
    legibilityPx: 40,
    face: false,
    manualApprovalNote: 'background rgb drift — approved on card preview without regeneration',
  },
  historyFiles: [] as const,
} as const;

/** Sprint 56-F — Phase 1 remaining 5-icon batch generation gate. */
export const PHASE1_BATCH_GENERATION = {
  approvedSprint: '56-F',
  targetBboxMinPct: 33,
  targetBboxMaxPct: 38,
  targets: [
    { iconKey: 'lunchbox' as const, reviewFile: 'lunchbox_v1.png', assetKey: 'lunchbox_v1' },
    { iconKey: 'sandwich' as const, reviewFile: 'sandwich_v1.png', assetKey: 'sandwich_v1' },
    { iconKey: 'hamburger' as const, reviewFile: 'hamburger_v1.png', assetKey: 'hamburger_v1' },
    { iconKey: 'hot_bar' as const, reviewFile: 'hot_bar_v1.png', assetKey: 'hot_bar_v1' },
    { iconKey: 'cup_udon' as const, reviewFile: 'cup_udon_v1.png', assetKey: 'cup_udon_v1' },
  ],
} as const;

/** milk pilot spec (Sprint 56-C.1 — prompt only). */
export const MILK_NEXT_PILOT = {
  iconKey: 'milk' as const,
  koreanName: '우유',
  aliases: ['밀크', '우유', '흰우유'],
  cartonHex: '#F8F6F2',
  accentHex: '#6BA3D6',
  generationApproved: false,
} as const;

/** Sprint 56-D — single-shot milk review generation gate. */
export const MILK_PILOT_GENERATION = {
  approvedSprint: '56-D',
  reviewFile: 'milk_v1.png',
  allowedAssetKey: 'milk_v1',
  allowedIconKey: 'milk' as const,
  targetBboxMinPct: 33,
  targetBboxMaxPct: 38,
} as const;

/** Sprint 56-C — single-shot triangle_kimbap v1 review generation gate. */
export const TRIANGLE_KIMBAP_PILOT_GENERATION = {
  approvedSprint: '56-C',
  reviewFile: 'triangle_kimbap_v1.png',
  allowedAssetKey: 'triangle_kimbap_v1',
  allowedIconKey: 'triangle_kimbap' as const,
  targetBboxMinPct: 33,
  targetBboxMaxPct: 38,
} as const;

/** Sprint 56-C.2 — triangle_kimbap v1.1 (bottom/side seaweed wrap). */
export const TRIANGLE_KIMBAP_V11_GENERATION = {
  approvedSprint: '56-C.2',
  reviewFile: 'triangle_kimbap_v11.png',
  allowedAssetKey: 'triangle_kimbap_v11',
  allowedIconKey: 'triangle_kimbap' as const,
  targetBboxMinPct: 33,
  targetBboxMaxPct: 38,
  rejectedV1Structure: 'top_seaweed_cap',
  requiredStructure: 'bottom_side_seaweed_wrap_rice_top',
} as const;

/** Sprint 56-C.3 — triangle_kimbap v1.2 (center vertical seaweed band). */
export const TRIANGLE_KIMBAP_V12_GENERATION = {
  approvedSprint: '56-C.3',
  reviewFile: 'triangle_kimbap_v12.png',
  allowedAssetKey: 'triangle_kimbap_v12',
  allowedIconKey: 'triangle_kimbap' as const,
  targetBboxMinPct: 33,
  targetBboxMaxPct: 38,
  requiredStructure: 'center_vertical_seaweed_band',
  forbidFace: true,
} as const;

/** cup_rice pilot spec (Sprint 56-B). */
export const CUP_RICE_NEXT_PILOT = {
  iconKey: 'cup_rice' as const,
  koreanName: '컵밥',
  aliases: ['즉석밥', '컵밥'],
  accentBandHex: '#F5C542',
  accentBandAltHex: '#FF8C42',
  bodyHex: '#2D2D2D',
  generationApproved: false,
} as const;

/** Sprint 56-B — single-shot cup_rice review generation gate. */
export const CUP_RICE_PILOT_GENERATION = {
  approvedSprint: '56-B',
  reviewFile: 'cup_rice_v1.png',
  allowedAssetKey: 'cup_rice_v1',
  allowedIconKey: 'cup_rice' as const,
} as const;

/** Sprint 56-B.1 — cup_rice v1 scale-up (design lock, footprint only). */
export const CUP_RICE_V11_GENERATION = {
  approvedSprint: '56-B.1',
  reviewFile: 'cup_rice_v11.png',
  allowedAssetKey: 'cup_rice_v11',
  allowedIconKey: 'cup_rice' as const,
  referenceV1BboxPct: 26.6,
  targetBboxMinPct: 33,
  targetBboxMaxPct: 38,
  scaleUpPctMin: 12,
  scaleUpPctMax: 18,
} as const;

const STYLE_LOCK_LINES = [
  'HANKKI Convenience Illustration Icon Style v1.0 (locked on Phase 1 ten convenience illustration masters)',
  `Aligned with HANKKI Ingredient Icon Style ${HANKKI_INGREDIENT_ICON_STYLE_VERSION}`,
  'semi-flat 3D illustration — NOT photo-style',
  'soft rounded friendly silhouette',
  'cute but not childish',
  'single convenience product only — no sets, no hands, no plates',
  'opaque warm cream background matching production ingredient icons',
  'object bbox footprint approximately 35-38% of canvas area',
  'generous padding — cup presence must read at 40px',
  'soft contact shadow under subject',
  'no text',
  'no logo',
  'no brand marks',
  'no barcode',
  'no watermark',
  'no photo realism',
  'no hyper-real gloss or HDR',
  'square 1:1',
  `output ${INGREDIENT_IMAGE_SPEC.width}x${INGREDIENT_IMAGE_SPEC.height} PNG`,
].join('; ');

export function buildConvenienceIconStyleLockText(): string {
  return STYLE_LOCK_LINES;
}

export function buildConvenienceIconPromptHeader(entry: {
  iconKey: string;
  koreanName: string;
  aliases: string[];
}): string {
  const aliasHint =
    entry.aliases.length > 0
      ? ` Also known as: ${entry.aliases.slice(0, 8).join(', ')}.`
      : '';
  return [
    `HANKKI Convenience Illustration Icon Style ${HANKKI_CONVENIENCE_ILLUSTRATION_ICON_STYLE_VERSION}.`,
    `Create a single convenience-store illustration icon of "${entry.koreanName}" (iconKey: ${entry.iconKey}).`,
    aliasHint,
    `Style lock (Phase 1 ten masters): ${STYLE_LOCK_LINES}.`,
    `Output: ${INGREDIENT_IMAGE_SPEC.width}x${INGREDIENT_IMAGE_SPEC.height} PNG, square 1:1.`,
  ]
    .filter(Boolean)
    .join(' ');
}
