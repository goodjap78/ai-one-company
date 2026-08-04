/**
 * Sprint 48-B.2 / 48-B.3 — comboKind 분류 및 콘텐츠 품질 정제.
 */
import { convenienceCombosCopy } from '../../../constants/convenienceCombosCopy';
import type {
  ComboKind,
  ConvenienceCombo,
  ConvenienceComboDraft,
} from '../types/convenienceCombo';

type ComboEnrichment = {
  comboKind: ComboKind;
  whyItWorks: string;
  transformationName?: string;
  title?: string;
  description?: string;
  items?: { name: string }[];
  assemblyGuide?: string[];
  imageKey?: string;
};

const PATCHES: Record<string, ComboEnrichment> = {
  combo_0001: {
    comboKind: 'hack_combo',
    imageKey: 'triangle_kimbap_rice_noodle_combo',
    title: '삼각김밥 라밥',
    transformationName: '삼각김밥 라밥',
    description: '끓인 컵라면에 삼각김밥을 넣고 비벼 라밥처럼 먹어요.',
    items: [{ name: '컵라면' }, { name: '삼각김밥' }],
    whyItWorks: '면과 밥이 스프에 스며들며 쫄깃하고 든든한 식감이 돼요.',
    assemblyGuide: [
      '끓는 물에 컵라면을 조리하고 물을 적당히만 남겨요. 뜨거운 용기에 주의해요.',
      '삼각김밥을 넣고 가위로 잘게 잘라요.',
      '스프와 비벼 뜨거울 때 드세요.',
    ],
  },
  combo_0002: {
    comboKind: 'easy_set',
    title: '도시락 컵밥 세트',
    whyItWorks: '도시락과 컵밥을 골라 한 번에 든든하게 채울 수 있어요.',
    assemblyGuide: ['도시락과 컵밥을 데워요.', '음료와 함께 드세요.'],
  },
  combo_0003: {
    comboKind: 'easy_set',
    title: '햄버거 감자 세트',
    whyItWorks: '햄버거의 포만감과 감자튀김의 바삯함이 한 세트로 맞아요.',
    assemblyGuide: ['햄버거를 데워요.', '감자튀김과 음료를 곁들여 드세요.'],
  },
  combo_0004: {
    comboKind: 'easy_set',
    title: '샌드위치 요구르트',
    whyItWorks: '샌드위치의 든든함과 요구르트의 상큼함이 부담 없이 맞아요.',
    assemblyGuide: ['샌드위치를 꺼내요.', '요구르트와 과일을 곁들여 드세요.'],
  },
  combo_0005: {
    comboKind: 'easy_set',
    title: '김밥 우동 세트',
    whyItWorks: '따뜻한 우동과 김밥이 함께 속을 편하게 채워줘요.',
    assemblyGuide: ['컵우동을 끓여요.', '김밥과 함께 드세요.'],
  },
  combo_0006: {
    comboKind: 'easy_set',
    title: '치킨텐더 밥 세트',
    whyItWorks: '치킨의 바삯함과 밥이 함께 간단한 든든한 한 끼가 돼요.',
    assemblyGuide: ['치킨을 데워요.', '밥과 함께 드세요.'],
  },
  combo_0007: {
    comboKind: 'easy_set',
    title: '두부비빔면 주먹밥',
    whyItWorks: '가벼운 비빔면과 주먹밥이 함께 균형 잡힌 조합이 돼요.',
    assemblyGuide: ['비빔면을 준비해요.', '주먹밥과 함께 드세요.'],
  },
  combo_0008: {
    comboKind: 'hack_combo',
    title: '주먹밥 컵누들 비빔',
    transformationName: '컵누들 비빔밥',
    description: '가벼운 컵누들과 주먹밥을 한 그릇에 비벼 먹어요.',
    whyItWorks: '가벼운 면과 밥이 스프에 섞이며 한 그릇 비빔밥 식감이 나요.',
    assemblyGuide: [
      '컵누들을 조리하고 물을 거의 없게 버려요. 뜨거운 용기에 주의해요.',
      '주먹밥을 넣고 스프와 함께 비벼요.',
      '뜨거울 때 한 번 더 비벼 드세요.',
    ],
  },
  combo_0009: {
    comboKind: 'easy_set',
    title: '샐러드 닭가슴살',
    whyItWorks: '닭가슴살의 단백질과 샐러드의 신선함이 가볍게 맞아요.',
    assemblyGuide: ['닭가슴살을 데워요.', '샐러드와 빵과 함께 드세요.'],
  },
  combo_0010: {
    comboKind: 'hack_combo',
    title: '반숙란 토핑 라면',
    transformationName: '반숙란 라면',
    description: '라면에 반숙란을 올려 부드러운 식감을 더해요.',
    items: [{ name: '라면' }, { name: '반숙란' }, { name: '김' }],
    whyItWorks: '노른자가 스프에 스며들며 크리미하고 고소한 맛이 돼요.',
    assemblyGuide: [
      '라면을 끓는 물에 조리해요. 뜨거운 용기에 주의해요.',
      '반숙란을 반으로 잘라 올리고 노른자를 살짝 풀어요.',
      '김을 곁들여 따뜻할 때 드세요.',
    ],
  },
  combo_0011: {
    comboKind: 'hack_combo',
    title: '치즈 매운 컵라면',
    transformationName: '치즈 매운라면',
    description: '매운 컵라면에 치즈를 넣어 맵기를 부드럽게 완화해요.',
    items: [{ name: '매운 컵라면' }, { name: '슬라이스 치즈' }],
    whyItWorks: '치즈가 매운맛을 감싸 고소함과 부드러운 식감을 더해요.',
    assemblyGuide: [
      '컵라면을 조리하고 물을 알맞게 버려요. 뜨거운 용기에 주의해요.',
      '소스를 넣고 섞은 뒤 치즈 한 장을 올려요.',
      '치즈가 살짝 녹으면 함께 비벼 먹어요.',
    ],
  },
  combo_0012: {
    comboKind: 'easy_set',
    title: '삼각김밥 3개',
    whyItWorks: '삼각김밥만으로도 간단하게 한 끼를 채울 수 있어요.',
    assemblyGuide: ['삼각김밥을 꺼내 드세요.'],
  },
  combo_0013: {
    comboKind: 'hack_combo',
    title: '떡 치즈 라면',
    transformationName: '떡치즈 라면',
    description: '라면에 떡과 치즈를 넣어 쫄깃하고 고소한 맛을 만들어요.',
    items: [{ name: '컵라면' }, { name: '떡' }, { name: '슬라이스 치즈' }],
    whyItWorks: '떡의 쫄깃함과 치즈의 고소함이 스프에 녹아 풍미가 깊어져요.',
    assemblyGuide: [
      '라면을 조리하고 물을 어느 정도 남겨요. 뜨거운 용기에 주의해요.',
      '떡을 넣고 잠깐 더 끓여요.',
      '치즈를 올려 녹인 뒤 같이 비벼 드세요.',
    ],
  },
  combo_0014: {
    comboKind: 'easy_set',
    title: '순대 한 접시',
    whyItWorks: '순대와 소스만으로 간단한 야식 한 접시가 돼요.',
    assemblyGuide: ['순대를 데워요.', '소스와 함께 드세요.'],
  },
  combo_0015: {
    comboKind: 'hack_combo',
    title: '치즈 떡볶이 핫바',
    transformationName: '핫바 치즈떡볶이',
    description: '떡볶이에 치즈와 핫바를 넣어 간식 맛을 확장해요.',
    items: [{ name: '떡볶이' }, { name: '슬라이스 치즈' }, { name: '핫바' }],
    whyItWorks: '치즈가 매콤한 소스를 부드럽게 하고 핫바가 쫄깃한 식감을 더해요.',
    assemblyGuide: [
      '떡볶이를 데울 때 밀봉을 뜯고 전용 용기를 사용해요.',
      '치즈를 올려 살짝 녹여요.',
      '잘게 자른 핫바를 넣고 한 번 더 비벼 드세요.',
    ],
  },
  combo_0016: {
    comboKind: 'hack_combo',
    title: '치즈 녹인 핫도그',
    transformationName: '치즈 핫도그',
    description: '핫도그에 치즈를 녹여 간식을 한 끼로 바꿔요.',
    items: [{ name: '핫도그' }, { name: '슬라이스 치즈' }, { name: '감자튀김' }],
    whyItWorks: '녹은 치즈가 소시지와 빵 사이를 고소하게 이어줘요.',
    assemblyGuide: [
      '핫도그를 데울 때 밀봉을 뜯고 전용 용기를 사용해요.',
      '치즈를 올려 살짝 녹여요.',
      '감자튀김과 함께 드세요.',
    ],
  },
  combo_0017: {
    comboKind: 'easy_set',
    title: '라면 주먹밥 세트',
    description: '라면과 주먹밥을 번갈아 먹는 든든한 조합이에요.',
    whyItWorks: '따뜻한 국물과 주먹밥을 나눠 먹으면 포만감이 빠르게 채워져요.',
    assemblyGuide: ['라면을 끓여요.', '주먹밥을 곁들여 드세요.'],
  },
  combo_0018: {
    comboKind: 'easy_set',
    title: '치킨너겟 한 접시',
    whyItWorks: '너겟과 소스로 간단한 야식 한 접시를 즐길 수 있어요.',
    assemblyGuide: ['너겟을 데워요.', '소스와 함께 드세요.'],
  },
  combo_0019: {
    comboKind: 'easy_set',
    title: '청양고추 매운 라면',
    description: '매운 컵라면에 청양고추를 더해 맵기를 올린 조합이에요.',
    whyItWorks: '청양고추가 매운맛의 끝을 맵고 산뜻하게 올려줘요.',
    assemblyGuide: ['컵라면을 끓여요.', '청양고추를 잘게 썰어 곁들여 드세요.'],
  },
  combo_0020: {
    comboKind: 'hack_combo',
    imageKey: 'spicy_cheese_stir_noodles_combo',
    title: '매운 볶음면 치즈',
    transformationName: '치즈 매운볶음면',
    description: '매운 볶음면에 치즈를 넣어 맵기를 부드럽게 완화해요.',
    items: [{ name: '매운 볶음면' }, { name: '슬라이스 치즈' }],
    whyItWorks: '치즈가 매운맛을 잡아주고 녹은 식감이 고소한 풍미를 더해요.',
    assemblyGuide: [
      '볶음면을 조리하고 물을 알맞게 버려요. 뜨거운 용기에 주의해요.',
      '소스를 넣고 섞은 뒤 치즈를 올려요.',
      '치즈가 녹으면 비벼 드세요.',
    ],
  },
  combo_0021: {
    comboKind: 'hack_combo',
    title: '치즈 매운 떡볶이',
    transformationName: '밀키 떡볶이',
    description: '매운 떡볶이에 치즈를 넣어 밀키한 맛을 만들어요.',
    items: [{ name: '매운 떡볶이' }, { name: '슬라이스 치즈' }],
    whyItWorks: '치즈가 매콤한 소스를 부드럽게 감싸 밀키한 풍미가 돼요.',
    assemblyGuide: [
      '떡볶이를 데울 때 밀봉을 뜯고 전용 용기를 사용해요.',
      '치즈를 올려 살짝 녹여요.',
      '비벼서 뜨거울 때 드세요.',
    ],
  },
  combo_0022: {
    comboKind: 'easy_set',
    title: '매운 순대',
    whyItWorks: '매운 순대만으로도 간단한 야식 한 접시가 돼요.',
    assemblyGuide: ['순대를 데워 드세요.'],
  },
  combo_0023: {
    comboKind: 'hack_combo',
    title: '매운 라볶이',
    transformationName: '라볶이',
    description: '라면에 떡볶이 소스를 넣어 매콤달콤한 라볶이를 만들어요.',
    items: [{ name: '컵라면' }, { name: '떡볶이 소스' }],
    whyItWorks: '면이 떡볶이 소스에 스며 매콤달콤한 풍미가 한 그릇에 모여요.',
    assemblyGuide: [
      '라면을 조리하고 물을 거의 없게 버려요. 뜨거운 용기에 주의해요.',
      '떡볶이 소스를 넣고 섞어요.',
      '뜨거울 때 비벼 드세요.',
    ],
  },
  combo_0024: {
    comboKind: 'easy_set',
    title: '매운 닭발',
    whyItWorks: '매운 닭발로 간단한 야식 한 접시를 즐길 수 있어요.',
    assemblyGuide: ['닭발을 데워 드세요.'],
  },
  combo_0025: {
    comboKind: 'hack_combo',
    title: '참치 김 라면',
    transformationName: '참치 라면',
    description: '라면에 참치와 김을 넣어 국물 풍미를 더해요.',
    whyItWorks: '참치의 짭조름함과 김의 고소함이 스프를 한층 깊게 만들어요.',
    assemblyGuide: [
      '라면을 조리하고 물을 적당히 남겨요. 뜨거운 용기에 주의해요.',
      '참치를 넣고 잠깐 저어요.',
      '김을 곁들여 따뜻할 때 드세요.',
    ],
  },
  combo_0026: {
    comboKind: 'easy_set',
    title: '삼각김밥 우유 세트',
    whyItWorks: '삼각김밥과 우유로 가성비 좋은 간단 한 끼가 돼요.',
    assemblyGuide: ['삼각김밥을 꺼내요.', '우유와 바나나를 곁들여 드세요.'],
  },
  combo_0027: {
    comboKind: 'hack_combo',
    title: '반숙란 컵밥 덮밥',
    transformationName: '반숙란 덮밥',
    description: '데운 컵밥에 반숙란을 올려 덮밥처럼 만들어요.',
    items: [{ name: '컵밥' }, { name: '반숙란' }, { name: '김치' }],
    whyItWorks: '노른자가 밥에 스며들며 부드럽고 고소한 덮밥 식감이 돼요.',
    assemblyGuide: [
      '컵밥을 데울 때 밀봉을 뜯고 전용 용기를 사용해요.',
      '반숙란을 올리고 노른자를 살짝 풀어요.',
      '김치와 함께 비벼 드세요.',
    ],
  },
  combo_0028: {
    comboKind: 'hack_combo',
    title: '닭가슴살 컵누들',
    transformationName: '단백질 컵누들',
    description: '컵누들에 데운 닭가슴살과 반숙란을 넣어 단백질을 보태요.',
    items: [{ name: '컵누들' }, { name: '닭가슴살' }, { name: '반숙란' }],
    whyItWorks: '가벼운 면에 단백질이 보태져 포만감과 균형이 함께 잡혀요.',
    assemblyGuide: [
      '컵누들을 조리해요. 뜨거운 용기에 주의해요.',
      '데운 닭가슴살을 잘게 잘아 넣어요.',
      '반숙란을 올리고 노른자를 살짝 풀어 드세요.',
    ],
  },
  combo_0029: {
    comboKind: 'easy_set',
    title: '출근길 도시락',
    whyItWorks: '데운 도시락만으로 바쁜 출근길에 빠르게 한 끼를 해결할 수 있어요.',
    assemblyGuide: ['도시락을 데워 드세요.'],
  },
  combo_0030: {
    comboKind: 'easy_set',
    title: '점심 샌드위치',
    whyItWorks: '샌드위치만으로 점심시간에 빠르게 한 끼를 채울 수 있어요.',
    assemblyGuide: ['샌드위치를 꺼내 드세요.'],
  },
  combo_0031: {
    comboKind: 'hack_combo',
    title: '버터 김가루 컵밥',
    transformationName: '고소한 버터 컵밥',
    description: '데운 컵밥에 버터와 김가루를 넣어 고소하게 비벼요.',
    items: [{ name: '컵밥' }, { name: '버터' }, { name: '김가루' }],
    whyItWorks: '버터의 고소함과 김가루 향이 밥에 스며 간단하지만 확실한 풍미가 돼요.',
    assemblyGuide: [
      '컵밥을 데울 때 밀봉을 뜯고 전용 용기를 사용해요.',
      '작은 버터를 넣고 비벼요.',
      '김가루를 뿌려 한 번 더 비벼 드세요.',
    ],
  },
  combo_0032: {
    comboKind: 'easy_set',
    title: '김밥 라면 세트',
    description: '라면과 김밥을 함께 먹는 든든한 조합이에요.',
    whyItWorks: '따뜻한 라면과 김밥을 번갈아 먹으면 포만감이 빠르게 채워져요.',
    assemblyGuide: ['라면을 끓여요.', '김밥과 함께 드세요.'],
  },
  combo_0033: {
    comboKind: 'easy_set',
    title: '가벼운 샐러드',
    whyItWorks: '샐러드만으로 가볍게 한 끼를 채울 수 있어요.',
    assemblyGuide: ['샐러드를 드세요.'],
  },
  combo_0034: {
    comboKind: 'easy_set',
    title: '과일 한 접시',
    whyItWorks: '과일로 가볍고 상큼한 한 접시를 즐길 수 있어요.',
    assemblyGuide: ['과일을 꺼내 드세요.'],
  },
  combo_0035: {
    comboKind: 'easy_set',
    title: '두부 샐러드',
    whyItWorks: '두부 샐러드로 가볍게 단백질을 채울 수 있어요.',
    assemblyGuide: ['두부 샐러드를 드세요.'],
  },
  combo_0036: {
    comboKind: 'easy_set',
    title: '채소주스 한 잔',
    whyItWorks: '채소주스로 가볍게 속을 채울 수 있어요.',
    assemblyGuide: ['채소주스를 드세요.'],
  },
  combo_0037: {
    comboKind: 'easy_set',
    title: '곤약 가벼운 한 끼',
    whyItWorks: '곤약으로 부담 없이 한 끼를 채울 수 있어요.',
    assemblyGuide: ['곤약을 드세요.'],
  },
  combo_0038: {
    comboKind: 'hack_combo',
    title: '요거트 과일 파르페',
    transformationName: '요거트 파르페',
    description: '요거트에 견과와 과일을 섞어 달콤한 한 접시를 만들어요.',
    items: [{ name: '요구르트' }, { name: '견과' }, { name: '과일' }],
    whyItWorks: '요거트의 부드러함에 견과 고소함과 과일 상큼함이 겹쳐요.',
    assemblyGuide: [
      '요구르트를 컵이나 그릇에 옮겨요.',
      '견과와 과일을 넣어요.',
      '가볍게 섞어서 드세요.',
    ],
  },
  combo_0039: {
    comboKind: 'hack_combo',
    title: '닭가슴살 샐러드 비빔',
    transformationName: '닭가슴살 샐러드',
    description: '데운 닭가슴살과 샐러드를 소스에 비벼 한 그릇으로 만들어요.',
    items: [{ name: '닭가슴살' }, { name: '샐러드' }, { name: '샐러드 소스' }],
    whyItWorks: '닭가슴살의 단백질과 소스가 채소와 섞이며 든든한 샐러드가 돼요.',
    assemblyGuide: [
      '닭가슴살을 데울 때 밀봉을 뜯고 전용 용기를 사용해요.',
      '샐러드와 함께 그릇에 넣어요.',
      '소스를 넣고 가볍게 비벼 드세요.',
    ],
  },
  combo_0040: {
    comboKind: 'easy_set',
    title: '삶은계란 김 세트',
    description: '삶은 계란과 김으로 간단한 단백질 한 끼예요.',
    items: [{ name: '삶은계란' }, { name: '김' }],
    whyItWorks: '삶은 계란의 고소함과 김 향이 가볍게 단백질을 채워줘요.',
    assemblyGuide: ['삶은 계란을 꺼내요.', '김과 함께 드세요.'],
  },
  combo_0041: {
    comboKind: 'hack_combo',
    title: '참치 비빔밥',
    transformationName: '참치 덮밥',
    description: '밥에 참치를 넣고 비벼 간단한 덮밥을 만들어요.',
    items: [{ name: '참치' }, { name: '밥' }],
    whyItWorks: '참치의 짭조름함이 밥에 스며들며 간단하지만 확실한 포만감이 돼요.',
    assemblyGuide: [
      '밥을 그릇이나 용기에 옮겨요.',
      '참치를 넣고 골고루 비벼요.',
      '기호에 따라 김을 곁들여 드세요.',
    ],
  },
  combo_0042: {
    comboKind: 'easy_set',
    title: '두부 단백질',
    whyItWorks: '두부로 가볍게 단백질을 채울 수 있어요.',
    assemblyGuide: ['두부를 드세요.'],
  },
  combo_0043: {
    comboKind: 'easy_set',
    title: '치킨 단백질',
    whyItWorks: '치킨으로 간단하게 단백질 한 끼를 채울 수 있어요.',
    assemblyGuide: ['치킨을 데워 드세요.'],
  },
  combo_0044: {
    comboKind: 'hack_combo',
    imageKey: 'ice_cream_coffee_combo',
    title: '아이스크림 커피',
    transformationName: '아포가토 스타일',
    description: '바닐라 아이스크림에 커피를 부어 디저트를 만들어요.',
    items: [{ name: '바닐라 아이스크림' }, { name: '커피 음료' }],
    whyItWorks: '차가운 아이스크림과 쌉싸름한 커피가 겹치며 달콤 쌉싸름한 풍미가 돼요.',
    assemblyGuide: [
      '아이스크림을 컵에 옮겨요.',
      '차가운 커피 음료를 천천히 부어요.',
      '반쯤 녹은 상태로 드세요.',
    ],
  },
  combo_0045: {
    comboKind: 'easy_set',
    title: '디저트 빵',
    whyItWorks: '빵으로 간단한 디저트 한 접시를 즐길 수 있어요.',
    assemblyGuide: ['빵을 드세요.'],
  },
  combo_0046: {
    comboKind: 'hack_combo',
    title: '케이크 아이스크림 파르페',
    transformationName: '케이크 파르페',
    description: '케이크와 아이스크림을 겹쳐 파르페처럼 만들어요.',
    items: [{ name: '케이크' }, { name: '아이스크림' }],
    whyItWorks: '케이크의 달콤함과 아이스크림의 부드러함이 겹겹이 쌓여 풍미가 깊어져요.',
    assemblyGuide: [
      '케이크를 잘게 잘아요.',
      '아이스크림을 그 위에 올려요.',
      '겹겹이 쌓아서 드세요.',
    ],
  },
  combo_0047: {
    comboKind: 'hack_combo',
    title: '호떡 아이스크림',
    transformationName: '따뜻한 호떡 디저트',
    description: '따뜻한 호떡에 아이스크림을 올려 온도 대비 디저트를 만들어요.',
    items: [{ name: '호떡' }, { name: '아이스크림' }],
    whyItWorks: '뜨거운 호떡과 차가운 아이스크림이 만나 온도 대비가 재미있어요.',
    assemblyGuide: [
      '호떡을 데울 때 밀봉을 뜯고 전용 용기를 사용해요.',
      '호떡 위에 아이스크림을 올려요.',
      '녹기 전에 같이 드세요.',
    ],
  },
  combo_0048: {
    comboKind: 'easy_set',
    title: '해장 콩나물국',
    whyItWorks: '따뜻한 콩나물국으로 해장 한 그릇을 즐길 수 있어요.',
    assemblyGuide: ['콩나물국을 데워 드세요.'],
  },
  combo_0049: {
    comboKind: 'easy_set',
    title: '해장 북어국',
    whyItWorks: '따뜻한 북어국으로 속을 편하게 할 수 있어요.',
    assemblyGuide: ['북어국을 데워 드세요.'],
  },
  combo_0050: {
    comboKind: 'hack_combo',
    title: '콩나물국 반숙란 해장',
    transformationName: '계란 해장국밥',
    description: '따뜻한 콩나물국에 반숙란과 밥을 넣어 해장 한 그릇을 만들어요.',
    items: [{ name: '콩나물국' }, { name: '반숙란' }, { name: '밥' }],
    whyItWorks: '따뜻한 국물에 노른자가 스며들며 속이 편해지고 포만감이 생겨요.',
    assemblyGuide: [
      '콩나물국을 데울 때 밀봉을 뜯고 전용 용기를 사용해요.',
      '반숙란을 넣고 노른자를 풀어요.',
      '밥을 넣고 가볍게 비벼 드세요.',
    ],
  },
};

function normalizeAvailabilityNote(note: string): string {
  const trimmed = note.trim();
  if (!trimmed || trimmed === convenienceCombosCopy.priceDisclaimer) return '';
  return trimmed;
}

export function enrichConvenienceCombo(draft: ConvenienceComboDraft): ConvenienceCombo {
  const patch = PATCHES[draft.id];
  if (!patch) {
    throw new Error(`Missing convenience combo enrichment: ${draft.id}`);
  }
  const merged = { ...draft, ...patch };
  return {
    ...merged,
    availabilityNote: normalizeAvailabilityNote(merged.availabilityNote),
  };
}

export function enrichConvenienceCombos(drafts: ConvenienceComboDraft[]): ConvenienceCombo[] {
  return drafts.map(enrichConvenienceCombo);
}
