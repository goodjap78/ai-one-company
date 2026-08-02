/**
 * Sprint H1/H2 — North Star Home copy.
 * Static UI strings only — no backend / OCR / AI cost.
 */

export const northStarHomeCopy = {
  title: '오늘 뭐 먹지?',
  subtitle: '오늘도 맛있는 메뉴를 골라드릴게요.',

  features: {
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
        id: 'fridge',
        title: '냉장고 털기',
        subtitle: '냉장고 재료로 똑똑하게 요리 추천',
        badge: '지금 시작',
      },
      {
        id: 'receipt',
        title: '영수증 스캔',
        subtitle: '영수증 촬영하고 재료 자동 등록',
        badge: '준비 중',
      },
      {
        id: 'pet',
        title: '반려생활',
        subtitle: '건강한 반려식단과 간식 추천',
        badge: '준비 중',
      },
      {
        id: 'health',
        title: '건강 식단',
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
