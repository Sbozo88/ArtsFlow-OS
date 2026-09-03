import * as React from 'react';
import { cn } from '../../lib/utils';
import { EmptyState } from './EmptyState';
import { TableRowSkeleton } from './Skeleton';
import { InboxIcon } from 'lucide-react';

// ── DataTable ────────────────────────────────────────────────────────────────

export interface DataTableColumn<T> {
  key: string;
  header: string;
  /** Custom render function. If not provided, accesses row[key] */
  render?: (row: T, index: number) => React.ReactNode;
  /** Column alignment. Default: 'left' */
  align?: 'left' | 'center' | 'right';
  /** CSS class for the column (header + cell) */
  className?: string;
  /** Minimum width class */
  minWidth?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  loading?: boolean;
  /** Key extractor for React keys */
  keyExtractor: (row: T) => string;
  /** Empty state config */
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  /** Row click handler */
  onRowClick?: (row: T) => void;
  className?: string;
  /** Number of skeleton rows to show while loading */
  skeletonRows?: number;
}

export function DataTable<T>({
  columns,
  data,
  loading = false,
  keyExtractor,
  emptyTitle = 'No records found.',
  emptyDescription,
  emptyActionLabel,
  onEmptyAction,
  onRowClick,
  className,
  skeletonRows = 5,
}: DataTableProps<T>) {
  if (loading && data.length === 0) {
    return (
      <div className={cn('bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden', className)}>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {columns.map(col => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider',
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center',
                    col.className,
                    col.minWidth
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: skeletonRows }).map((_, i) => (
              <TableRowSkeleton key={i} cols={columns.length} />
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (!loading && data.length === 0) {
    return (
      <div className={cn('bg-white rounded-xl shadow-sm border border-slate-200', className)}>
        <EmptyState
          icon={InboxIcon}
          title={emptyTitle}
          description={emptyDescription}
          actionLabel={emptyActionLabel}
          onAction={onEmptyAction}
        />
      </div>
    );
  }

  return (
    <div className={cn('bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {columns.map(col => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap',
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center',
                    col.className,
                    col.minWidth
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row, rowIndex) => (
              <tr
                key={keyExtractor(row)}
                className={cn(
                  'transition-colors hover:bg-slate-50',
                  onRowClick && 'cursor-pointer'
                )}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map(col => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-4 py-3.5 text-sm text-slate-700',
                      col.align === 'right' && 'text-right',
                      col.align === 'center' && 'text-center',
                      col.className,
                      col.minWidth
                    )}
                  >
                    {col.render
                      ? col.render(row, rowIndex)
                      : String((row as Record<string, unknown>)[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
