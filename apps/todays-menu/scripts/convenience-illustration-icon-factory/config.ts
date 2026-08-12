/**
 * Sprint 56-A — convenience illustration icon pilot factory paths.
 */
import path from 'node:path';

export const APP_ROOT = path.resolve(__dirname, '../..');

export const PATHS = {
  appRoot: APP_ROOT,
  ingredientsDir: path.join(APP_ROOT, 'assets/ingredients'),
  generatedRoot: path.join(
    APP_ROOT,
    'generated/convenience-illustration-icon-factory',
  ),
  reviewDir: path.join(
    APP_ROOT,
    'generated/convenience-illustration-icon-factory/review',
  ),
  reviewIndex: path.join(
    APP_ROOT,
    'generated/convenience-illustration-icon-factory/review/index.html',
  ),
  renderProfileJson: path.join(
    APP_ROOT,
    'generated/convenience-illustration-icon-factory/CONVENIENCE_ICON_RENDER_PROFILE.json',
  ),
  metricsJson: path.join(
    APP_ROOT,
    'generated/convenience-illustration-icon-factory/reference-ingredient-metrics.json',
  ),
  cupRamenPrompt: path.join(
    APP_ROOT,
    'generated/convenience-illustration-icon-factory/prompts/cup_ramen.md',
  ),
  cupRamenV2Prompt: path.join(
    APP_ROOT,
    'generated/convenience-illustration-icon-factory/prompts/cup_ramen_v2.md',
  ),
  cupRamenV15Prompt: path.join(
    APP_ROOT,
    'generated/convenience-illustration-icon-factory/prompts/cup_ramen_v15.md',
  ),
  mastersDir: path.join(
    APP_ROOT,
    'generated/convenience-illustration-icon-factory/masters',
  ),
  cupRamenMaster: path.join(
    APP_ROOT,
    'generated/convenience-illustration-icon-factory/masters/cup_ramen.png',
  ),
  cupRiceMaster: path.join(
    APP_ROOT,
    'generated/convenience-illustration-icon-factory/masters/cup_rice.png',
  ),
  triangleKimbapMaster: path.join(
    APP_ROOT,
    'generated/convenience-illustration-icon-factory/masters/triangle_kimbap.png',
  ),
  milkMaster: path.join(
    APP_ROOT,
    'generated/convenience-illustration-icon-factory/masters/milk.png',
  ),
  saladMaster: path.join(
    APP_ROOT,
    'generated/convenience-illustration-icon-factory/masters/salad.png',
  ),
  lunchboxMaster: path.join(
    APP_ROOT,
    'generated/convenience-illustration-icon-factory/masters/lunchbox.png',
  ),
  sandwichMaster: path.join(
    APP_ROOT,
    'generated/convenience-illustration-icon-factory/masters/sandwich.png',
  ),
  hamburgerMaster: path.join(
    APP_ROOT,
    'generated/convenience-illustration-icon-factory/masters/hamburger.png',
  ),
  hotBarMaster: path.join(
    APP_ROOT,
    'generated/convenience-illustration-icon-factory/masters/hot_bar.png',
  ),
  cupUdonMaster: path.join(
    APP_ROOT,
    'generated/convenience-illustration-icon-factory/masters/cup_udon.png',
  ),
  historyDir: path.join(
    APP_ROOT,
    'generated/convenience-illustration-icon-factory/history',
  ),
  cupRamenHistoryDir: path.join(
    APP_ROOT,
    'generated/convenience-illustration-icon-factory/history/cup_ramen',
  ),
  cupRiceHistoryDir: path.join(
    APP_ROOT,
    'generated/convenience-illustration-icon-factory/history/cup_rice',
  ),
  triangleKimbapHistoryDir: path.join(
    APP_ROOT,
    'generated/convenience-illustration-icon-factory/history/triangle_kimbap',
  ),
  approvedMastersJson: path.join(
    APP_ROOT,
    'generated/convenience-illustration-icon-factory/APPROVED_MASTERS.json',
  ),
  cupRicePilotPrompt: path.join(
    APP_ROOT,
    'generated/convenience-illustration-icon-factory/prompts/cup_rice_pilot.md',
  ),
  cupRiceV1Prompt: path.join(
    APP_ROOT,
    'generated/convenience-illustration-icon-factory/prompts/cup_rice_v1.md',
  ),
  cupRiceV11Prompt: path.join(
    APP_ROOT,
    'generated/convenience-illustration-icon-factory/prompts/cup_rice_v11.md',
  ),
  triangleKimbapPilotPrompt: path.join(
    APP_ROOT,
    'generated/convenience-illustration-icon-factory/prompts/triangle_kimbap_pilot.md',
  ),
  triangleKimbapV1Prompt: path.join(
    APP_ROOT,
    'generated/convenience-illustration-icon-factory/prompts/triangle_kimbap_v1.md',
  ),
  triangleKimbapV11Prompt: path.join(
    APP_ROOT,
    'generated/convenience-illustration-icon-factory/prompts/triangle_kimbap_v11.md',
  ),
  triangleKimbapV12Prompt: path.join(
    APP_ROOT,
    'generated/convenience-illustration-icon-factory/prompts/triangle_kimbap_v12.md',
  ),
  milkPilotPrompt: path.join(
    APP_ROOT,
    'generated/convenience-illustration-icon-factory/prompts/milk_pilot.md',
  ),
  milkV1Prompt: path.join(
    APP_ROOT,
    'generated/convenience-illustration-icon-factory/prompts/milk_v1.md',
  ),
  saladPilotPrompt: path.join(
    APP_ROOT,
    'generated/convenience-illustration-icon-factory/prompts/salad_pilot.md',
  ),
  saladV1Prompt: path.join(
    APP_ROOT,
    'generated/convenience-illustration-icon-factory/prompts/salad_v1.md',
  ),
  lunchboxPilotPrompt: path.join(
    APP_ROOT,
    'generated/convenience-illustration-icon-factory/prompts/lunchbox_pilot.md',
  ),
  batchAuditJson: path.join(
    APP_ROOT,
    'generated/convenience-illustration-icon-factory/PHASE1_BATCH_AUDIT.json',
  ),
} as const;

export const REFERENCE_INGREDIENT_KEYS = [
  'egg',
  'onion',
  'potato',
  'tofu',
  'milk',
  'mushroom',
] as const;

export const COMPARE_INGREDIENT_KEYS = ['egg', 'onion', 'milk'] as const;
export const MILK_REVIEW_REF_INGREDIENT_KEYS = ['egg', 'onion'] as const;

export const PILOT_ICON_KEY = 'cup_ramen' as const;

export const CUP_RAMEN_V1_FILE = 'cup_ramen_v1.png' as const;
export const CUP_RAMEN_V15_FILE = 'cup_ramen_v15.png' as const;
export const CUP_RAMEN_V2_FILE = 'cup_ramen_v2.png' as const;
export const CUP_RAMEN_MASTER_FILE = 'cup_ramen.png' as const;

export const CUP_RICE_PILOT_ICON_KEY = 'cup_rice' as const;
export const CUP_RICE_V1_FILE = 'cup_rice_v1.png' as const;
export const CUP_RICE_V11_FILE = 'cup_rice_v11.png' as const;
export const CUP_RICE_MASTER_FILE = 'cup_rice.png' as const;

export const TRIANGLE_KIMBAP_PILOT_ICON_KEY = 'triangle_kimbap' as const;
export const TRIANGLE_KIMBAP_V1_FILE = 'triangle_kimbap_v1.png' as const;
export const TRIANGLE_KIMBAP_V11_FILE = 'triangle_kimbap_v11.png' as const;
export const TRIANGLE_KIMBAP_V12_FILE = 'triangle_kimbap_v12.png' as const;
export const TRIANGLE_KIMBAP_MASTER_FILE = 'triangle_kimbap.png' as const;

export const MILK_PILOT_ICON_KEY = 'milk' as const;
export const MILK_V1_FILE = 'milk_v1.png' as const;
export const MILK_MASTER_FILE = 'milk.png' as const;

export const SALAD_PILOT_ICON_KEY = 'salad' as const;
export const SALAD_V1_FILE = 'salad_v1.png' as const;
export const SALAD_MASTER_FILE = 'salad.png' as const;

export const LUNCHBOX_MASTER_FILE = 'lunchbox.png' as const;
export const SANDWICH_MASTER_FILE = 'sandwich.png' as const;
export const HAMBURGER_MASTER_FILE = 'hamburger.png' as const;
export const HOT_BAR_MASTER_FILE = 'hot_bar.png' as const;
export const CUP_UDON_MASTER_FILE = 'cup_udon.png' as const;

export const LUNCHBOX_PILOT_ICON_KEY = 'lunchbox' as const;
export const LUNCHBOX_V1_FILE = 'lunchbox_v1.png' as const;

export const SANDWICH_PILOT_ICON_KEY = 'sandwich' as const;
export const SANDWICH_V1_FILE = 'sandwich_v1.png' as const;

export const HAMBURGER_PILOT_ICON_KEY = 'hamburger' as const;
export const HAMBURGER_V1_FILE = 'hamburger_v1.png' as const;

export const HOT_BAR_PILOT_ICON_KEY = 'hot_bar' as const;
export const HOT_BAR_V1_FILE = 'hot_bar_v1.png' as const;

export const CUP_UDON_PILOT_ICON_KEY = 'cup_udon' as const;
export const CUP_UDON_V1_FILE = 'cup_udon_v1.png' as const;

/** Sprint 56-F — Phase 1 remaining batch review PNGs (exactly these 5). */
export const PHASE1_BATCH_REVIEW_FILES = [
  LUNCHBOX_V1_FILE,
  SANDWICH_V1_FILE,
  HAMBURGER_V1_FILE,
  HOT_BAR_V1_FILE,
  CUP_UDON_V1_FILE,
] as const;

export const SALAD_REVIEW_REF_INGREDIENT_KEYS = ['egg', 'onion'] as const;

export const REVIEW_PORT = 8769;
