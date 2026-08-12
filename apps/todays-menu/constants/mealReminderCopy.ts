import type { MealReminderCopy, MealReminderSettings, MealReminderSlot } from '../types/mealReminder';
import { formatReminderTimeParts } from '../utils/reminderTime';

export const MEAL_REMINDER_COPY: MealReminderCopy = {
  sectionTitle: '메뉴 알림',
  sectionHint: '한끼가 식사 시간에 맞춰 메뉴를 알려드려요.',
  slotLabels: {
    breakfast: '아침 메뉴 알림',
    lunch: '점심 메뉴 알림',
    dinner: '저녁 메뉴 알림',
  },
  slotMessages: {
    breakfast: '오늘 아침 뭐 먹지? 한끼가 준비했어요.',
    lunch: '점심 고민 끝! 오늘 메뉴를 확인해보세요.',
    dinner: '저녁 메뉴, 한끼가 골라봤어요.',
  },
  editTimeHint: '탭해서 시간 수정',
  invalidTimeMessage: 'HH:mm 형식으로 입력해 주세요 (예: 08:00)',
  emptyNotificationsTitle: '알림이 꺼져 있어요',
  emptyNotificationsMessage: '아침·점심·저녁 알림을 켜면 한끼가 먼저 찾아갑니다.',
};

export const MEAL_REMINDER_SLOT_ORDER: MealReminderSlot[] = ['breakfast', 'lunch', 'dinner'];

export const DEFAULT_MEAL_REMINDER_SETTINGS: MealReminderSettings = {
  slots: {
    breakfast: { id: 'breakfast', enabled: false, time: '08:00' },
    lunch: { id: 'lunch', enabled: false, time: '11:30' },
    dinner: { id: 'dinner', enabled: false, time: '17:30' },
  },
  updatedAt: new Date(0).toISOString(),
};

export function getReminderMessage(slot: MealReminderSlot): string {
  return MEAL_REMINDER_COPY.slotMessages[slot];
}

export function getDefaultReminderTime(slot: MealReminderSlot): string {
  return DEFAULT_MEAL_REMINDER_SETTINGS.slots[slot].time;
}

export { formatReminderTimeParts as formatReminderTime };
