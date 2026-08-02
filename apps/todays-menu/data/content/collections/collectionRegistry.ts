import type { CollectionId } from '../types/contentBase';

export type CollectionStatus = 'active' | 'coming_soon' | 'hidden';

export type CollectionDefinition = {
  id: CollectionId;
  label: string;
  description: string;
  sortOrder: number;
  status: CollectionStatus;
};

export const COLLECTION_REGISTRY: CollectionDefinition[] = [
  {
    id: 'HOME',
    label: '오늘의 한 끼',
    description: '집에서 만들 수 있는 메뉴',
    sortOrder: 0,
    status: 'active',
  },
  {
    id: 'SOLO',
    label: '1인 메뉴',
    description: '혼자 먹기 좋은 메뉴',
    sortOrder: 10,
    status: 'active',
  },
  {
    id: 'FAST',
    label: '빠른 메뉴',
    description: '15분 안에 만들 수 있는 메뉴',
    sortOrder: 20,
    status: 'active',
  },
  {
    id: 'FAMILY',
    label: '가족 메뉴',
    description: '가족과 함께 먹기 좋은 메뉴',
    sortOrder: 30,
    status: 'coming_soon',
  },
  {
    id: 'KIDS',
    label: '아이 반찬',
    description: '아이와 함께 먹기 좋은 메뉴',
    sortOrder: 40,
    status: 'coming_soon',
  },
  {
    id: 'MIDNIGHT',
    label: '야식',
    description: '밤에 먹기 좋은 메뉴',
    sortOrder: 50,
    status: 'coming_soon',
  },
  {
    id: 'HANGOVER',
    label: '해장',
    description: '해장에 좋은 메뉴',
    sortOrder: 60,
    status: 'coming_soon',
  },
  {
    id: 'DIET',
    label: '다이어트',
    description: '가볍게 먹고 싶을 때',
    sortOrder: 70,
    status: 'coming_soon',
  },
  {
    id: 'HEALTHY',
    label: '건강식',
    description: '건강하게 즐기는 메뉴',
    sortOrder: 80,
    status: 'coming_soon',
  },
  {
    id: 'PARTY',
    label: '손님 접대',
    description: '손님과 함께 즐기는 메뉴',
    sortOrder: 90,
    status: 'coming_soon',
  },
  {
    id: 'CAMPING',
    label: '캠핑',
    description: '캠핑에서 만들기 좋은 메뉴',
    sortOrder: 100,
    status: 'coming_soon',
  },
  {
    id: 'CONVENIENCE',
    label: '편의점 꿀조합',
    description: '편의점 제품으로 만드는 한 끼',
    sortOrder: 110,
    status: 'coming_soon',
  },
  {
    id: 'MEALKIT',
    label: '밀키트',
    description: '밀키트로 만드는 메뉴',
    sortOrder: 120,
    status: 'coming_soon',
  },
  {
    id: 'FRANCHISE',
    label: '프랜차이즈',
    description: '외식·프랜차이즈 메뉴',
    sortOrder: 130,
    status: 'coming_soon',
  },
  {
    id: 'RAINY',
    label: '비 오는 날',
    description: '비 오는 날에 어울리는 메뉴',
    sortOrder: 200,
    status: 'hidden',
  },
  {
    id: 'SPRING',
    label: '봄 메뉴',
    description: '봄에 어울리는 메뉴',
    sortOrder: 210,
    status: 'hidden',
  },
  {
    id: 'SUMMER',
    label: '여름 메뉴',
    description: '여름에 어울리는 메뉴',
    sortOrder: 220,
    status: 'hidden',
  },
  {
    id: 'AUTUMN',
    label: '가을 메뉴',
    description: '가을에 어울리는 메뉴',
    sortOrder: 230,
    status: 'hidden',
  },
  {
    id: 'WINTER',
    label: '겨울 메뉴',
    description: '겨울에 어울리는 메뉴',
    sortOrder: 240,
    status: 'hidden',
  },
  {
    id: 'POPULAR',
    label: '인기 메뉴',
    description: '많이 찾는 메뉴',
    sortOrder: 300,
    status: 'hidden',
  },
  {
    id: 'NEW',
    label: '신규 메뉴',
    description: '새로 추가된 메뉴',
    sortOrder: 310,
    status: 'hidden',
  },
  {
    id: 'EDITOR_PICK',
    label: '에디터 추천',
    description: '운영자가 추천하는 메뉴',
    sortOrder: 320,
    status: 'hidden',
  },
  {
    id: 'SIDE_DISH',
    label: '반찬',
    description: '한 끼에 곁들이기 좋은 반찬',
    sortOrder: 330,
    status: 'hidden',
  },
];

const REGISTRY_BY_ID = new Map<CollectionId, CollectionDefinition>(
  COLLECTION_REGISTRY.map((entry) => [entry.id, entry]),
);

export function getCollectionDefinition(id: CollectionId): CollectionDefinition | undefined {
  return REGISTRY_BY_ID.get(id);
}

export function listRegisteredCollectionIds(): CollectionId[] {
  return COLLECTION_REGISTRY.map((entry) => entry.id);
}
