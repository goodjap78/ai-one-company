import type { Difficulty, MealType } from '../types/home';
import type { PreferenceCategory } from '../types/preference';
import type { DailyChallenge, DailyChallengeId, MockWeather } from '../types/today';

export type HankkiLocale = 'ko';

export type HankkiTimeOfDay = 'morning' | 'lunch' | 'dinner' | 'lateNight';

type TimeOfDayCopy = {
  greeting: string;
  subtitle: string;
};

type RecommendationCopy = {
  message: Record<MealType, (menuTitle: string) => string>;
  initialThinking: {
    title: string;
    subtitle: string;
  };
  thinkingTitle: string;
  thinkingSteps: string[];
  acceptButton: string;
  refreshButton: string;
  reasonLabel: string;
  modeLabels: {
    homemade: string;
    delivery: string;
  };
};

type RetryCopy = {
  title: string;
  message: string;
  button: string;
};

type RecipeCopy = {
  backLabel: string;
  backToRecommendationLabel: string;
  backToConfirmedLabel: string;
  screenEyebrow: string;
  todayRecommendationBadge: string;
  ingredientsTitle: string;
  mainIngredientsLabel: string;
  subIngredientsLabel: string;
  seasoningsTitle: string;
  optionalIngredientLabel: string;
  stepsTitle: string;
  stepsIntro: string;
  stepsStartLabel: string;
  stepTipLabel: string;
  tipTitle: string;
  tipEmoji: string;
  imagePlaceholder: string;
  notFoundMessage: string;
  loadingMessage: string;
  metaTime: string;
  metaDifficulty: string;
  metaServings: string;
  metaCalories: string;
  metaDeliveryTime: string;
  startCookingButton: string;
  otherMenuButton: string;
  otherMenuRecommendLink: string;
  favoriteButton: string;
  favoriteSavedToast: string;
  favoriteRemovedToast: string;
  cookingCompleteToast: string;
  completionSectionTitle: string;
  completionCardTitle: string;
  completionDefaultBody: (mealTitle: string) => string;
  backToMenuLabel: string;
  ingredientsRequiredLabel: string;
  ingredientsOptionalLabel: string;
  donePreviewTitle: string;
  donePreviewBody: string;
  ingredientsIntro: string;
  warmSentence: string;
  mealCompletedButton: string;
  mealCompletedToast: string;
  mealCompletedDuplicateToast: string;
  feedbackTitle: string;
  feedbackGood: string;
  feedbackNeutral: string;
  feedbackBad: string;
  feedbackThankYouToast: string;
  servingAdjustTitle: string;
  servingAdjustDecreaseA11y: string;
  servingAdjustIncreaseA11y: string;
  servingAdjustReset: string;
  servingAdjustHint: string;
  servingPracticalRoundHint: string;
  servingScaledFromBase: (base: number) => string;
  servingFuzzyHint: string;
  servingStepsAdjustHint: string;
};

type DeliveryCopy = {
  screenEyebrow: string;
  placeholderTitle: string;
  placeholderBody: string;
  completeButton: string;
  backToHomeLabel: string;
  loadingMessage: string;
  notFoundMessage: string;
  completionMessage: string;
  completionSub: string;
  goHomeButton: string;
};

type MealConfirmedCopy = {
  message: string;
  subMessage: string;
  menuLabel: string;
  startCookingButton: string;
  saveButton: string;
  savedButton: string;
  viewMenuButton: string;
  chooseAnotherButton: string;
  backToRecommendationLabel: string;
  goHome: string;
  notFoundMessage: string;
  loadingMessage: string;
};

type FavoritesCopy = {
  savedToast: string;
  removedToast: string;
  screenTitle: string;
  screenSubtitle: string;
  loadingMessage: string;
  emptyTitle: string;
  emptyMessage: string;
  emptyGoHomeButton: string;
  backLabel: string;
  openListLabel: string;
  metaTime: string;
};

type ViewedRecipesCopy = {
  screenTitle: string;
  screenSubtitle: string;
  loadingMessage: string;
  emptyTitle: string;
  emptyMessage: string;
  emptyGoHomeButton: string;
};

type CookingCopy = {
  backLabel: string;
  prevButton: string;
  nextButton: string;
  completeButton: string;
  lastStepButton: string;
  stepHeaderPrefix: string;
  progressBlockFilled: string;
  progressBlockEmpty: string;
  instructionSectionLabel: string;
  guideSectionLabel: string;
  almostDone: string;
  nextStepPrompt: string;
  finalStepGuide: string;
  stepImagePlaceholder: string;
  notFoundMessage: string;
  loadingMessage: string;
  completionMessage: string;
  completionSub: string;
  currentStepLabel: string;
  goHomeButton: string;
  stepTimeEstimate: (minutes: number) => string;
  progressLabel: (current: number, total: number) => string;
  startHint: string;
};

type GreetingBrainCopy = {
  returningUser: string;
  yesterdayMeal: (menuTitle: string) => string;
  varietyHint: string;
};

type TodayBriefingCopy = {
  headerLabel: string;
  todaySummary: (weekdayLabel: string, mealTimeLabel: string) => string;
  weatherSummary: (weather: MockWeather) => string;
  recentMealEmpty: string;
  recentMealLatest: (menuTitle: string, mealTimeLabel: string) => string;
  recommendationVariety: string;
  recommendationDefault: (nickname: string) => string;
  cardTitle: string;
  cardWeatherLabel: string;
  cardRecentMealLabel: string;
  cardTasteLabel: string;
  cardStreakLabel: string;
  cardChallengeLabel: string;
  tasteEmpty: string;
  tasteCategory: (categoryLabel: string) => string;
  streakZero: string;
  streakActive: (days: number) => string;
  categoryLabels: Record<PreferenceCategory, string>;
  challenges: Record<DailyChallengeId, DailyChallenge>;
};

type HomeDecisionCopy = {
  appHeadline: string;
  appSubtitle: string;
  todayMealTitle: string;
  recommendationBadgeLabel: string;
  acceptButtonHomemade: string;
  acceptButtonDelivery: string;
  refreshButton: string;
  reasonLabel: string;
  reasonWhyToday: string;
  reasonWhyThisMeal: string;
  reasonWhyNow: string;
  alternativesSectionLabel: string;
  explanationLevel2Label: string;
  explanationSectionLabel: string;
  warmClosingDefault: string;
  metaTimeLabel: string;
  metaDifficultyLabel: string;
  difficultyLabels: Record<Difficulty, string>;
  loadingTitle: string;
  confidenceTitle: string;
  confidenceMatchedFrom: string;
  pairingsSectionLabel: string;
  pairingsMoreLabel: string;
  honeyTipSectionLabel: string;
  trustReasonWeatherTitle: string;
  trustReasonRecentTitle: string;
  trustReasonTimeTitle: string;
  homeReasonTitleWeather: string;
  homeReasonTitleRecent: string;
  homeReasonTitleTime: string;
  homeReasonTitleCook: string;
  homeReasonTitleDelivery: string;
  homeReasonSubWeatherDefault: string;
  homeReasonSubWeatherRain: string;
  homeReasonSubWeatherHot: string;
  homeReasonSubWeatherCold: string;
  homeReasonSubRecentDefault: string;
  homeReasonSubRecentVariety: string;
  homeReasonSubRecentFavorite: string;
  homeReasonSubRecentPreference: string;
  homeReasonSubRecentFamiliar: string;
  homeReasonSubCookQuick: string;
  homeReasonSubCookDelivery: string;
  homeReasonSubCookDefault: string;
  matchSourcePreferenceDNA: string;
  matchSourceRecentMeals: string;
  matchSourceWeather: string;
  imagePlaceholder: string;
  reasonYesterdayMeat: (menuTitle: string) => string;
  reasonYesterdaySpicy: string;
  reasonLighterToday: string;
  reasonHotWeather: string;
  reasonColdWeather: string;
  reasonNeedVegetables: string;
  reasonMatchesPreference: string;
  reasonMatchesSkillBeginner: string;
  reasonMatchesSkillIntermediate: string;
  reasonFallback: string;
  decisionHint: string;
  saveMealButton: string;
  saveMealToast: string;
  acceptErrorToast: string;
  showDetailsLabel: string;
  hideDetailsLabel: string;
  favoriteHintSaved: string;
  favoriteHintEmpty: string;
  trustChipWeatherDefault: string;
  trustChipWeatherRain: string;
  trustChipWeatherHot: string;
  trustChipWeatherCold: string;
  trustChipRecentVariety: string;
  trustChipRecentFavorite: string;
  trustChipRecentPreference: string;
  trustChipRecentFamiliar: string;
  trustChipRecentDefault: string;
  trustChipCookQuick: string;
  trustChipCookDelivery: string;
  trustChipCookDefault: string;
  whyThisMealLabel: string;
  quickInfoLabel: string;
  quickInfoCookLabel: string;
  quickInfoDifficultyLabel: string;
  quickInfoServingsLabel: string;
  refreshingLabel: string;
  quickLinksTitle: string;
  quickFavoritesLabel: string;
  quickFavoritesEmpty: string;
  quickRecentLabel: string;
  quickCookingLabel: string;
  quickCookingHint: string;
  viewAllFavorites: string;
  supportingSectionLabel: string;
  modeSectionLabel: string;
  modeHomemadeOption: string;
  modeHomemadeSubtitle: string;
  modeDeliveryOption: string;
  modeDeliverySubtitle: string;
  acceptHintHomemade: string;
  acceptHintDelivery: string;
};

export type HankkiMessageBundle = {
  name: string;
  mealMode: {
    prompt: string;
    homemade: string;
    delivery: string;
    backLabel: string;
  };
  timeOfDay: Record<HankkiTimeOfDay, TimeOfDayCopy>;
  recommendation: RecommendationCopy;
  recipe: RecipeCopy;
  delivery: DeliveryCopy;
  mealConfirmed: MealConfirmedCopy;
  favorites: FavoritesCopy;
  viewedRecipes: ViewedRecipesCopy;
  cooking: CookingCopy;
  greetingBrain: GreetingBrainCopy;
  todayBriefing: TodayBriefingCopy;
  homeDecision: HomeDecisionCopy;
  saved: string;
  retry: RetryCopy;
};

const MEAL_TYPE_TO_TIME_OF_DAY: Record<MealType, HankkiTimeOfDay> = {
  breakfast: 'morning',
  lunch: 'lunch',
  dinner: 'dinner',
  late_night: 'lateNight',
};

export const HANKKI_MESSAGES: Record<HankkiLocale, HankkiMessageBundle> = {
  ko: {
    name: '한끼',
    mealMode: {
      prompt: '어떻게 드실래요?',
      homemade: '집에서',
      delivery: '외식·포장',
      backLabel: '← 다시 고르기',
    },
    timeOfDay: {
      morning: {
        greeting: '좋은 아침이에요',
        subtitle: '아침 메뉴, 같이 골라볼까요?',
      },
      lunch: {
        greeting: '점심이에요',
        subtitle: '오늘 점심, 뭐가 좋을까요?',
      },
      dinner: {
        greeting: '저녁 시간이에요',
        subtitle: '오늘 저녁, 뭐 드실래요?',
      },
      lateNight: {
        greeting: '밤이 깊었네요',
        subtitle: '가볍게 한 끼 어때요?',
      },
    },
    recommendation: {
      message: {
        breakfast: (menuTitle) => `아침엔 ${menuTitle} 어때요?`,
        lunch: (menuTitle) => `점심으로 ${menuTitle} 어때요?`,
        dinner: (menuTitle) => `오늘 저녁은 ${menuTitle} 어때요?`,
        late_night: (menuTitle) => `야식으로 ${menuTitle} 어때요?`,
      },
      initialThinking: {
        title: '잠깐만요',
        subtitle: '오늘 한 끼 골라볼게요.',
      },
      thinkingTitle: '다른 메뉴도 볼게요',
      thinkingSteps: [
        '비슷한 메뉴 살펴보는 중',
        '부담 없는 한 끼 찾는 중',
        '괜찮을 것 같은 메뉴 고르는 중',
      ],
      acceptButton: '오늘은 이걸로',
      refreshButton: '다른 메뉴 볼래요?',
      reasonLabel: '오늘 이렇게 골랐어요',
      modeLabels: {
        homemade: '집에서',
        delivery: '외식·포장',
      },
    },
    recipe: {
      backLabel: '← 돌아가기',
      backToRecommendationLabel: '← 메뉴 고르기',
      backToConfirmedLabel: '← 오늘 메뉴로',
      screenEyebrow: '오늘의 메뉴',
      todayRecommendationBadge: '오늘의 추천',
      ingredientsTitle: '필요한 재료',
      mainIngredientsLabel: '주재료',
      subIngredientsLabel: '부재료',
      seasoningsTitle: '양념',
      optionalIngredientLabel: '(선택)',
      stepsTitle: '만드는 방법',
      stepsIntro: '순서대로 따라 하면 돼요.',
      stepsStartLabel: '시작',
      stepTipLabel: 'Tip',
      tipTitle: '💡 한끼 꿀팁',
      tipEmoji: '💡',
      imagePlaceholder: '사진 준비 중',
      notFoundMessage: '메뉴를 찾지 못했어요.',
      loadingMessage: '불러오는 중…',
      metaTime: '조리시간',
      metaDifficulty: '난이도',
      metaServings: '인분',
      metaCalories: '칼로리',
      metaDeliveryTime: '예상 시간',
      startCookingButton: '레시피 보기',
      otherMenuButton: '다른 메뉴',
      otherMenuRecommendLink: '다른 메뉴 추천',
      favoriteButton: '즐겨찾기',
      favoriteSavedToast: '즐겨찾기에 담았어요',
      favoriteRemovedToast: '즐겨찾기에서 뺐어요',
      cookingCompleteToast: '요리를 완료했어요',
      completionSectionTitle: '완성',
      completionCardTitle: '맛있게 완성했어요',
      completionDefaultBody: (mealTitle) =>
        `${mealTitle}으로 든든한 한 끼를 완성했어요.`,
      backToMenuLabel: '← 홈으로',
      ingredientsRequiredLabel: '꼭 필요해요',
      ingredientsOptionalLabel: '있으면 더 좋아요',
      donePreviewTitle: '완료하면',
      donePreviewBody: '만들기 끝나면 오늘 메뉴로 기록돼요.',
      ingredientsIntro: '재료부터 살펴볼게요.',
      warmSentence: '오늘은 이 메뉴로 든든하게 한 끼 해요.',
      mealCompletedButton: '오늘 이 메뉴 먹었어요!',
      mealCompletedToast: '한끼가 기억해둘게요',
      mealCompletedDuplicateToast: '오늘 식사로 이미 기록되어 있습니다.',
      feedbackTitle: '이 추천은 어떠셨나요?',
      feedbackGood: '😊 좋았어요',
      feedbackNeutral: '😐 그냥 그랬어요',
      feedbackBad: '😕 별로였어요',
      feedbackThankYouToast: '고마워요!\n한끼가 더 똑똑해질게요',
      servingAdjustTitle: '인분 조절',
      servingAdjustDecreaseA11y: '인분 줄이기',
      servingAdjustIncreaseA11y: '인분 늘리기',
      servingAdjustReset: '기준 인분으로 되돌리기',
      servingAdjustHint:
        '재료 수량은 인분에 맞춰 자동 계산한 값이며, 조리 방식과 기호에 따라 조절해 주세요.',
      servingPracticalRoundHint: '조리하기 편하도록 일부 수량은 실용 단위로 표시했어요.',
      servingScaledFromBase: (base) => `${base}인분 기준에서 계산`,
      servingFuzzyHint: '취향에 맞게 조절',
      servingStepsAdjustHint:
        '조리 시간과 물의 양은 냄비 크기와 재료 상태에 따라 조절이 필요할 수 있어요.',
    },
    delivery: {
      screenEyebrow: '외식·포장',
      placeholderTitle: '주변에서 찾아보세요',
      placeholderBody: '맛집, 포장, 배달 앱에서 메뉴 이름을 검색해 보세요.',
      completeButton: '먹기로 정했어요',
      backToHomeLabel: '← 홈으로',
      loadingMessage: '불러오는 중…',
      notFoundMessage: '메뉴를 찾지 못했어요.',
      completionMessage: '맛있게 드세요',
      completionSub: '오늘도 좋은 한 끼였어요.',
      goHomeButton: '홈으로',
    },
    mealConfirmed: {
      message: '오늘 메뉴 정해졌어요',
      subMessage: '편하게 드세요.',
      menuLabel: '오늘의 메뉴',
      startCookingButton: '만들기 시작',
      saveButton: '저장하기',
      savedButton: '저장됨',
      viewMenuButton: '레시피 보기',
      chooseAnotherButton: '다른 메뉴',
      backToRecommendationLabel: '← 홈으로',
      goHome: '홈으로',
      notFoundMessage: '메뉴를 찾지 못했어요.',
      loadingMessage: '확인하는 중…',
    },
    cooking: {
      backLabel: '← 홈으로',
      prevButton: '이전',
      nextButton: '다음',
      completeButton: '다 만들었어요',
      lastStepButton: '요리 완료',
      stepHeaderPrefix: 'STEP',
      progressBlockFilled: '■',
      progressBlockEmpty: '□',
      instructionSectionLabel: '이렇게 해요',
      guideSectionLabel: '한끼의 한마디',
      almostDone: '거의 다 왔어요',
      nextStepPrompt: '다음 단계로 넘어갈까요?',
      finalStepGuide: '맛있게 완성됐어요.',
      stepImagePlaceholder: '단계 사진 준비 중',
      notFoundMessage: '요리 정보를 찾지 못했어요.',
      loadingMessage: '준비하는 중…',
      completionMessage: '맛있게 완성했어요',
      completionSub: '오늘도 좋은 한 끼였어요.',
      currentStepLabel: '현재 단계',
      goHomeButton: '홈으로',
      stepTimeEstimate: (minutes) => `약 ${minutes}분`,
      progressLabel: (current, total) => `${current} / ${total}단계`,
      startHint: '하나씩 따라 해볼게요.',
    },
    greetingBrain: {
      returningUser: '오늘도 왔네요',
      yesterdayMeal: (menuTitle) => `어제는 ${menuTitle} 드셨죠.`,
      varietyHint: '오늘은 다른 메뉴도 준비해뒀어요.',
    },
    todayBriefing: {
      headerLabel: '오늘 한눈에',
      todaySummary: (weekdayLabel, mealTimeLabel) =>
        `${weekdayLabel} ${mealTimeLabel}, 오늘도 맛있게 챙겨 드세요.`,
      weatherSummary: (weather) => {
        if (weather.condition === 'rainy') return '비 오는 날, 따뜻한 한 끼가 생각나요.';
        if (weather.condition === 'cold') return '쌀쌀한 날, 몸을 녹이는 한 끼가 좋아요.';
        if (weather.condition === 'hot') return '더운 날, 가볍게 먹기 좋아요.';
        if (weather.condition === 'cloudy') return '오늘은 편하게 한 끼 드시기 좋아요.';
        return '오늘은 가볍게 먹기 좋은 날이에요.';
      },
      recentMealEmpty: '아직 기록이 없어요.',
      recentMealLatest: (menuTitle, mealTimeLabel) =>
        `최근엔 ${mealTimeLabel}에 ${menuTitle} 드셨어요.`,
      recommendationVariety: '오늘은 다른 한 끼도 준비해뒀어요.',
      recommendationDefault: (nickname) => `${nickname}님, 오늘 뭐 드실래요?`,
      cardTitle: '오늘 한눈에 보기',
      cardWeatherLabel: '날씨',
      cardRecentMealLabel: '최근 식사',
      cardTasteLabel: '취향',
      cardStreakLabel: '연속 요리',
      cardChallengeLabel: '오늘의 챌린지',
      tasteEmpty: '아직 취향이 쌓이지 않았어요',
      tasteCategory: (categoryLabel) => `${categoryLabel}을(를) 좋아하시네요`,
      streakZero: '오늘부터 함께 시작해요',
      streakActive: (days) => `${days}일 연속 요리 중이에요!`,
      categoryLabels: {
        korean: '한식',
        japanese: '일식',
        chinese: '중식',
        western: '양식',
        dessert: '디저트',
        healthy: '건강식',
        baby: '이유식',
        snacks: '간식',
        drinks: '음료',
        catalog: '다양한 메뉴',
      },
      challenges: {
        eat_vegetables: {
          id: 'eat_vegetables',
          title: '채소 먹기',
          description: '오늘 한 끼에 채소를 넣어볼까요?',
          emoji: '🥬',
        },
        eat_soup: {
          id: 'eat_soup',
          title: '국물요리 먹기',
          description: '따뜻한 국물로 몸을 챙겨보세요.',
          emoji: '🍲',
        },
        try_new_menu: {
          id: 'try_new_menu',
          title: '새로운 메뉴 먹기',
          description: '평소와 다른 메뉴에 도전해 볼까요?',
          emoji: '✨',
        },
      },
    },
    homeDecision: {
      appHeadline: '오늘 뭐 먹지?',
      appSubtitle: '한끼가 오늘도 맛있는 선택을 도와드릴게요.',
      todayMealTitle: '오늘의 한 끼',
      recommendationBadgeLabel: '오늘의 추천',
      acceptButtonHomemade: '이 메뉴로 할게요 →',
      acceptButtonDelivery: '어디서 먹을지 보기 →',
      refreshButton: '다른 메뉴 볼래요',
      reasonLabel: '오늘은 이렇게',
      reasonWhyToday: '오늘은',
      reasonWhyThisMeal: '이 메뉴는',
      reasonWhyNow: '지금은',
      alternativesSectionLabel: '이것도 괜찮아요',
      explanationLevel2Label: '오늘은 이렇게',
      explanationSectionLabel: '오늘은 이렇게',
      warmClosingDefault: '맛있게 드세요',
      metaTimeLabel: '준비 시간',
      metaDifficultyLabel: '난이도',
      difficultyLabels: {
        easy: '쉬움',
        normal: '보통',
        hard: '어려움',
      },
      loadingTitle: '메뉴 고르는 중',
      confidenceTitle: '편하게 드세요',
      confidenceMatchedFrom: '오늘 이렇게 맞아요',
      pairingsSectionLabel: '함께 먹으면 좋아요',
      pairingsMoreLabel: '더보기 >',
      honeyTipSectionLabel: '한끼 꿀팁',
      trustReasonWeatherTitle: '오늘 날씨에',
      trustReasonRecentTitle: '최근 식사와',
      trustReasonTimeTitle: '지금 시간에',
      homeReasonTitleWeather: '오늘 날씨',
      homeReasonTitleRecent: '최근 식사',
      homeReasonTitleTime: '지금 시간',
      homeReasonTitleCook: '조리 부담',
      homeReasonTitleDelivery: '외식·포장',
      homeReasonSubWeatherDefault: '잘 어울려요',
      homeReasonSubWeatherRain: '따뜻한 메뉴가 잘 어울려요',
      homeReasonSubWeatherHot: '가벼운 메뉴가 잘 어울려요',
      homeReasonSubWeatherCold: '따뜻한 메뉴가 잘 어울려요',
      homeReasonSubRecentDefault: '균형이 좋아요',
      homeReasonSubRecentVariety: '메뉴가 달라요',
      homeReasonSubRecentFavorite: '마음에 들어요',
      homeReasonSubRecentPreference: '입맛에 맞아요',
      homeReasonSubRecentFamiliar: '익숙한 맛',
      homeReasonSubCookQuick: '가볍게 준비',
      homeReasonSubCookDelivery: '편하게 즐겨요',
      homeReasonSubCookDefault: '잘 맞아요',
      matchSourcePreferenceDNA: '당신의 취향',
      matchSourceRecentMeals: '최근 식사',
      matchSourceWeather: '오늘 날씨',
      imagePlaceholder: '사진 준비 중',
      reasonYesterdayMeat: (menuTitle) => `어제 ${menuTitle} 드셨죠. 오늘은 가볍게.`,
      reasonYesterdaySpicy: '어제 매운 음식이었어요. 오늘은 부담 없이.',
      reasonLighterToday: '요즘이랑 살짝 달라요.',
      reasonHotWeather: '오늘은 가볍게요.',
      reasonColdWeather: '쌀쌀한 날, 따뜻하게요.',
      reasonNeedVegetables: '요즘 채소 좀 드세요.',
      reasonMatchesPreference: '평소 좋아하시는 맛이에요.',
      reasonMatchesSkillBeginner: '처음이어도 괜찮아요.',
      reasonMatchesSkillIntermediate: '지금 실력에 딱이에요.',
      reasonFallback: '오늘은 이게 좋겠어요.',
      decisionHint: '탭 한 번이면 바로 시작',
      saveMealButton: '나중에 먹기',
      saveMealToast: '기억해뒀어요',
      acceptErrorToast: '잠시 문제가 생겼어요. 다시 시도해 주세요.',
      showDetailsLabel: '더 보기',
      hideDetailsLabel: '접기',
      favoriteHintSaved: '찜한 메뉴예요',
      favoriteHintEmpty: '마음에 들면 찜해요',
      trustChipWeatherDefault: '오늘 날씨에 잘 어울려요',
      trustChipWeatherRain: '오늘은 비가 와요',
      trustChipWeatherHot: '오늘은 더워요',
      trustChipWeatherCold: '오늘은 쌀쌀해요',
      trustChipRecentVariety: '최근 메뉴와 달라요',
      trustChipRecentFavorite: '마음에 두던 메뉴예요',
      trustChipRecentPreference: '평소 입맛에 맞아요',
      trustChipRecentFamiliar: '익숙한 맛이에요',
      trustChipRecentDefault: '요즘 식사에 잘 맞아요',
      trustChipCookQuick: '부담 없이 준비해요',
      trustChipCookDelivery: '외식·포장으로 편해요',
      trustChipCookDefault: '지금 시간에 잘 맞아요',
      whyThisMealLabel: '왜 이 메뉴일까요',
      quickInfoLabel: '한눈에',
      quickInfoCookLabel: '조리시간',
      quickInfoDifficultyLabel: '난이도',
      quickInfoServingsLabel: '인분',
      refreshingLabel: '바꿔보는 중…',
      quickLinksTitle: '더 보기',
      quickFavoritesLabel: '취향 목록',
      quickFavoritesEmpty: '아직 저장한 메뉴가 없어요',
      quickRecentLabel: '최근 식사',
      quickCookingLabel: '오늘 메뉴 보기',
      quickCookingHint: '레시피를 다시 볼 수 있어요',
      viewAllFavorites: '전체 보기',
      supportingSectionLabel: '한끼의 한마디',
      modeSectionLabel: '이 메뉴, 어떻게 즐길까요?',
      // Short titles only — never "집에서 만들어 먹기" (clips on iPhone).
      modeHomemadeOption: '집에서 만들기',
      modeHomemadeSubtitle: 'AI 추천 레시피',
      modeDeliveryOption: '외식·포장',
      modeDeliverySubtitle: '준비 중',
      acceptHintHomemade: '레시피와 재료를 확인합니다.',
      acceptHintDelivery: '외식·포장 정보를 확인합니다.',
    },
    favorites: {
      savedToast: '❤️ 즐겨찾기에 저장되었습니다.',
      removedToast: '즐겨찾기에서 제거되었습니다.',
      screenTitle: '내 메뉴',
      screenSubtitle: '저장한 메뉴를 모아봤어요.',
      loadingMessage: '불러오는 중…',
      emptyTitle: '아직 저장한 메뉴가 없습니다.',
      emptyMessage: '홈에서 마음에 드는 메뉴에 하트를 눌러보세요.',
      emptyGoHomeButton: '추천 메뉴 보러가기',
      backLabel: '← 홈으로',
      openListLabel: '내 메뉴',
      metaTime: '준비 시간',
    },
    viewedRecipes: {
      screenTitle: '최근 본 메뉴',
      screenSubtitle: '최근에 둘러본 메뉴를 모아봤어요.',
      loadingMessage: '불러오는 중…',
      emptyTitle: '아직 본 메뉴가 없어요.',
      emptyMessage: '마음에 드는 메뉴를 둘러보세요.',
      emptyGoHomeButton: '홈으로 가기',
    },
    saved: '취향에 저장했어요',
    retry: {
      title: '잠깐만요',
      message: '다시 해볼게요.',
      button: '다시 해볼게',
    },
  },
};

export const HANKKI_NAME = HANKKI_MESSAGES.ko.name;

function getBundle(locale: HankkiLocale = 'ko'): HankkiMessageBundle {
  return HANKKI_MESSAGES[locale];
}

function getTimeOfDayCopy(mealType: MealType, locale: HankkiLocale = 'ko'): TimeOfDayCopy {
  const timeOfDay = MEAL_TYPE_TO_TIME_OF_DAY[mealType];
  return getBundle(locale).timeOfDay[timeOfDay];
}

export function getHankkiTimeGreeting(
  mealType: MealType,
  locale: HankkiLocale = 'ko',
): string {
  return getTimeOfDayCopy(mealType, locale).greeting;
}

export function getHankkiGreetingSubtitle(
  mealType: MealType,
  locale: HankkiLocale = 'ko',
): string {
  return getTimeOfDayCopy(mealType, locale).subtitle;
}

export function getHankkiPersonalGreeting(
  nickname: string,
  mealType: MealType,
  locale: HankkiLocale = 'ko',
): string {
  const { greeting } = getTimeOfDayCopy(mealType, locale);
  const withoutEmoji = greeting.replace(' 😊', '');
  return `${nickname}님, ${withoutEmoji} 😊`;
}

export function getHankkiRecommendationMessage(
  mealType: MealType,
  menuTitle: string,
  locale: HankkiLocale = 'ko',
): string {
  return getBundle(locale).recommendation.message[mealType](menuTitle);
}

export function getHankkiThinkingTitle(locale: HankkiLocale = 'ko'): string {
  return getBundle(locale).recommendation.thinkingTitle;
}

export function getHankkiInitialThinkingMessages(locale: HankkiLocale = 'ko') {
  return getBundle(locale).recommendation.initialThinking;
}

export function getHankkiBackToMealModeLabel(locale: HankkiLocale = 'ko'): string {
  return getBundle(locale).mealMode.backLabel;
}

export function getHankkiThinkingSteps(locale: HankkiLocale = 'ko'): string[] {
  return getBundle(locale).recommendation.thinkingSteps;
}

export function getHankkiSavedMessage(locale: HankkiLocale = 'ko'): string {
  return getBundle(locale).saved;
}

export function getHankkiRetryMessages(locale: HankkiLocale = 'ko'): RetryCopy {
  return getBundle(locale).retry;
}

export function getHankkiMealModePrompt(locale: HankkiLocale = 'ko'): string {
  return getBundle(locale).mealMode.prompt;
}

export function getHankkiMealModeLabels(locale: HankkiLocale = 'ko') {
  return getBundle(locale).mealMode;
}

export function getHankkiRecommendationButtons(locale: HankkiLocale = 'ko') {
  const { acceptButton, refreshButton, reasonLabel, modeLabels } =
    getBundle(locale).recommendation;
  return { acceptButton, refreshButton, reasonLabel, modeLabels };
}

export function getHankkiRecipeMessages(locale: HankkiLocale = 'ko') {
  return getBundle(locale).recipe;
}

export function getHankkiDeliveryMessages(locale: HankkiLocale = 'ko') {
  return getBundle(locale).delivery;
}

export function getHankkiFavoritesMessages(locale: HankkiLocale = 'ko') {
  return getBundle(locale).favorites;
}

export function getHankkiViewedRecipesMessages(locale: HankkiLocale = 'ko') {
  return getBundle(locale).viewedRecipes;
}

export function getHankkiFavoriteSavedToast(locale: HankkiLocale = 'ko'): string {
  return getBundle(locale).favorites.savedToast;
}

export function getHankkiFavoriteRemovedToast(locale: HankkiLocale = 'ko'): string {
  return getBundle(locale).favorites.removedToast;
}

export function getHankkiCookingMessages(locale: HankkiLocale = 'ko') {
  return getBundle(locale).cooking;
}

export function getHankkiGreetingBrainMessages(locale: HankkiLocale = 'ko') {
  return getBundle(locale).greetingBrain;
}

export function getHankkiTodayBriefingMessages(locale: HankkiLocale = 'ko') {
  return getBundle(locale).todayBriefing;
}

export function getHankkiHomeDecisionMessages(locale: HankkiLocale = 'ko') {
  return getBundle(locale).homeDecision;
}

export function getHankkiMealConfirmedMessages(locale: HankkiLocale = 'ko') {
  return getBundle(locale).mealConfirmed;
}
