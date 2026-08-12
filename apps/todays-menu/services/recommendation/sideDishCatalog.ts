import type { MenuItem } from '../../types/recommendation';
import { attachMenuTags } from './menuCatalogTags';

/**
 * 반찬 catalog — excluded from primary recommendation.
 * Referenced via `recommendedSides` on MAIN meals for future pairing UI.
 */
const SIDE_DISH_MENU_RAW: Omit<MenuItem, 'tags'>[] = [
  {
    id: 'side_001',
    mode: 'homemade',
    type: 'SIDE',
    title: '계란말이',
    subtitle: '부드러운 기본 반찬',
    mealTime: ['LUNCH', 'DINNER'],
    cookTime: 10,
    difficulty: 'easy',
    aiReason: '메인 요리와 잘 어울리는 담백한 반찬이에요.',
    badges: [{ label: '⏱ 10분', type: 'time' }],
    honeyTip: '약한 불에서 천천히 말아주면 더 부드러워요.',
  },
  {
    id: 'side_002',
    mode: 'homemade',
    type: 'SIDE',
    title: '시금치나물',
    subtitle: '담백한 나물 반찬',
    mealTime: ['LUNCH', 'DINNER'],
    cookTime: 10,
    difficulty: 'easy',
    aiReason: '국물 요리와 잘 어울리는 나물이에요.',
    badges: [{ label: '⏱ 10분', type: 'time' }],
    honeyTip: '데친 뒤 찬물에 식히면 색이 선명해요.',
  },
  {
    id: 'side_003',
    mode: 'homemade',
    type: 'SIDE',
    title: '콩나물무침',
    subtitle: '아삭한 기본 반찬',
    mealTime: ['LUNCH', 'DINNER'],
    cookTime: 8,
    difficulty: 'easy',
    aiReason: '집밥에 빠질 수 없는 기본 반찬이에요.',
    badges: [{ label: '⏱ 8분', type: 'time' }],
  },
  {
    id: 'side_004',
    mode: 'homemade',
    type: 'SIDE',
    title: '멸치볶음',
    subtitle: '고소한 밥도둑 반찬',
    mealTime: ['LUNCH', 'DINNER'],
    cookTime: 12,
    difficulty: 'easy',
    aiReason: '고소하게 볶으면 밥이 술술 넘어가요.',
    badges: [{ label: '⏱ 12분', type: 'time' }],
    honeyTip: '물기를 완전히 말린 멸치를 쓰면 더 바삭해요.',
  },
] ;

export const SIDE_DISH_MENUS: MenuItem[] = SIDE_DISH_MENU_RAW.map(attachMenuTags);
