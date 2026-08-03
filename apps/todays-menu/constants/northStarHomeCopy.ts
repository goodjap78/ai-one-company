/**
 * Sprint H1/H2 — North Star Home copy.
 * Static UI strings only — no backend / OCR / AI cost.
 */

export const northStarHomeCopy = {
  title: '오늘 뭐 먹지?',
  subtitle: '오늘도 맛있는 메뉴를 골라드릴게요.',

  features: {
    recommendation: {
      title: '오늘의 추천',
      subtitle: 'AI 추천 레시피',
    },
    convenience: {
      title: '편의점 꿀조합',
      subtitle: '간단하지만 든든한 편의점 한 끼를 골라드려요.',
      badge: '50가지 조합',
    },
    fridge: {
      title: '냉장고 털기',
      subtitle: '냉장고 재료로 똑똑하게 요리 추천',
    },
    /** Legacy keys — surveys / other screens may still reference these. */
    homemade: {
      title: '집에서 만들기',
      subtitle: 'AI 추천 레시피',
    },
    dineOut: {
      title: '외식·포장',
    },
    kids: {
      title: '우리 아이 식단',
    },
    lockedBadge: '준비 중',
  },

  hero: {
    badge: '오늘의 추천 ⭐',
  },

  comingSoon: {
    sectionTitle: '더 많은 메뉴를 만나보세요',
    cards: [
      {
        id: 'dineOut',
        title: '외식',
        subtitle: '맛집·배달 메뉴 추천',
        badge: '준비 중',
      },
      {
        id: 'kids',
        title: '우리아이 식단',
        subtitle: '아이에게 맞는 식단 추천',
        badge: '준비 중',
      },
      {
        id: 'receipt',
        title: '영수증',
        subtitle: '영수증 촬영하고 재료 자동 등록',
        badge: '준비 중',
      },
      {
        id: 'health',
        title: '건강',
        subtitle: '다이어트·저염식·건강식단 추천',
        badge: '준비 중',
      },
    ],
  },

  reward: {
    title: '한끼 리워드 프로그램',
    badge: '준비 중',
    body: '맛있는 한 끼를 기록하고\n포인트 혜택을 받아보세요.',
  },
} as const;

export type NorthStarComingSoonId =
  (typeof northStarHomeCopy.comingSoon.cards)[number]['id'];
