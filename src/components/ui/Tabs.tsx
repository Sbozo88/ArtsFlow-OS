import * as React from 'react';
import { cn } from '../../lib/utils';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onTabChange, className }) => (
  <div className={cn('border-b border-slate-200 overflow-x-auto', className)} role="tablist">
    <nav className="-mb-px flex gap-1 min-w-max">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'flex items-center gap-2 whitespace-nowrap py-3 px-4 border-b-2 text-sm font-medium transition-colors',
            activeTab === tab.id
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          )}
        >
          {tab.icon}
          <span>{tab.label}</span>
          {tab.count !== undefined && (
            <span
              className={cn(
                'ml-1 text-xs px-1.5 py-0.5 rounded-full font-medium',
                activeTab === tab.id
                  ? 'bg-indigo-100 text-indigo-600'
                  : 'bg-slate-100 text-slate-500'
              )}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </nav>
  </div>
);
Tabs.displayName = 'Tabs';
