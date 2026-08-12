export type MealReminderSlot = 'breakfast' | 'lunch' | 'dinner';

export type MealReminderSlotSettings = {
  id: MealReminderSlot;
  enabled: boolean;
  /** Local time in HH:mm (24-hour). */
  time: string;
};

export type MealReminderSettings = {
  slots: Record<MealReminderSlot, MealReminderSlotSettings>;
  updatedAt: string;
};

export type MealReminderCopy = {
  sectionTitle: string;
  sectionHint: string;
  slotLabels: Record<MealReminderSlot, string>;
  slotMessages: Record<MealReminderSlot, string>;
  editTimeHint: string;
  invalidTimeMessage: string;
  emptyNotificationsTitle: string;
  emptyNotificationsMessage: string;
};
