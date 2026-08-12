import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_MEAL_REMINDER_SETTINGS,
  getDefaultReminderTime,
} from '../../constants/mealReminderCopy';
import type { MealReminderSettings, MealReminderSlot } from '../../types/mealReminder';
import { formatReminderTimeParts, isValidReminderTime } from '../../utils/reminderTime';

const MEAL_REMINDER_STORAGE_KEY = '@hankki/meal_reminders';

type LegacySlot = {
  id?: MealReminderSlot;
  enabled?: boolean;
  time?: string;
  hour?: number;
  minute?: number;
};

function normalizeSlot(
  slot: MealReminderSlot,
  value: unknown,
): MealReminderSettings['slots'][MealReminderSlot] {
  const fallback = DEFAULT_MEAL_REMINDER_SETTINGS.slots[slot];
  const raw = (value ?? {}) as LegacySlot;

  const enabled = typeof raw.enabled === 'boolean' ? raw.enabled : fallback.enabled;

  if (typeof raw.time === 'string' && isValidReminderTime(raw.time)) {
    return { id: slot, enabled, time: raw.time.trim() };
  }

  if (typeof raw.hour === 'number' && typeof raw.minute === 'number') {
    return {
      id: slot,
      enabled,
      time: formatReminderTimeParts(raw.hour, raw.minute),
    };
  }

  return { id: slot, enabled, time: getDefaultReminderTime(slot) };
}

function parseMealReminderSettings(raw: string | null): MealReminderSettings | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<MealReminderSettings>;
    if (!parsed.slots || typeof parsed.slots !== 'object') return null;

    return {
      slots: {
        breakfast: normalizeSlot('breakfast', parsed.slots.breakfast),
        lunch: normalizeSlot('lunch', parsed.slots.lunch),
        dinner: normalizeSlot('dinner', parsed.slots.dinner),
      },
      updatedAt:
        typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function readMealReminderSettings(): Promise<MealReminderSettings> {
  try {
    const raw = await AsyncStorage.getItem(MEAL_REMINDER_STORAGE_KEY);
    return parseMealReminderSettings(raw) ?? DEFAULT_MEAL_REMINDER_SETTINGS;
  } catch {
    return DEFAULT_MEAL_REMINDER_SETTINGS;
  }
}

export async function writeMealReminderSettings(settings: MealReminderSettings): Promise<void> {
  await AsyncStorage.setItem(MEAL_REMINDER_STORAGE_KEY, JSON.stringify(settings));
}
