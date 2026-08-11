import React from "react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render?: (row: T, index: number) => React.ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  className?: string;
  rowKey?: (row: T, index: number) => string | number;
}

export function DataTable<T>({
  columns,
  data,
  emptyMessage = "No records found",
  className,
  rowKey,
}: DataTableProps<T>) {
  return (
    <div
      className={cn(
        "w-full overflow-x-auto rounded-xl border border-slate-200/80 bg-white shadow-card",
        className
      )}
    >
      <table className="w-full text-left text-sm border-collapse">
        <thead className="bg-midnight border-b-2 border-gold/60">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-5 py-4 text-[10px] font-bold uppercase tracking-[0.14em] text-gold-light/90",
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700 font-sans">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-5 py-10 text-center text-slate-400 text-sm"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => {
              const record = row as Record<string, unknown>;
              const key = rowKey
                ? rowKey(row, rowIndex)
                : typeof record?.id === "string" || typeof record?.id === "number"
                  ? record.id
                  : rowIndex;
              return (
                <tr
                  key={key}
                  className="hover:bg-gold-muted/40 transition-colors duration-150"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn("px-5 py-3.5 align-middle text-sm", col.className)}
                    >
                      {col.render
                        ? col.render(row, rowIndex)
                        : (record[col.key] as React.ReactNode) ?? "-"}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
