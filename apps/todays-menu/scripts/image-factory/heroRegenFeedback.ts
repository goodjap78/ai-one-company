/**
 * Sprint REVIEW-2 — Hero regeneration feedback controls.
 * Maps Content Center checkbox labels → Gemini prompt directives.
 */
export type HeroRegenFeedbackId =
  | 'food_too_small'
  | 'too_much_margin'
  | 'too_many_sides'
  | 'too_dark'
  | 'not_centered'
  | 'not_realistic'
  | 'other';

export type HeroRegenFeedbackOption = {
  id: HeroRegenFeedbackId;
  label: string;
  promptDirective: string | null;
};

export const HERO_REGEN_FEEDBACK_OPTIONS: HeroRegenFeedbackOption[] = [
  {
    id: 'food_too_small',
    label: '음식이 너무 작음',
    promptDirective:
      'Move the camera significantly closer. The main dish must occupy 88–92% of the frame.',
  },
  {
    id: 'too_much_margin',
    label: '여백이 너무 많음',
    promptDirective:
      'Remove empty table space. Crop tightly around the main dish.',
  },
  {
    id: 'too_many_sides',
    label: '반찬이 너무 많음',
    promptDirective:
      'Include no side dishes, or at most one very small side dish.',
  },
  {
    id: 'too_dark',
    label: '이미지가 너무 어두움',
    promptDirective:
      'Use brighter high-key natural daylight and lifted shadows.',
  },
  {
    id: 'not_centered',
    label: '음식이 중앙에 없음',
    promptDirective: 'Keep the main dish centered and fully visible.',
  },
  {
    id: 'not_realistic',
    label: '실사 느낌이 부족함',
    promptDirective:
      'Increase realistic food texture and natural photographic detail. Avoid illustration or 3D-render appearance.',
  },
  {
    id: 'other',
    label: '기타 의견',
    promptDirective: null,
  },
];

export function buildHeroFeedbackPromptAppend(input: {
  selectedIds: string[];
  otherText?: string;
}): string {
  const selected = new Set(input.selectedIds);
  const lines: string[] = [];
  for (const opt of HERO_REGEN_FEEDBACK_OPTIONS) {
    if (!selected.has(opt.id)) continue;
    if (opt.promptDirective) lines.push(opt.promptDirective);
  }
  const other = (input.otherText || '').trim();
  if (other && (selected.has('other') || other.length > 0)) {
    lines.push(`Additional operator request: ${other}`);
  }
  return lines.join(' ');
}
