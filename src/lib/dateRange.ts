import type { DateRangePreset, DateRangeFilter } from '../types';

export function getDateRangeForPreset(preset: DateRangePreset, customStart?: string, customEnd?: string): DateRangeFilter {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  if (preset === 'today') {
    return { preset, startDate: todayStr, endDate: todayStr };
  }

  if (preset === 'this_week') {
    const day = now.getDay();
    const diffToMonday = (day + 6) % 7; // Monday as first day of week
    const monday = new Date(now);
    monday.setDate(now.getDate() - diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return {
      preset,
      startDate: monday.toISOString().split('T')[0],
      endDate: sunday.toISOString().split('T')[0]
    };
  }

  if (preset === 'this_month') {
    const year = now.getFullYear();
    const month = now.getMonth();
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    return {
      preset,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  }

  if (preset === 'last_month') {
    const year = now.getFullYear();
    const month = now.getMonth() - 1;
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    return {
      preset,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  }

  if (preset === 'this_year') {
    const year = now.getFullYear();
    return {
      preset,
      startDate: `${year}-01-01`,
      endDate: `${year}-12-31`
    };
  }

  // Custom
  return {
    preset: 'custom',
    startDate: customStart || todayStr,
    endDate: customEnd || todayStr
  };
}
