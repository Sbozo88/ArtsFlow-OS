import * as React from 'react';
import { cn } from '../../lib/utils';
import { Button } from './Button';
import { Breadcrumb, type BreadcrumbItem } from './Breadcrumb';
import { type LucideIcon } from 'lucide-react';

export interface PageHeaderAction {
  label: string;
  onClick?: () => void;
  href?: string;
  icon?: LucideIcon;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
}

export interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: PageHeaderAction[];
  className?: string;
  children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  breadcrumbs,
  actions,
  className,
  children,
}) => (
  <div className={cn('mb-6', className)}>
    {breadcrumbs && <Breadcrumb items={breadcrumbs} />}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        )}
      </div>
      {actions && actions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {actions.map((action, i) => {
            const Icon = action.icon;
            return (
              <Button
                key={i}
                variant={action.variant || (i === actions.length - 1 ? 'primary' : 'outline')}
                size="sm"
                onClick={action.onClick}
              >
                {Icon && <Icon className="w-4 h-4 mr-1.5" />}
                {action.label}
              </Button>
            );
          })}
        </div>
      )}
    </div>
    {children}
  </div>
);
PageHeader.displayName = 'PageHeader';
