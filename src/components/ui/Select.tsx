import * as React from 'react';
import { cn } from '../../lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, children, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-sm font-medium text-slate-700">
            {label}
            {props.required && <span className="text-rose-500 ml-0.5">*</span>}
          </label>
        )}
        <select
          ref={ref}
          className={cn(
            'flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all appearance-none',
            error && 'border-rose-500 focus:ring-rose-500',
            className
          )}
          {...props}
        >
          {children}
        </select>
        {helperText && !error && (
          <p className="text-xs text-slate-400">{helperText}</p>
        )}
        {error && (
          <p className="text-sm text-rose-500">{error}</p>
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';
