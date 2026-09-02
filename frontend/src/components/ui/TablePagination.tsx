'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export const DEFAULT_TABLE_PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

export interface TablePaginationProps {
  /** 1-based page index */
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: readonly number[];
  className?: string;
  /** Plural label after the total count, e.g. "results" or "members" */
  itemLabel?: string;
}

export function TablePagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_TABLE_PAGE_SIZE_OPTIONS,
  className,
  itemLabel = 'results',
}: TablePaginationProps) {
  if (totalItems <= 0) {
    return null;
  }

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, totalItems);
  const showControls = totalPages > 1 || Boolean(onPageSizeChange);

  if (!showControls) {
    return null;
  }

  return (
    <div
      className={cn(
        'p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400',
        className,
      )}
    >
      <span>
        Showing{' '}
        <strong className="font-semibold text-slate-700 dark:text-slate-300">{start}</strong> to{' '}
        <strong className="font-semibold text-slate-700 dark:text-slate-300">{end}</strong> of{' '}
        <strong className="font-semibold text-slate-700 dark:text-slate-300">{totalItems}</strong> {itemLabel}
      </span>

      <div className="flex items-center gap-2 flex-wrap justify-end">
        {onPageSizeChange && (
          <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <span className="font-medium">Rows</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        )}

        {totalPages > 1 && (
          <>
            <button
              type="button"
              onClick={() => onPageChange(Math.max(1, safePage - 1))}
              disabled={safePage <= 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors inline-flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous
            </button>
            <span className="px-2 font-medium text-slate-600 dark:text-slate-300">
              {safePage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
              disabled={safePage >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors inline-flex items-center gap-1"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
