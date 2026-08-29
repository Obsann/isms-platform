"use client";

import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key?: string;
  accessorKey?: string;
  header: React.ReactNode;
  render?: (row: T, index?: number) => React.ReactNode;
  cell?: (row: T, index?: number) => React.ReactNode;
  accessor?: (row: T, index?: number) => React.ReactNode;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  className?: string;
}

export interface DataTableProps<T> {
  columns?: Column<T>[];
  data?: T[];
  members?: any;
  statusFilter?: any;
  onDeleteMember?: any;
  emptyMessage?: string;
  className?: string;
  rowKey?: (row: T, index: number) => string | number;
  keyExtractor?: (row: T, index: number) => string | number;
  title?: string;
  description?: string;
  searchPlaceholder?: string;
  defaultPageSize?: number;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({
  columns = [],
  data = [],
  emptyMessage = "No records found",
  className,
  rowKey,
  keyExtractor,
  title,
  description,
  searchPlaceholder = "Search...",
  defaultPageSize,
  onRowClick,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize || 10);

  // 1. Search Filter
  const filteredData = useMemo(() => {
    if (!search.trim()) return data;
    const query = search.toLowerCase();

    return data.filter((item) => {
      return Object.values(item as Record<string, unknown>).some((val) => {
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(query);
      });
    });
  }, [data, search]);

  // 2. Sorting
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aRecord = a as Record<string, unknown>;
      const bRecord = b as Record<string, unknown>;
      const valA = aRecord[sortKey];
      const valB = bRecord[sortKey];

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      let comparison = 0;
      if (typeof valA === "number" && typeof valB === "number") {
        comparison = valA - valB;
      } else {
        comparison = String(valA).localeCompare(String(valB));
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filteredData, sortKey, sortDirection]);

  // 3. Pagination
  const shouldPaginate = Boolean(defaultPageSize);
  const totalPages = shouldPaginate ? Math.ceil(sortedData.length / pageSize) : 1;
  
  const paginatedData = useMemo(() => {
    if (!shouldPaginate) return sortedData;
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, shouldPaginate, currentPage, pageSize]);

  const handleSort = (columnKey: string, sortable?: boolean) => {
    if (!sortable) return;
    if (sortKey === columnKey) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        setSortKey(null);
        setSortDirection("asc");
      }
    } else {
      setSortKey(columnKey);
      setSortDirection("asc");
    }
  };

  const getItemKey = (row: T, index: number): string | number => {
    if (rowKey) return rowKey(row, index);
    if (keyExtractor) return keyExtractor(row, index);
    const rec = row as Record<string, unknown>;
    if (rec.id !== undefined && rec.id !== null) return String(rec.id);
    return index;
  };

  return (
    <div
      className={cn(
        "w-full bg-surface-card rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col",
        className
      )}
    >
      {/* Header & Controls */}
      {(title || description || searchPlaceholder) && (
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface dark:bg-slate-900/50">
          <div>
            {title && <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{title}</h3>}
            {description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
            )}
          </div>

          <div className="w-full sm:w-auto flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
              <svg
                className="w-4 h-4 text-slate-400 absolute left-3 top-2.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Table Content */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-midnight border-b-2 border-gold/60">
            <tr>
              {columns.map((col, index) => {
                const colKey = col.key || col.accessorKey || `col-${index}`;
                const alignClass =
                  col.align === "center"
                    ? "text-center"
                    : col.align === "right"
                    ? "text-right"
                    : "text-left";

                return (
                  <th
                    key={colKey}
                    onClick={() => handleSort(colKey, col.sortable)}
                    className={cn(
                      "px-5 py-4 text-[10px] font-bold uppercase tracking-[0.14em] text-gold-light/90 select-none",
                      col.sortable && "cursor-pointer hover:text-white transition-colors",
                      alignClass,
                      col.className
                    )}
                  >
                    <div
                      className={cn(
                        "inline-flex items-center gap-1.5",
                        col.align === "right" && "justify-end",
                        col.align === "center" && "justify-center"
                      )}
                    >
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="text-[10px] opacity-60">
                          {sortKey === colKey
                            ? sortDirection === "asc"
                              ? "▲"
                              : "▼"
                            : "↕"}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300 font-sans">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-5 py-10 text-center text-slate-400 text-sm"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => {
                const key = getItemKey(row, rowIndex);
                const record = row as Record<string, unknown>;

                return (
                  <tr
                    key={key}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={cn(
                      "hover:bg-amber-500/5 dark:hover:bg-amber-500/10 transition-colors duration-150",
                      onRowClick && "cursor-pointer"
                    )}
                  >
                    {columns.map((col, colIdx) => {
                      const alignClass =
                        col.align === "center"
                          ? "text-center"
                          : col.align === "right"
                          ? "text-right"
                          : "text-left";

                      const fieldKey = col.key || col.accessorKey || String(colIdx);
                      const renderFn = col.render || col.cell || col.accessor;
                      const content = renderFn
                        ? renderFn(row, rowIndex)
                        : (record[fieldKey] as React.ReactNode) ?? "-";

                      return (
                        <td
                          key={fieldKey}
                          className={cn("px-5 py-3.5 align-middle text-sm", alignClass, col.className)}
                        >
                          {content}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {shouldPaginate && totalPages > 1 && (
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            Showing <strong className="font-semibold text-slate-700 dark:text-slate-300">{(currentPage - 1) * pageSize + 1}</strong> to{" "}
            <strong className="font-semibold text-slate-700 dark:text-slate-300">
              {Math.min(currentPage * pageSize, sortedData.length)}
            </strong>{" "}
            of <strong className="font-semibold text-slate-700 dark:text-slate-300">{sortedData.length}</strong> results
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Previous
            </button>
            <span className="px-2 font-medium">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
export const initialMembersData = [];
