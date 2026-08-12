/**
 * Sprint 57 — injectable RNG for recommendation refresh paths (tests use deterministic).
 */
export type RandomSource = () => number;

let randomSource: RandomSource = Math.random;

export function getRecommendationRandom(): number {
  return randomSource();
}

export function setRecommendationRandomForTests(source: RandomSource | null): void {
  randomSource = source ?? Math.random;
}
