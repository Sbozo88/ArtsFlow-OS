import { useState } from 'react';
import { Calendar, ChevronDown, Check } from 'lucide-react';
import type { DateRangePreset, DateRangeFilter } from '../../../types';

interface DateRangeSelectorProps {
  filter: DateRangeFilter;
  onPresetChange: (preset: DateRangePreset) => void;
  onCustomChange: (start: string, end: string) => void;
}

const PRESET_OPTIONS: Array<{ value: DateRangePreset; label: string }> = [
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'this_year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' }
];

export function DateRangeSelector({ filter, onPresetChange, onCustomChange }: DateRangeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customStart, setCustomStart] = useState(filter.startDate);
  const [customEnd, setCustomEnd] = useState(filter.endDate);

  const activeLabel = PRESET_OPTIONS.find(o => o.value === filter.preset)?.label || 'This Month';

  const applyCustom = () => {
    if (customStart && customEnd) {
      onCustomChange(customStart, customEnd);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shadow-xs hover:bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
        >
          <Calendar className="w-4 h-4 text-slate-500" />
          <span>{activeLabel}</span>
          <span className="text-xs text-slate-400 font-mono">
            ({filter.startDate} → {filter.endDate})
          </span>
          <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
        </button>
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 z-30 p-2">
            <div className="space-y-1">
              {PRESET_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => {
                    onPresetChange(opt.value);
                    if (opt.value !== 'custom') setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${
                    filter.preset === opt.value
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{opt.label}</span>
                  {filter.preset === opt.value && <Check className="w-4 h-4 text-indigo-600" />}
                </button>
              ))}
            </div>

            {filter.preset === 'custom' && (
              <div className="mt-3 pt-3 border-t border-slate-100 px-2 space-y-2">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Select Dates</div>
                <div>
                  <label className="block text-xs text-slate-600 mb-0.5">Start Date</label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={e => setCustomStart(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-md px-2 py-1.5 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-0.5">End Date</label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={e => setCustomEnd(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-md px-2 py-1.5 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={applyCustom}
                  className="w-full mt-2 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                >
                  Apply Custom Range
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
