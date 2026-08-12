import { getReminderMessage } from '../../constants/mealReminderCopy';
import type { MealReminderSettings, MealReminderSlot } from '../../types/mealReminder';
import { parseReminderTime } from '../../utils/reminderTime';

export type ScheduledMealReminder = {
  slot: MealReminderSlot;
  hour: number;
  minute: number;
  time: string;
  title: string;
  body: string;
};

/** Maps saved settings to notification payloads for native scheduling. */
export function buildScheduledMealReminders(
  settings: MealReminderSettings,
): ScheduledMealReminder[] {
  return (['breakfast', 'lunch', 'dinner'] as const)
    .map((slot) => settings.slots[slot])
    .filter((slot) => slot.enabled)
    .map((slot) => {
      const parts = parseReminderTime(slot.time);
      return {
        slot: slot.id,
        hour: parts?.hour ?? 0,
        minute: parts?.minute ?? 0,
        time: slot.time,
        title: '오늘 뭐 먹지?',
        body: getReminderMessage(slot.id),
      };
    });
}

/**
 * Notification-ready sync hook.
 * Native scheduling (expo-notifications) can be wired here later.
 */
export async function syncMealReminderNotifications(
  settings: MealReminderSettings,
): Promise<void> {
  const scheduled = buildScheduledMealReminders(settings);
  void scheduled;
}
