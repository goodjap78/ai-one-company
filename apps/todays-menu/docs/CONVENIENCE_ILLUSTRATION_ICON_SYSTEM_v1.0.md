# HANKKI Convenience Illustration Icon System v1.0

| Field | Value |
| --- | --- |
| **Sprint** | 56 / 56-A.3 |
| **Status** | Design spec + **cup_ramen · cup_rice masters locked** (v1.0) — no production wiring |
| **Style lock** | `docs/CONVENIENCE_ILLUSTRATION_ICON_STYLE_LOCK_v1.0.md` |
| **Scope** | 편의점 구성품 일러스트 아이콘 (Phase 1: 10 items) |
| **Aligned with** | HANKKI Ingredient Icon Style v1.0 |
| **App path** | `apps/todays-menu` |

---

## 1. Purpose

편의점 조합(HACK_COMBO / EASY_SET) 구성품을 **실사·3D 렌더·사진 기반**에서 벗어나, 재료 아이콘과 같은 디자인 언어의 **소프트 일러스트 아이콘**으로 표시한다.

이 문서는 **설계·사양 정의**만 포함한다. SVG/PNG 생성, review, production 반영은 후속 Sprint에서 수행한다.

---

## 2. Current Ingredient Icon System (Reference Analysis)

### 2.1 Production & management

| Aspect | Current HANKKI practice |
| --- | --- |
| **제작 방식** | Ingredient Image Factory — AI 이미지 생성 파이프라인 (`scripts/ingredient-factory/`) |
| **Style lock** | `HANKKI_INGREDIENT_ICON_STYLE_VERSION = v1.0` (`buildPrompts.ts`) |
| **Master size** | 1024×1024 PNG, square 1:1 |
| **Production path** | `assets/ingredients/{iconKey}.png` |
| **Registry** | Static `require()` in `services/images/ingredientImageAssets.ts` |
| **Resolution** | `resolveIngredientIcon` → explicit `iconKey` → alias → category fallback |
| **Display (recipe UI)** | 40×40 px in `RecipeIngredientsList` (`ICON_SIZE = 40`) |

### 2.2 Visual language (v1.0 locked prompts)

공식 스타일 문구: **clean premium 3D illustration icon**

| Property | Ingredient icons |
| --- | --- |
| **선 두께** | 명시적 outline stroke 없음 — 형태는 면·그라데이션·부드러운 명암으로 정의 |
| **모서리** | 전체적으로 **rounded / soft** — 둥근 실루엣, 날카른 각 최소화 |
| **색상 개수** | 단일 재료당 **2~4색 블록** + 하이라이트/그라데이션 (과도한 디테일 없음) |
| **그림자** | **있음** — 객체 하단 soft contact shadow (스튜디오 조명) |
| **Outline** | **없음** (stroke 기반 라인 아이콘 아님) |
| **Flat / semi-flat** | **Semi-flat 3D** — 볼륨감 있는 일러스트, 실사 사진은 아님 |
| **카메라** | 약간 올려진 3/4 각도, 중앙 배치, 넉넉한 패딩 |
| **배경** | Warm cream (`#FFF8EF` 계열) 또는 투명 |
| **금지** | 텍스트, 로고, 워터마크, 손, 접시, 포토 리얼, 광택 과다 |

### 2.3 Why small sizes work (40–48 px)

1. **단일 피사체** — 한 아이콘 = 한 재료, 복잡한 장면 없음  
2. **강한 실루엣** — 계란·양파 등 형태가 즉시 인식 가능  
3. **대비 큰 색 블록** — 피부/단면/잎 등 2~3색으로 구분  
4. **중앙 정렬 + 여백** — 1024 마스터에서 ~15% safe margin → 축소 시 잘리지 않음  
5. **디테일 억제** — 바코드·포장 문구·미세 텍스처 없음  
6. **일관 조명** — 모든 아이콘이 같은 각도·광원 → 그리드에서 시각적 안정  

### 2.4 Convenience icons vs ingredient icons

| Dimension | Ingredient | Convenience (v1.0) |
| --- | --- | --- |
| **복잡도** | 단일 재료 | 포장·용기 포함 (단순화 필수) |
| **3D 강도** | Premium semi-3D | **더 단순** — flat 일러스트 + 약한 입체감 |
| **목표** | 레시피 재료 식별 | 조합 카드에서 구성품 빠른 식별 |
| **Hero 대비** | — | Hero JPG보다 **훨씬 단순** |
| **Master canvas** | 1024 px | **64 px 설계 기준** (다중 스케일 검증) |

---

## 3. Design Principles

### 3.1 Style (mandatory)

- **Soft Illustration**
- **Rounded**
- **Friendly**
- **Flat** (면 기반) + **약한 입체감** 허용
- **귀여운** 느낌 — 유치하지 않게
- **Hero 이미지보다 단순**
- **작은 크기 식별 우선** — 디테일 < 실루엣

### 3.2 Forbidden (mandatory)

| Category | Examples |
| --- | --- |
| 실사 / 사진 | 포장 실사, 매장 사진 크롭 |
| 브랜드 | CU, GS25, 세븐일레븐, 이마트24, 제품 실제 브랜드 |
| 로고 | 체인 로고, 브랜드 마크 |
| 글씨 | 한글/영문 상품명, 가격, 용량 숫자 |
| 바코드 | 스캔 코드 패턴 |
| 가격표 / 라벨 | 할인 스티커, 영양 성분표 |
| 포장 문구 | "매운맛", "BIG", 영문 슬로건 |
| AI 3D Render 느낌 | 과한 광택, HDR, 사진형 반사, hyper-real |

### 3.3 Composition rules

- 단일 구성품만 (세트 사진 금지)
- 중앙 배치, **safe area 12%** (64 px 기준 ≈ 8 px margin)
- 배경 **투명** (권장) 또는 `ds.colors.convenienceComponentIconBg` (`#FFFCF7`)
- 그림자: **아주 약한** contact shadow만 (48 px에서 거의 보이지 않게)
- outline stroke 사용 금지 — 색 면으로 형태 정의

---

## 4. Color System

### 4.1 Shared HANKKI palette (from `designSystem.ts`)

| Token | Hex | Use |
| --- | --- | --- |
| `canvas` | `#FFF8EF` | App warm background |
| `card` / `convenienceComponentIconBg` | `#FFFCF7` | Icon chip background |
| `primary` | `#FF6B35` | Accent ( sparing — not per-icon fill) |
| `textPrimary` | `#1E1E1E` | UI text only — **not in icons** |
| `chipPastel` | `#FFF3E8`, `#FFF8EE`, `#F3F8F1`, … | Optional secondary tints |

아이콘 내부 색은 **앱 토큰과 조화**되도록 따뜻한 파스텔·크림·연한 갈색 계열을 기본으로 한다.

### 4.2 Product-group accent colors (Phase 1)

| iconKey | 대표 색 | Hex (guide) | Notes |
| --- | --- | --- | --- |
| `cup_ramen` | 주황 | `#FF8C42` | 띠·라벨 영역 |
| `cup_rice` | 노랑 | `#F5C542` | 띠·라벨 영역 |
| `salad` | 초록 | `#6BBF59` | 채소 포인트 |
| `milk` | 파랑 | `#6BA3E8` | 포인트 (우유 팩/뚜껑) |
| `triangle_kimbap` | 검정 | `#2A2A2A` | 김 포장 |
| `hot_bar` | 주황 | `#FF9A3C` | 소시지 본체 |
| `lunchbox` | 검정 | `#2D2D2D` | 도시락 용기 |
| `sandwich` | 베이지 | `#E8D4B8` | 빵·치즈 톤 |
| `hamburger` | 갈색+노랑 | `#C47A45` / `#F5C542` | 번 + 치즈 |
| `cup_udon` | 갈색 | `#8B5E3C` | 국물 톤 |

**규칙:** 대표 색은 **1~2 면**에만 사용. 전체 아이콘을 한 색으로 채우지 않음.

### 4.3 Neutral shared tones

| Role | Hex (guide) |
| --- | --- |
| White / cream body | `#FFFFFF`, `#FFF8F0` |
| Warm gray shadow | `#E8E0D8` at 20–30% opacity |
| Dark accent (김, 도시락) | `#2A2A2A` — 면적 40% 이하 |

---

## 5. Size & Scale Rules

### 5.1 Master design canvas

| Property | Value |
| --- | --- |
| **Design grid** | 64×64 px |
| **Safe area** | 56×56 px inner (8 px margin) |
| **Export targets (future)** | 64, 128, 256 PNG @1x/2x/4x from vector |

### 5.2 Required validation sizes

모든 Phase 1 아이콘은 다음 크기에서 **형태·색 블록·대표색**이 식별 가능해야 한다.

| Display size | Context |
| --- | --- |
| **48 px** | Minimum mobile chip (`ds.sizes.touchTarget`) |
| **64 px** | Default combo item card icon |
| **96 px** | Strip / enlarged card |
| **128 px** | Detail hero adjunct, QA review |

**Fail criteria at 48 px:** 브랜드 유추 가능, 텍스트 읽힘 시도, 두 구성품 혼동, 색만으로는 구분 불가.

---

## 6. System Structure (planned)

미러링: `assets/ingredients/` + `ingredientImageAssets.ts`

```
assets/convenience-illustration-icons/     # future production (NOT in Sprint 56)
├── cup_ramen.png
├── cup_rice.png
├── triangle_kimbap.png
├── lunchbox.png          # catalog key: lunch_box
├── sandwich.png
├── salad.png             # catalog key: salad_pack
├── hamburger.png
├── hot_bar.png
├── milk.png              # catalog key: milk_carton
└── cup_udon.png

services/images/
├── convenienceIllustrationIconAssets.ts  # static require registry (future)
└── resolveConvenienceIllustrationIcon.ts # key → ImageSource (future)

types/convenienceIllustrationIcon.ts      # ConvenienceIllustrationIconKey union (future)
```

### 6.1 Key naming

| Illustration key | `CONVENIENCE_COMPONENT_CATALOG` key | Display label |
| --- | --- | --- |
| `cup_ramen` | `cup_ramen` | 컵라면 |
| `cup_rice` | `cup_rice` | 컵밥 |
| `triangle_kimbap` | `triangle_kimbap` | 삼각김밥 |
| `lunchbox` | `lunch_box` | 도시락 |
| `sandwich` | `sandwich` | 샌드위치 |
| `salad` | `salad_pack` | 샐러드 |
| `hamburger` | `hamburger` | 햄버거 |
| `hot_bar` | `hot_bar` | 핫바 |
| `milk` | `milk_carton` | 우유 |
| `cup_udon` | `cup_udon` | 컵우동 |

**규칙:** 파일·registry 키는 **illustration namespace** (`lunchbox`, `salad`, `milk`). 카탈로그 키와 1:1 매핑 테이블로 연결. 기존 `reuseIngredientKey`는 **메타데이터만** — 일러스트는 편의점 전용 자산.

---

## 7. Phase 1 Icon Specifications (10)

각 항목: **실루엣 우선**, **금지 요소 없음**, **대표색 1블록**.

### 7.1 `cup_ramen` — 컵라면

- **Shape:** 둥근 컵, 상단 약간 좁음
- **Colors:** 흰 컵 `#FFF8F0`, **주황 띠** `#FF8C42` (중간 1줄)
- **Detail:** 컵 위로 **면 2~3가닥**만 살짝 (노란 `#F5D76E`)
- **Avoid:** 브랜드명, "매운맛" 문구, 실제 라면 포장 스캔

### 7.2 `cup_rice` — 컵밥

- **Shape:** 짧은 원통 컵
- **Colors:** **검정 용기** `#2D2D2D`, **노란 띠** `#F5C542`
- **Detail:** 뚜껑 윗면 흰색 또는 크림 — 밥 톤 암시만
- **Avoid:** 즉석밥 브랜드 색 정확 복제

### 7.3 `triangle_kimbap` — 삼각김밥

- **Shape:** **삼각형** 실루엣 (김밥 포장 각)
- **Colors:** **검정 김** `#2A2A2A`, **크림 밥** `#FFF5E6` (하단 1/3 노출)
- **Detail:** 김 결이 과하지 않게 2~3줄만
- **Avoid:** 참치마요 등 맛 이름, 띠 라벨

### 7.4 `lunchbox` — 도시락

- **Shape:** 직사각 **도시락** + 뚜껑
- **Colors:** **검정 본체** `#2D2D2D`
- **Detail:** 뚜껑 열린 상태, **2~3칸** 분리선 (얇은 회색 `#6B6B6B`)
- **Avoid:** 실제 도시락 메뉴 사진, 반찬 디테일 과다

### 7.5 `sandwich` — 샌드위치

- **Shape:** **삼각형** 컷 (대각선 한 조각)
- **Colors:** **베이지 빵** `#E8D4B8`, 내부 **연한 초록** `#A8D5A2` (채소 힌트)
- **Detail:** 2층 빵 + 중간 채소 — 층 3개 이하
- **Avoid:** 브랜드 샌드위치 래퍼

### 7.6 `salad` — 샐러드

- **Shape:** 둥근 **투명 용기** (면으로 표현 — 흰 테두리 + 내부 채소)
- **Colors:** 용기 연한 회색 `#E8E8E8`, **초록 포인트** `#6BBF59` 2~3덩어리
- **Detail:** 토마토 빨강 1점 허용 (`#E85A4F`) — 최대 1색 추가
- **Avoid:** 영양 라벨, 포크, 드레싱 병

### 7.7 `hamburger` — 햄버거

- **Shape:** 둥근 번 + 패티 스택
- **Colors:** **갈색 번** `#C47A45`, **노란 치즈** `#F5C542` (한 면 노출)
- **Detail:** 패티 1장 (`#6B4423`), 층 4 이하
- **Avoid:** 체인 로고, 감자튀김 세트

### 7.8 `hot_bar` — 핫바

- **Shape:** 긴 **소시지형** 막대 (끝 둥글)
- **Colors:** **주황** `#FF9A3C` 본체, 밝은 하이라이트 1면
- **Detail:** 결이나 반점 최소 — 실루엣만으로 인식
- **Avoid:** 핫도그와 혼동되는 빵 포함

### 7.9 `milk` — 우유

- **Shape:** 작은 **우유팩** 또는 병 (직사각 + 삼각 뚜껑)
- **Colors:** 흰/크림 본체 `#FFF8F0`, **파랑 포인트** `#6BA3E8` (뚜껑 또는 띠)
- **Detail:** "우유" 글자 없이 파란 면으로만 표현
- **Avoid:** 실제 우유 브랜드 패키지 복제

### 7.10 `cup_udon` — 컵우동

- **Shape:** 컵라면과 동일 계열 컵 — **더 넓은 입**
- **Colors:** 흰 컵 `#FFF8F0`, **갈색 국물** `#8B5E3C` (상단 1/3)
- **Detail:** 면 1~2가닥만 (`#F0E0C8`) — 라면과 구분은 국물색+면 양
- **Avoid:** 컵라면과 동일 주황 띠 사용

---

## 8. Production Rules (future Sprint)

Sprint 56에서는 실행하지 않음. 후속 제작 시 준수.

1. **Vector-first** — SVG 마스터 → PNG export (64/128/256)
2. **No AI generation** for v1.0 convenience set unless explicitly approved in a later sprint
3. **Review queue** — mirror `generated/ingredient-factory/review/` pattern
4. **Approve →** `assets/convenience-illustration-icons/{key}.png` only
5. **Registry** — static `require()` only; no dynamic paths
6. **One key = one file** — aliases resolve in catalog, not duplicate PNGs
7. **QA script** — `test-convenience-illustration-icons.ts` (keys, sizes, forbidden pixel patterns)

---

## 9. Expansion Rules (future)

### 9.1 Adding new icons

1. Add entry to `CONVENIENCE_COMPONENT_CATALOG` (if new product type)
2. Add illustration key to `ConvenienceIllustrationIconKey` union
3. Define spec block in this doc (§7 template)
4. Assign product-group accent from §4.2 or new row
5. Pass 48/64/96/128 px review checklist
6. Register in `convenienceIllustrationIconAssets.ts`

### 9.2 Priority tiers (suggested)

| Tier | Examples | Rationale |
| --- | --- | --- |
| A | 컵라면, 컵밥, 삼각김밥, 우유 | 최고 빈도 조합 |
| B | 도시락, 샌드위치, 샐러드, 햄버거 | EASY_SET 다수 |
| C | 핫바, 컵우동, 컵누들, 김밥 | 조합 보조 |
| D | 반숙란, 치즈, 음료, 과일 | alias·reuse 검토 |

### 9.3 Do not expand into

- Store-specific seasonal packaging
- Limited edition collab products
- Items requiring readable text to identify

---

## 10. Recommended Production Order

1. **컵라면** — 가장 빈번, 라면/컵류 기준 실루엣 확립  
2. **컵밥** — 컵 형태 변형 (검정+노랑)  
3. **삼각김밥** — 삼각 실루엣 템플릿  
4. **우유** — 음료/유제품 파란 포인트 규칙  
5. **샐러드** — 투명 용기 + 초록 포인트  
6. **도시락** — 다칸 분리 구조  
7. **샌드위치** — 삼각 컷 빵  
8. **햄버거** — 층叠 스택  
9. **핫바** — 단순 막대형  
10. **컵우동** — 컵라면과 차별 (갈색 국물)

---

## 11. Sprint 56 Checklist

| Item | Sprint 56 |
| --- | --- |
| Design system doc | ✅ This file |
| AI image generation | ❌ |
| SVG / PNG assets | ❌ |
| Production registry | ❌ |
| Review HTML | ❌ |
| UI wiring | ❌ |
| Git commit | ❌ (by policy) |

---

## 12. References

- **Style lock (v1.0):** `docs/CONVENIENCE_ILLUSTRATION_ICON_STYLE_LOCK_v1.0.md`
- Ingredient style lock: `scripts/ingredient-factory/buildPrompts.ts`
- Ingredient registry: `services/images/ingredientImageAssets.ts`
- Component catalog: `data/content/combos/convenienceComponentCatalog.ts`
- UI tokens: `constants/designSystem.ts`
- Combo item cards (text-only today): `components/convenience/ConvenienceComboItemCards.tsx`
