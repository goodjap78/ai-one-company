import type { MenuItem } from '../../../../types/recommendation';
import type {
  HankkiPersonalitySnapshot,
  PersonalityVoice,
  TodayMoment,
  UserFeeling,
} from '../../../../types/hankkiPersonality';
import type { MealSituationSnapshot } from '../../../../types/mealIntelligenceEngine';

function headlineForMoment(moment: TodayMoment, title: string): string | null {
  switch (moment) {
    case 'rainy':
      return `비 오는 날, ${title} 어때요?`;
    case 'hot':
      return `더운 날, ${title} 어때요?`;
    case 'cold':
      return `쌀쌀한 날, ${title} 어때요?`;
    case 'weekend':
      return `주말엔 ${title} 어때요?`;
    case 'late_night':
      return `늦은 밤, ${title} 어때요?`;
    default:
      return null;
  }
}

function headlineForFeeling(feeling: UserFeeling, title: string): string | null {
  switch (feeling) {
    case 'comfort':
      return `${title}, 오늘 같은 날 딱이에요.`;
    case 'busy':
      return `바쁜 날, ${title} 어때요?`;
    case 'tired':
      return `피곤한 날, ${title} 편하게요.`;
    case 'lazy':
      return `${title}, 부담 없이요.`;
    case 'family':
      return `같이 먹기 좋은 ${title}이에요.`;
    case 'alone':
      return `혼자 먹기 좋은 ${title}이에요.`;
    case 'happy':
      return `기분 좋은 날, ${title} 어때요?`;
    default:
      return null;
  }
}

function suggestionForFeeling(feeling: UserFeeling): string {
  switch (feeling) {
    case 'comfort':
      return '오늘 같은 날 딱이에요.';
    case 'busy':
    case 'lazy':
      return '부담 없이 드세요.';
    case 'tired':
      return '오늘은 편하게요.';
    case 'family':
      return '오늘은 든든하게요.';
    case 'alone':
      return '오늘은 이게 좋겠어요.';
    case 'happy':
      return '오늘은 이게 좋겠어요.';
    default:
      return '오늘은 이게 좋겠어요.';
  }
}

function feelingHint(feeling: UserFeeling): string {
  switch (feeling) {
    case 'busy':
      return '금방 드실 수 있어요.';
    case 'tired':
      return '부담 없이 드세요.';
    case 'happy':
      return '맛있게 드세요.';
    case 'lazy':
      return '오늘은 편하게요.';
    case 'comfort':
      return '마음 편한 한 끼예요.';
    case 'family':
      return '같이 나눠 먹기 좋아요.';
    case 'alone':
      return '혼자 먹기 편해요.';
    default:
      return '오늘은 가볍게요.';
  }
}

/** Step 4–5: gentle suggestion copy — never explain data. */
export function buildPersonalityVoice(
  menu: MenuItem,
  personality: HankkiPersonalitySnapshot,
  _situation: MealSituationSnapshot,
): PersonalityVoice {
  const title = menu.title;
  const { primaryMoment, primaryFeeling } = personality;

  const headline =
    headlineForMoment(primaryMoment, title) ??
    headlineForFeeling(primaryFeeling, title) ??
    `오늘은 ${title} 어때요?`;

  return {
    headline,
    suggestion: suggestionForFeeling(primaryFeeling),
    feelingHint: feelingHint(primaryFeeling),
  };
}
