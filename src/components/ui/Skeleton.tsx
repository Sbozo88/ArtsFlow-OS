import * as React from 'react';
import { cn } from '../../lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Width class (e.g. 'w-32', 'w-full'). Default: 'w-full' */
  width?: string;
  /** Height class (e.g. 'h-4', 'h-8'). Default: 'h-4' */
  height?: string;
  /** Use rounded-full for circles */
  circle?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  width = 'w-full',
  height = 'h-4',
  circle = false,
  ...props
}) => (
  <div
    className={cn(
      'animate-pulse bg-slate-200',
      circle ? 'rounded-full' : 'rounded-lg',
      width,
      height,
      className
    )}
    aria-hidden="true"
    {...props}
  />
);
Skeleton.displayName = 'Skeleton';

// ── Pre-built skeleton patterns ──────────────────────────────────────────────

export const StatCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 flex items-center gap-4">
    <Skeleton circle width="w-11" height="h-11" />
    <div className="flex-1 space-y-2">
      <Skeleton width="w-24" height="h-3" />
      <Skeleton width="w-16" height="h-6" />
    </div>
  </div>
);

export const TableRowSkeleton: React.FC<{ cols?: number }> = ({ cols = 4 }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="p-4">
        <Skeleton width={i === 0 ? 'w-32' : 'w-20'} height="h-4" />
      </td>
    ))}
  </tr>
);

export const CardSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-3">
    <Skeleton width="w-40" height="h-5" />
    <Skeleton width="w-full" height="h-3" />
    <Skeleton width="w-3/4" height="h-3" />
  </div>
);
