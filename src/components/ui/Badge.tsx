import * as React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
  size?: 'sm' | 'md';
}

const variantClasses: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-slate-100 text-slate-700 border-slate-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-rose-50 text-rose-700 border-rose-200',
  info: 'bg-sky-50 text-sky-700 border-sky-200',
  outline: 'bg-transparent text-slate-600 border-slate-300',
};

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'sm',
  children,
  ...props
}) => (
  <span
    className={cn(
      'inline-flex items-center font-medium border rounded-full whitespace-nowrap',
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
      variantClasses[variant],
      className
    )}
    {...props}
  >
    {children}
  </span>
);
Badge.displayName = 'Badge';
