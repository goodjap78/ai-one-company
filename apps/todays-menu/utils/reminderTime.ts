/** Validates and parses meal reminder times stored as HH:mm. */

const HH_MM_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValidReminderTime(value: string): boolean {
  return HH_MM_REGEX.test(value.trim());
}

export function parseReminderTime(time: string): { hour: number; minute: number } | null {
  const trimmed = time.trim();
  if (!isValidReminderTime(trimmed)) return null;
  const [hour, minute] = trimmed.split(':').map(Number);
  return { hour, minute };
}

export function formatReminderTimeParts(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}
