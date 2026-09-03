import * as React from 'react';
import { cn } from '../../lib/utils';
import { Button } from './Button';
import { type LucideIcon } from 'lucide-react';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => (
  <div className={cn('flex flex-col items-center justify-center py-12 px-6 text-center', className)}>
    {Icon && (
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-slate-400" />
      </div>
    )}
    <h3 className="text-base font-semibold text-slate-700">{title}</h3>
    {description && (
      <p className="mt-1.5 text-sm text-slate-500 max-w-sm">{description}</p>
    )}
    {actionLabel && onAction && (
      <div className="mt-5">
        <Button onClick={onAction} size="sm">
          {actionLabel}
        </Button>
      </div>
    )}
  </div>
);
EmptyState.displayName = 'EmptyState';
