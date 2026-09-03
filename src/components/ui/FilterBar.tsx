import * as React from 'react';
import { useState, useCallback } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface FilterBarProps {
  /** Search input value */
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  children?: React.ReactNode;
  className?: string;
  /** Show a 'Clear All' link when there are active filters */
  onClearAll?: () => void;
  showClearAll?: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search…',
  children,
  className,
  onClearAll,
  showClearAll = false,
}) => {
  const [searchFocused, setSearchFocused] = useState(false);

  const handleClear = useCallback(() => {
    onSearchChange?.('');
  }, [onSearchChange]);

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200',
        className
      )}
    >
      {/* Search Input */}
      {onSearchChange && (
        <div className="relative flex-1 min-w-0 w-full sm:max-w-xs">
          <Search
            className={cn(
              'w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 transition-colors',
              searchFocused ? 'text-indigo-500' : 'text-slate-400'
            )}
          />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder={searchPlaceholder}
            className="w-full pl-10 pr-8 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
          />
          {searchValue && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Filter controls */}
      {children && (
        <div className="flex flex-wrap items-center gap-2">
          {children}
        </div>
      )}

      {/* Clear all */}
      {showClearAll && onClearAll && (
        <button
          type="button"
          onClick={onClearAll}
          className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors ml-auto"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Clear All
        </button>
      )}
    </div>
  );
};
FilterBar.displayName = 'FilterBar';

// ── Filter Chip ──────────────────────────────────────────────────────────────

export interface FilterChipProps {
  label: string;
  onRemove: () => void;
}

export const FilterChip: React.FC<FilterChipProps> = ({ label, onRemove }) => (
  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full">
    {label}
    <button
      type="button"
      onClick={onRemove}
      className="hover:text-indigo-900 transition-colors"
      aria-label={`Remove filter: ${label}`}
    >
      <X className="w-3 h-3" />
    </button>
  </span>
);
FilterChip.displayName = 'FilterChip';
