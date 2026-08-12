import type { MealReminderSettings, MealReminderSlot } from '../../types/mealReminder';
import { isValidReminderTime } from '../../utils/reminderTime';
import { readMealReminderSettings, writeMealReminderSettings } from './mealReminderStorage';
import { syncMealReminderNotifications } from './mealReminderNotifications';

async function persistSettings(next: MealReminderSettings): Promise<MealReminderSettings> {
  await writeMealReminderSettings(next);
  await syncMealReminderNotifications(next);
  return next;
}

export async function getMealReminderSettings(): Promise<MealReminderSettings> {
  return readMealReminderSettings();
}

export async function setMealReminderEnabled(
  slot: MealReminderSlot,
  enabled: boolean,
): Promise<MealReminderSettings> {
  const settings = await readMealReminderSettings();
  const next: MealReminderSettings = {
    ...settings,
    slots: {
      ...settings.slots,
      [slot]: {
        ...settings.slots[slot],
        enabled,
      },
    },
    updatedAt: new Date().toISOString(),
  };

  return persistSettings(next);
}

export async function setMealReminderTime(
  slot: MealReminderSlot,
  time: string,
): Promise<{ settings: MealReminderSettings; ok: boolean }> {
  const trimmed = time.trim();
  if (!isValidReminderTime(trimmed)) {
    return { settings: await readMealReminderSettings(), ok: false };
  }

  const settings = await readMealReminderSettings();
  const next: MealReminderSettings = {
    ...settings,
    slots: {
      ...settings.slots,
      [slot]: {
        ...settings.slots[slot],
        time: trimmed,
      },
    },
    updatedAt: new Date().toISOString(),
  };

  const saved = await persistSettings(next);
  return { settings: saved, ok: true };
}
