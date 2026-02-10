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
  const close = hours.close === '24:00' ? '00:00' : hours.close;
  return `${hours.open} - ${close}`;
}

/**
 * Check if a cafe is currently open based on its operating hours.
 * Uses KST (UTC+9) for time comparison.
 * Returns false if no hours data is available.
 */
export function isCafeOpenNow(operatingHours?: OperatingHours): boolean {
  const today = getTodayHours(operatingHours);
  if (!today || !today.hours) return false;

  const { hours } = today;

  // Current time in KST as minutes since midnight
  const now = new Date();
  const kstOffset = 9 * 60;
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  let kstMinutes = utcMinutes + kstOffset;
  if (kstMinutes >= 1440) kstMinutes -= 1440;

  const [openH, openM] = hours.open.split(':').map(Number);
  const openMinutes = openH * 60 + openM;

  const [closeH, closeM] = hours.close.split(':').map(Number);
  // "24:00" means midnight = 1440 minutes
  const closeMinutes = closeH === 24 ? 1440 : closeH * 60 + closeM;

  // Handle overnight hours (e.g., 22:00 - 02:00)
  if (closeMinutes <= openMinutes) {
    // Open if after opening OR before closing (next day)
    if (kstMinutes >= openMinutes || kstMinutes < closeMinutes) {
      // Check break time
      return !isDuringBreak(kstMinutes, hours);
    }
    return false;
  }

  // Normal hours (e.g., 09:00 - 22:00)
  if (kstMinutes >= openMinutes && kstMinutes < closeMinutes) {
    return !isDuringBreak(kstMinutes, hours);
  }

  return false;
}

function isDuringBreak(currentMinutes: number, hours: DayHours): boolean {
  if (!hours.breakStart || !hours.breakEnd) return false;

  const [bsH, bsM] = hours.breakStart.split(':').map(Number);
  const [beH, beM] = hours.breakEnd.split(':').map(Number);
  const breakStart = bsH * 60 + bsM;
  const breakEnd = beH * 60 + beM;

  return currentMinutes >= breakStart && currentMinutes < breakEnd;
}
