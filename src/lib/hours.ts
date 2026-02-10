import type { OperatingHours, DayHours } from '@/types/cafe';

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
type DayKey = (typeof DAY_KEYS)[number];

/**
 * Returns the ordered day keys (mon-sun).
 */
export function getOrderedDayKeys(): readonly DayKey[] {
  return DAY_KEYS;
}

/**
 * Get the current day key in KST (UTC+9).
 */
function getCurrentDayKST(): DayKey {
  const now = new Date();
  // Get UTC time + 9 hours for KST
  const kstOffset = 9 * 60; // minutes
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const kstMinutes = utcMinutes + kstOffset;
  // Adjust day if KST crosses midnight
  const kstDay = kstMinutes >= 1440
    ? (now.getUTCDay() + 1) % 7
    : kstMinutes < 0
      ? (now.getUTCDay() + 6) % 7
      : now.getUTCDay();
  // JS getDay: 0=Sun, 1=Mon, ..., 6=Sat
  const mapping: DayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return mapping[kstDay];
}

/**
 * Get today's hours from operating hours.
 * Returns null if no operating hours data.
 */
export function getTodayHours(operatingHours?: OperatingHours): {
  dayKey: DayKey;
  hours: DayHours | undefined;
} | null {
  if (!operatingHours || Object.keys(operatingHours).length === 0) {
    return null;
  }
  const dayKey = getCurrentDayKST();
  return {
    dayKey,
    hours: operatingHours[dayKey],
  };
}

/**
 * Format hours as "HH:mm - HH:mm" or closed text.
 */
export function formatHours(hours: DayHours | undefined, closedText: string): string {
  if (!hours) return closedText;
  return `${hours.open} - ${hours.close}`;
}
