import type { HeroFocalPoint } from '../../constants/homeHeroDisplay';

/**
 * Per-recipe home hero focal overrides (exceptions only).
 * Audit: `npx tsx scripts/audit-home-hero-images.ts` (2026-07-30).
 * Default focal (y=0.46) applies when absent.
 */
export const HOME_HERO_FOCAL_OVERRIDES: Readonly<Record<string, HeroFocalPoint>> = {
  '006': { x: 0.5, y: 0.39 }, // 불고기 — centroid low
  '020': { x: 0.5, y: 0.39 }, // 소불고기덮밥
  '022': { x: 0.5, y: 0.38 }, // 삼겹살구이
  '028': { x: 0.5, y: 0.4 }, // 오므라이스
  '036': { x: 0.5, y: 0.42 }, // 잔치국수 — lowest overlap risk
  '046': { x: 0.5, y: 0.39 }, // 순대볶음
  '058': { x: 0.5, y: 0.42 }, // 시저샐러드
  '069': { x: 0.5, y: 0.41 }, // 연어포케
  '078': { x: 0.5, y: 0.39 }, // 토마토파스타
  '084': { x: 0.5, y: 0.41 }, // 그릭요거트볼
  '098': { x: 0.5, y: 0.41 }, // 팟타이우동
};
