import { getHankkiTodayBriefingMessages } from '../../constants/HankkiMessages';
import type { DailyChallenge, DailyChallengeId } from '../../types/today';

const CHALLENGE_ORDER: DailyChallengeId[] = ['eat_vegetables', 'eat_soup', 'try_new_menu'];

/** Deterministic daily challenge from date — rotates through preset challenges. */
export function getDailyChallenge(date: string): DailyChallenge {
  const labels = getHankkiTodayBriefingMessages();
  const seed = date.split('-').reduce((sum, part) => sum + Number(part), 0);
  const id = CHALLENGE_ORDER[seed % CHALLENGE_ORDER.length];
  return labels.challenges[id];
}
