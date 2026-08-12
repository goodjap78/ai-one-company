/**
 * Sprint H1/H2 — North Star Home copy.
 * Static UI strings only — no backend / OCR / AI cost.
 */

export const northStarHomeCopy = {
  title: '오늘 뭐 먹지?',

  /** Sprint 61-C — slot-aware header subtitle (see `slotSubtitles`). */
  slotSubtitles: {
    breakfast: '좋은 아침이에요! 가볍게 시작해볼까요?',
    lunch: '점심시간이에요! 든든하게 먹어볼까요?',
    dinner: '오늘 하루 수고했어요. 저녁 메뉴를 골라드릴게요.',
    lateNight: '조금 출출한가요? 늦은 시간엔 가볍게 골라볼게요.',
  },

  features: {
    recommendation: {
      title: '집밥',
      subtitle: '오늘 먹을 메뉴 추천',
    },
    convenience: {
      title: '편의점 꿀조합',
      subtitle: '간단하게 맛있게',
    },
    fridge: {
      title: '냉장고 털기',
      subtitle: '있는 재료로 만들기',
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
    sectionTitle: '한끼 더하기',
    cards: [
      {
        id: 'dineOut',
        title: '외식',
        subtitle: '맛집·배달 추천',
        badge: '준비 중',
      },
      {
        id: 'kids',
        title: '우리아이 식단',
        subtitle: '아이 맞춤 식단',
        badge: '준비 중',
      },
      {
        id: 'receipt',
        title: '영수증',
        subtitle: '재료 자동 등록',
        badge: '준비 중',
      },
      {
        id: 'health',
        title: '건강',
        subtitle: '건강식단 추천',
        badge: '준비 중',
      },
    ],
  },

  reward: {
    title: '한끼 리워드',
    badge: '준비 중',
    subtitle: '포인트 혜택 받기',
    body: '맛있는 한 끼를 기록하고\n포인트 혜택을 받아보세요.',
  },

  personal: {
    sectionTitle: '나의 한끼',
    savedMenus: '저장한 메뉴',
    recentMenus: '최근 본 메뉴',
  },
} as const;

export type NorthStarComingSoonId =
  (typeof northStarHomeCopy.comingSoon.cards)[number]['id'];
