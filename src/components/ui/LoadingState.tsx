import * as React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export interface LoadingStateProps {
  message?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading…',
  className,
  size = 'md',
}) => {
  const sizeMap = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-10 h-10' };

  return (
    <div
      className={cn('flex flex-col items-center justify-center py-12 px-6 text-center', className)}
      role="status"
      aria-live="polite"
    >
      <Loader2 className={cn('animate-spin text-indigo-500 mb-3', sizeMap[size])} />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
};
LoadingState.displayName = 'LoadingState';
