/**
 * Centralized Datetime and Timezone Utilities for ArtsFlow OS.
 * All operational dates and timestamps are handled cleanly and consistently:
 * - Storage format: ISO 8601 strings (e.g. 2026-09-02T18:00:00.000Z) or YYYY-MM-DD
 * - Conversions accept Date, Firestore Timestamp, ISO strings, or unix millis.
 * - Timezone-aware formatting defaults to the organisation timezone (default: Africa/Johannesburg).
 */

export const DEFAULT_ORGANISATION_TIMEZONE = 'Africa/Johannesburg';

export type TimestampLike = 
  | string 
  | number 
  | Date 
  | { seconds: number; nanoseconds: number } 
  | { toDate: () => Date } 
  | null 
  | undefined;

/**
 * Normalizes any timestamp-like input into a strict ISO 8601 string.
 * Returns fallback (or current ISO string) if input is null/undefined or invalid.
 */
export function toIsoString(value: TimestampLike, fallback?: string): string {
  if (!value) {
    return fallback !== undefined ? fallback : new Date().toISOString();
  }

  // Handle Firestore Timestamp or objects with toDate()
  if (typeof value === 'object') {
    if ('toDate' in value && typeof value.toDate === 'function') {
      return value.toDate().toISOString();
    }
    if ('seconds' in value && typeof value.seconds === 'number') {
      return new Date(value.seconds * 1000).toISOString();
    }
    if (value instanceof Date) {
      return isNaN(value.getTime()) ? (fallback || new Date().toISOString()) : value.toISOString();
    }
  }

  // Handle number (epoch millis)
  if (typeof value === 'number') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? (fallback || new Date().toISOString()) : d.toISOString();
  }

  // Handle string
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return fallback || new Date().toISOString();

    // If it's already YYYY-MM-DD, convert safely
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return `${trimmed}T00:00:00.000Z`;
    }

    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? (fallback || new Date().toISOString()) : d.toISOString();
  }

  return fallback || new Date().toISOString();
}

/**
 * Formats a timestamp into a clean YYYY-MM-DD date string in the target timezone.
 */
export function toDateString(value: TimestampLike, timeZone: string = DEFAULT_ORGANISATION_TIMEZONE): string {
  const iso = toIsoString(value);
  const date = new Date(iso);

  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(date);
  } catch {
    return iso.split('T')[0];
  }
}

/**
 * Returns the current date (YYYY-MM-DD) in the specified organisation timezone.
 */
export function getTodayString(timeZone: string = DEFAULT_ORGANISATION_TIMEZONE): string {
  return toDateString(new Date(), timeZone);
}

/**
 * Formats a date/time for user-facing display according to organisation timezone.
 */
export function formatDisplayDateTime(
  value: TimestampLike,
  options?: {
    timeZone?: string;
    includeTime?: boolean;
    format?: 'short' | 'medium' | 'long';
  }
): string {
  if (!value) return '-';
  const iso = toIsoString(value);
  const date = new Date(iso);
  if (isNaN(date.getTime())) return '-';

  const tz = options?.timeZone || DEFAULT_ORGANISATION_TIMEZONE;
  const includeTime = options?.includeTime !== undefined ? options.includeTime : true;

  try {
    return new Intl.DateTimeFormat('en-ZA', {
      timeZone: tz,
      dateStyle: options?.format || 'medium',
      ...(includeTime ? { timeStyle: 'short' } : {})
    }).format(date);
  } catch {
    return iso.replace('T', ' ').substring(0, 16);
  }
}

/**
 * Compares two date strings or timestamps against the specified timezone.
 * Returns true if both represent the exact same calendar day.
 */
export function isSameDay(
  a: TimestampLike,
  b: TimestampLike,
  timeZone: string = DEFAULT_ORGANISATION_TIMEZONE
): boolean {
  if (!a || !b) return false;
  return toDateString(a, timeZone) === toDateString(b, timeZone);
}

/**
 * Evaluates whether a due date (YYYY-MM-DD or ISO) is strictly in the past relative to today in the organisation timezone.
 */
export function isDateOverdue(
  dueDate: string,
  timeZone: string = DEFAULT_ORGANISATION_TIMEZONE
): boolean {
  if (!dueDate) return false;
  const today = getTodayString(timeZone);
  const target = dueDate.includes('T') ? toDateString(dueDate, timeZone) : dueDate;
  return target < today;
}
