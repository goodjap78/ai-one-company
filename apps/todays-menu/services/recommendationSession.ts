import type { HomeRecommendationDTO, MealMode, MealType } from '../types/home';

export type RecommendationSession = {
  dateKey: string;
  mealType: MealType;
  mealMode: MealMode;
  recommendation: HomeRecommendationDTO;
};

/** Max session heroes retained (4 slots × 2 rotations). */
export const MAX_SESSION_HERO_IDS = 12;

let activeSession: RecommendationSession | null = null;
let sessionHeroIds: string[] = [];

export function setRecommendationSession(session: RecommendationSession): void {
  activeSession = session;
}

export function getRecommendationSession(): RecommendationSession | null {
  return activeSession;
}

export function clearRecommendationSession(): void {
  activeSession = null;
  resetSessionHeroIds();
}

/** Sprint 61-B — cross-slot heroes shown this app session (in-memory only). */
export function getSessionHeroIds(): string[] {
  return [...sessionHeroIds];
}

export function addSessionHeroId(recipeId: string): void {
  const id = recipeId.trim();
  if (!id) return;
  if (sessionHeroIds.includes(id)) return;
  sessionHeroIds.push(id);
  if (sessionHeroIds.length > MAX_SESSION_HERO_IDS) {
    sessionHeroIds = sessionHeroIds.slice(-MAX_SESSION_HERO_IDS);
  }
}

export function resetSessionHeroIds(): void {
  sessionHeroIds = [];
}
