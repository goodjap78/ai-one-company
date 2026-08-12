# SPRINT 65-A LEGAL UPDATE REPORT

**Date:** 2026-08-12  
**Verdict:** LEGAL_REVIEW_REQUIRED  
(문서 수정·배포는 완료. Google Play Data Safety / WebView 제3자 처리 / 배너 추가 고지 필요 여부는 CHECK_REQUIRED)

## 1. 기존 이용약관 위치
- Source of truth: `apps/todays-menu/legal/terms.html`
- Hosting: Vercel project `hankki-legal`

## 2. 기존 개인정보처리방침 위치
- Source of truth: `apps/todays-menu/legal/privacy.html`
- Hosting: Vercel project `hankki-legal`

## 3. 실제 사용자 노출 URL
- Terms: https://hankki-legal.vercel.app/hankki/terms
- Privacy: https://hankki-legal.vercel.app/hankki/privacy
- App: My → `MyLegalSection` → `LEGAL_URLS` (변경 없음, 최신 문서 가리킴)
- Deploy (2026-08-12): aliased to `https://hankki-legal.vercel.app` (READY)

## 4. 기존 광고/제휴 조항 존재 여부
- **이용약관(구버전):** 광고·제휴·외부 거래 조항 **없음**
- **개인정보처리방침(구버전):** 장보기/쿠팡/WebView **미기재**
- **앱 고지:** `COUPANG_PARTNERS_OFFICIAL_DISCLOSURE` 존재, ShoppingScreen 표시

## 5. 이용약관 변경사항
- 시행일/최종수정일 → **2026-08-12**
- 제공 기능: 냉장고 털기, 장보기, 제휴 배너 반영; “냉장고 관리=준비 중” 문구 정리
- **§7 광고 및 제휴 서비스** 신설 (수수료 가능 — 공식 고지와 정합)
- **§8 외부 서비스 및 거래 당사자** 신설 (직접 판매자 아님; 과도 면책 배제 문장 포함)
- **§9 상품 정보** 신설 (가격 등 변동·최종 화면 확인)
- §10–14로 기존 조항 번호 조정 + 외부 거래 관련 책임 제한 보강

## 6. 개인정보처리방침 변경사항
- 시행일/최종수정일 → **2026-08-12**
- 장보기: keyword/limit → Shopping Proxy (닉네임·광고ID 미포함) 명시
- Proxy → Coupang Partners API, credential은 서버만
- IP rate limit은 **한끼 중계 서버** 운영 목적
- §5: 쿠팡에 닉네임/계정/광고ID 전달 구현 **미확인** → “제3자 제공”으로 **잘못 기재하지 않음**
- §6: Proxy / Partners 상품 / Dynamic Banner WebView / 외부 이동 후 처리 가능성 + **코드만으로 확인 불가** 명시
- AdMob 등 별도 SDK 없음 유지 + 제휴 콘텐츠는 별도 설명

## 7. Coupang affiliate disclosure 상태
- 공식 문구 **변경 없음**:
  `이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.`
- 표시: ShoppingScreen 상단(헤더 아래)
- Fridge/Home/Ingredients 배너 영역에는 동일 문구 **미표시** (기존 설계)

## 8. Dynamic Banner 관련 처리
- Privacy §6에 WebView 배너·외부 이동 설명 추가
- Terms §7에 홈·레시피 하단 배너 언급
- **추가 전용 고지 문구 신규 생성하지 않음** → Home/Ingredients 배너만 볼 때 공식 고지 노출 여부는 CHECK_REQUIRED

## 9. 외부 거래 책임 구분
- Terms §8: 판매/주문/결제/배송/교환·반품·환불/품질은 외부 플랫폼·판매자 ↔ 이용자
- 법령상 회사 책임까지 배제하지 않는다는 문장 포함

## 10. 개인정보 제3자 제공 여부 (코드 기준)
- 닉네임/추천설정/즐겨찾기/식사기록 → 쿠팡 전달 **없음**
- Proxy→Coupang: `keyword`, `limit`, (optional server `subId`)
- 사용자 IP → Upstash rate limit (한끼 서버); Coupang API에 사용자 IP를 별도 파라미터로 넣는 코드 **없음**
- → “개인정보를 Coupang에 제공한다”로 작성하지 않음

## 11. WebView / third-party data CHECK 결과
| Item | Result |
|------|--------|
| Widget host load | Confirmed: `ads-partners.coupang.com` |
| Cookie / GAID / device ID in WebView | **CHECK_REQUIRED** (앱 코드만으로 확정 불가) |
| Outbound product click | External Linking; subsequent Coupang processing **CHECK_REQUIRED** |

## 12. Google Play Data Safety 변경 필요 여부
- **CHECK_REQUIRED** (Play Console 현재 신고값 미확인)
- 검토 후보: third-party advertising/content, WebView, affiliate outbound, IP on proxy for rate limit
- 임의 YES/NO 하지 않음

## 13. 수정한 파일
- `legal/terms.html`
- `legal/privacy.html`
- `scripts/test-legal-coupang-compliance.ts` (new)
- `package.json` (`test:legal-coupang-compliance`)
- `docs/SPRINT_65-A_LEGAL_UPDATE_REPORT.md` (this file)
- Disclosure / shopping / recommendation code **미변경**

## 14. 테스트 결과
- `npx tsx scripts/test-legal-coupang-compliance.ts` — PASS
- `npm run smoke:rc` — PASS (legal URLs HTTP 200)

## 15. CHECK_REQUIRED 항목
1. Dynamic Banner만 노출되는 Home/Ingredients에 **추가 고지**가 법적으로 필요한지
2. Coupang WebView/외부 페이지의 cookie·식별자 처리 범위
3. Google Play Data Safety / Privacy Policy 필드 재신고 필요 여부
4. Proxy IP·keyword 단기 캐시의 개인정보 해당 여부(법무 해석)
5. 공식 고지 문구를 배너 화면에 재사용할지(임의 신규 문구 생성 금지 유지)

## 16. 법률상 추가 확인이 필요한 부분
- 표시광고법·전자상거래법상 제휴 고지 위치/형식
- 쿠팡 파트너스 약관/가이드의 배너·고지 의무
- Play Console Data safety 설문 업데이트
- 필요 시 변호사/컴플라이언스 리뷰
