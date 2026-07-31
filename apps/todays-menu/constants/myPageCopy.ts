export const MY_PAGE_COPY = {
  screenTitle: '내 한끼',
  screenSubtitle: '한끼가 더 잘 추천할 수 있게 도와주세요.',
  profileTitle: '내 프로필',
  profileNameWithSuffix: (nickname: string) => `${nickname}님`,
  profileNameFallback: '닉네임을 설정해 주세요',
  profileEditLabel: '닉네임 수정',
  favorites: {
    title: '즐겨찾기',
    summaryLabel: (count: number) => `저장한 메뉴 ${count}개`,
    viewLabel: '보기',
  },
  aiSettings: {
    title: 'AI 추천 메뉴 설정',
    emoji: '✨',
    subtitle: '입력할수록 더 잘 맞는 메뉴를 추천해드려요.',
  },
  aiSettingsPrompt: {
    promptTitle: '아직 추천 설정을 하지 않았어요 😊',
    promptBody: '몇 가지만 알려주시면\n한끼가 더욱 취향에 맞는 메뉴를 추천해 드려요.',
    promptItems: ['좋아하는 음식', '먹지 않는 재료', '조리시간', '매운맛 등'] as const,
    promptAction: '추천 메뉴 설정하기',
    completeTitle: '추천 메뉴 설정 완료',
    completeBody: '취향이 바뀌면 언제든 설정을 수정할 수 있어요.',
    editAction: '설정 수정하기',
  },
  mealHistory: {
    title: '최근 먹은 메뉴',
    summaryLabel: (count: number) =>
      count > 0 ? `기록된 메뉴 ${count}개` : '아직 기록된 메뉴가 없어요',
    viewLabel: '보기',
  },
  notifications: {
    title: '알림 설정',
    emoji: '🔔',
    slotLabels: {
      breakfast: '아침',
      lunch: '점심',
      dinner: '저녁',
    },
  },
  settings: {
    title: '앱 설정',
    emoji: '⚙',
    versionLabel: '앱 버전',
  },
  legal: {
    title: '법적 정보 및 문의',
    emoji: '📄',
    inquiry: '문의하기',
    privacy: '개인정보처리방침',
    privacyDescription: '개인정보 수집 및 이용 안내',
    terms: '이용약관',
    termsDescription: '한끼 서비스 이용약관 보기',
  },
} as const;
