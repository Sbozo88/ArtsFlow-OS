import { useSearchParams } from 'react-router-dom';
import { useMemo } from 'react';
import { getDateRangeForPreset } from '../lib/dateRange';
import type { DateRangePreset, DateRangeFilter } from '../types';

export function useDateRangeFilter() {
  const [searchParams, setSearchParams] = useSearchParams();

  const preset = (searchParams.get('preset') as DateRangePreset) || 'this_month';
  const customStart = searchParams.get('startDate') || undefined;
  const customEnd = searchParams.get('endDate') || undefined;

  const filter: DateRangeFilter = useMemo(() => {
    return getDateRangeForPreset(preset, customStart, customEnd);
  }, [preset, customStart, customEnd]);

  const setPreset = (newPreset: DateRangePreset) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('preset', newPreset);
    if (newPreset !== 'custom') {
      nextParams.delete('startDate');
      nextParams.delete('endDate');
    }
    setSearchParams(nextParams);
  };

  const setCustomRange = (startDate: string, endDate: string) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('preset', 'custom');
    nextParams.set('startDate', startDate);
    nextParams.set('endDate', endDate);
    setSearchParams(nextParams);
  };

  return {
    filter,
    setPreset,
    setCustomRange
  };
}
