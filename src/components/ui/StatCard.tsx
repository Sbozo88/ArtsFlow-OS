import * as React from 'react';
import { cn } from '../../lib/utils';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: string;
  context?: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  context,
  className,
}) => (
  <div
    className={cn(
      'bg-white rounded-xl p-5 shadow-sm border border-slate-200 flex items-start gap-4 transition-shadow hover:shadow-md',
      className
    )}
  >
    {icon && (
      <div className="p-2.5 rounded-xl bg-slate-50 shrink-0">
        {icon}
      </div>
    )}
    <div className="min-w-0 flex-1">
      <p className="text-sm font-medium text-slate-500 truncate">{title}</p>
      <p className="text-2xl font-bold text-slate-800 mt-0.5 tracking-tight">{value}</p>
      {(trend || context) && (
        <p className="text-xs text-slate-400 mt-1 truncate">
          {trend && <span className="font-medium">{trend}</span>}
          {trend && context && ' · '}
          {context}
        </p>
      )}
    </div>
  </div>
);
StatCard.displayName = 'StatCard';
