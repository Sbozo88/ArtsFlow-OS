import * as React from 'react';
import { cn } from '../../lib/utils';
import { getStatusColours, formatStatusLabel } from '../../lib/designTokens';

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: string | undefined | null;
  /** Override the displayed label. By default formats the raw status string. */
  label?: string;
  /** Show a coloured dot indicator alongside the text. */
  dot?: boolean;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  dot = true,
  size = 'sm',
  className,
  ...props
}) => {
  const colours = getStatusColours(status);
  const displayLabel = label || formatStatusLabel(status);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium border rounded-full whitespace-nowrap',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
        colours.bg,
        colours.text,
        colours.border,
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full shrink-0', colours.dot)}
          aria-hidden="true"
        />
      )}
      {displayLabel}
    </span>
  );
};
StatusBadge.displayName = 'StatusBadge';
