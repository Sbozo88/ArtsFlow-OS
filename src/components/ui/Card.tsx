import * as React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Remove default padding */
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({ className, noPadding, children, ...props }) => (
  <div
    className={cn(
      'bg-white rounded-xl shadow-sm border border-slate-200',
      !noPadding && 'p-6',
      className
    )}
    {...props}
  >
    {children}
  </div>
);
Card.displayName = 'Card';

export type CardHeaderProps = React.HTMLAttributes<HTMLDivElement>;

export const CardHeader: React.FC<CardHeaderProps> = ({ className, children, ...props }) => (
  <div className={cn('mb-4', className)} {...props}>
    {children}
  </div>
);
CardHeader.displayName = 'CardHeader';

export type CardTitleProps = React.HTMLAttributes<HTMLHeadingElement>;

export const CardTitle: React.FC<CardTitleProps> = ({ className, children, ...props }) => (
  <h3 className={cn('text-base font-semibold text-slate-800', className)} {...props}>
    {children}
  </h3>
);
CardTitle.displayName = 'CardTitle';
