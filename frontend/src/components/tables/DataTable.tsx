'use client';

import React, { useState, useMemo } from "react";
import {
  MoreHorizontal,
  ArrowUpDown,
  Search,
  Trash2,
} from "lucide-react";
import { cn, formatETB } from "@/lib/utils";
import { MemberRecord } from "@/types/dashboard";

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  className?: string;
  render?: (row: T) => React.ReactNode;
}

export const initialMembersData: MemberRecord[] = [
  {
    id: "rec-1",
    name: "ByeWind",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    memberId: "M-001",
    savingAmount: 1200.0,
    status: "In Progress",
    phone: "0911 234 567",
    idType: "National ID",
    idNumber: "FAN-9012481",
    createdAt: "Jun 24, 2026",
  },
  {
    id: "rec-2",
    name: "Natali Craig",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
    memberId: "M-002",
    savingAmount: 881.0,
    status: "Complete",
    phone: "0922 456 789",
    idType: "Kebele Resident ID",
    idNumber: "FAN-3021944",
    createdAt: "Mar 10, 2026",
  },
  {
    id: "rec-3",
    name: "Drew Cano",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    memberId: "M-003",
    savingAmount: 409.0,
    status: "Pending",
    phone: "0933 678 901",
    idType: "Passport",
    idNumber: "ET-8832019",
    createdAt: "Nov 10, 2026",
  },
  {
    id: "rec-4",
    name: "Orlando Diggs",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
    memberId: "M-004",
    savingAmount: 953.0,
    status: "Approved",
    phone: "0944 890 123",
    idType: "National ID",
    idNumber: "FAN-1193820",
    createdAt: "Dec 20, 2026",
  },
  {
    id: "rec-5",
    name: "Andi Lane",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80",
    memberId: "M-005",
    savingAmount: 907.0,
    status: "Rejected",
    phone: "0955 012 345",
    idType: "Driver's License",
    idNumber: "DL-4482012",
    createdAt: "Jul 25, 2026",
  },
];

export interface DataTableProps<T = any> {
  members?: MemberRecord[];
  onAddNewMember?: () => void;
  onDeleteMember?: (id: string) => void;
  statusFilter?: string | null;
  // Generic data table props compatibility
  data?: T[];
  columns?: Column<T>[];
  keyExtractor?: (item: T) => string;
  title?: string;
  description?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  pageSize?: number;
  defaultPageSize?: number;
  pagination?: boolean;
  onRowClick?: (row: T) => void;
  className?: string;
}

export function DataTable<T = any>({
  members = initialMembersData,
  onAddNewMember,
  onDeleteMember,
  statusFilter,
  data,
  columns,
  keyExtractor,
  title,
  description,
  searchPlaceholder,
  emptyMessage,
  pageSize,
  defaultPageSize,
  pagination,
  onRowClick,
  className,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [genericSortKey, setGenericSortKey] = useState<string | null>(null);
  const [genericSortDir, setGenericSortDir] = useState<"asc" | "desc">("asc");

  const [sortField, setSortField] = useState<keyof MemberRecord>("memberId");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // If generic columns/data props are provided (e.g. from LoansView or Task 7 generic usage)
  if (data && columns) {
    const effectivePageSize = pageSize || defaultPageSize || 10;
    const shouldPaginate = pagination !== false;

    // Filter generic data
    const filteredGenericData = data.filter((row: any) =>
      Object.values(row).some((val) =>
        String(val ?? "").toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

    // Sort generic data
    const sortedGenericData = [...filteredGenericData].sort((a: any, b: any) => {
      if (!genericSortKey) return 0;
      const valA = a[genericSortKey] ?? "";
      const valB = b[genericSortKey] ?? "";
      if (typeof valA === "number" && typeof valB === "number") {
        return genericSortDir === "asc" ? valA - valB : valB - valA;
      }
      return genericSortDir === "asc"
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });

    const totalPages = Math.ceil(sortedGenericData.length / effectivePageSize);
    const paginatedData = shouldPaginate
      ? sortedGenericData.slice((currentPage - 1) * effectivePageSize, currentPage * effectivePageSize)
      : sortedGenericData;

    const hasHeaderBlock = Boolean(title || description || searchPlaceholder);

    return (
      <div
        id="data-table-card"
        className={cn(
          "w-full overflow-hidden rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-colors",
          className
        )}
      >
        {hasHeaderBlock && (
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/30">
            <div>
              {title && (
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight font-serif">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
              )}
            </div>
            {searchPlaceholder && (
              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-9 pl-9 pr-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-gold dark:focus:border-gold focus:ring-1 focus:ring-amber-100 dark:focus:ring-amber-900/30 transition-all"
                />
              </div>
            )}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/60 dark:bg-slate-800/40 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none border-b border-slate-200 dark:border-slate-800">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => {
                      if (col.sortable !== false) {
                        if (genericSortKey === col.key) {
                          setGenericSortDir(genericSortDir === "asc" ? "desc" : "asc");
                        } else {
                          setGenericSortKey(col.key);
                          setGenericSortDir("asc");
                        }
                      }
                    }}
                    className={cn(
                      "py-3 px-4",
                      col.sortable !== false && "cursor-pointer hover:text-slate-900 dark:hover:text-slate-100",
                      col.align === "center" ? "text-center" : col.align === "right" ? "text-right" : "text-left",
                      col.className
                    )}
                  >
                    <div
                      className={cn(
                        "inline-flex items-center gap-1.5",
                        col.align === "center" && "justify-center",
                        col.align === "right" && "justify-end"
                      )}
                    >
                      <span>{col.header}</span>
                      {col.sortable !== false && (
                        <ArrowUpDown className="w-3 h-3 opacity-60" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs text-slate-700 dark:text-slate-300">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="py-10 px-4 text-center text-slate-400 dark:text-slate-500">
                    {emptyMessage || "No matching records found."}
                  </td>
                </tr>
              ) : (
                paginatedData.map((row: any, idx: number) => {
                  const key = keyExtractor ? keyExtractor(row) : row.id || idx;
                  return (
                    <tr
                      key={key}
                      onClick={() => onRowClick?.(row)}
                      className={cn(
                        "hover:bg-amber-50/40 dark:hover:bg-slate-800/50 transition-colors duration-150 border-b border-slate-100 dark:border-slate-800/60",
                        onRowClick && "cursor-pointer"
                      )}
                    >
                      {columns.map((col) => {
                        const alignClass =
                          col.align === "center"
                            ? "text-center"
                            : col.align === "right"
                            ? "text-right"
                            : "text-left";
                        return (
                          <td
                            key={col.key}
                            className={cn("py-3 px-4 whitespace-nowrap", alignClass, col.className)}
                          >
                            {col.render ? col.render(row) : row[col.key]}
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
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              Showing {(currentPage - 1) * effectivePageSize + 1} to{" "}
              {Math.min(currentPage * effectivePageSize, sortedGenericData.length)} of {sortedGenericData.length} records
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
              >
                Previous
              </button>
              <span className="px-2 font-semibold text-slate-700 dark:text-slate-300">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const handleSort = (field: keyof MemberRecord) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredMembers = useMemo(() => {
    return members
      .filter((m) => {
        const matchesSearch =
          m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.memberId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (m.createdAt && m.createdAt.toLowerCase().includes(searchTerm.toLowerCase())) ||
          m.savingAmount.toString().includes(searchTerm);

        const matchesStatus =
          !statusFilter ||
          (statusFilter === "Pending" && m.status === "Pending") ||
          (statusFilter === "Active / Verified" && (m.status === "Complete" || m.status === "Active / Verified")) ||
          (statusFilter === "In Review" && (m.status === "In Progress" || m.status === "In Review")) ||
          (statusFilter === "Approved" && m.status === "Approved") ||
          (statusFilter === "Rejected" && m.status === "Rejected") ||
          (statusFilter === "Inactive" && m.status === "Inactive");

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        let valA = a[sortField] ?? "";
        let valB = b[sortField] ?? "";

        if (typeof valA === "number" && typeof valB === "number") {
          return sortDirection === "asc" ? valA - valB : valB - valA;
        }

        return sortDirection === "asc"
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
  }, [members, searchTerm, sortField, sortDirection, statusFilter]);

  const renderStatusBadge = (status: MemberRecord["status"]) => {
    switch (status) {
      case "In Progress":
      case "In Review":
        return (
          <span className="inline-flex items-center justify-center px-3.5 py-1 text-xs font-medium rounded-full bg-purple-50 text-purple-700 border border-purple-200 dark:bg-[#271b33] dark:text-[#c084fc] dark:border-[#482a63]/50 light-badge-in-progress">
            In Review
          </span>
        );
      case "Complete":
      case "Active / Verified":
        return (
          <span className="inline-flex items-center justify-center px-3.5 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-[#13261a] dark:text-[#22c55e] dark:border-[#1d4d33]/50 light-badge-complete">
            Active / Verified
          </span>
        );
      case "Pending":
        return (
          <span className="inline-flex items-center justify-center px-3.5 py-1 text-xs font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-[#292113] dark:text-[#eab308] dark:border-[#4d3b14]/50 light-badge-pending">
            Pending
          </span>
        );
      case "Approved":
        return (
          <span className="inline-flex items-center justify-center px-3.5 py-1 text-xs font-medium rounded-full bg-orange-50 text-orange-700 border border-orange-200 dark:bg-[#2a1d12] dark:text-[#f59e0b] dark:border-[#563515]/50 light-badge-approved">
            Approved
          </span>
        );
      case "Rejected":
        return (
          <span className="inline-flex items-center justify-center px-3.5 py-1 text-xs font-medium rounded-full bg-rose-50 text-rose-700 border border-rose-200 dark:bg-[#281417] dark:text-[#ef4444] dark:border-[#521a22]/50 light-badge-rejected">
            Rejected
          </span>
        );
      case "Inactive":
      default:
        return (
          <span className="inline-flex items-center justify-center px-3.5 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-200 dark:bg-[#1c2028] dark:text-[#94a3b8] dark:border-[#2e3745]/50 light-badge-inactive">
            {status || "Inactive"}
          </span>
        );
    }
  };

  return (
    <div
      id="data-table-card"
      className={cn(
        "dashboard-card bg-white dark:bg-[#23242a] border border-slate-200 dark:border-[#2e303a] rounded-2xl p-4 sm:p-6 shadow-sm transition-colors",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          {statusFilter ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-sky-600 dark:text-sky-400 font-medium bg-sky-50 dark:bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-200 dark:border-sky-500/20">
                Filtered: {statusFilter}
              </span>
              <button
                onClick={() => onAddNewMember && onAddNewMember()}
                className="text-xs text-slate-500 dark:text-[#717888] hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Clear filter
              </button>
            </div>
          ) : (
            <span className="text-xs font-medium text-slate-500 dark:text-[#717888]">
              {filteredMembers.length} Members Recorded
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 dark:text-[#6c7486] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-36 sm:w-48 pl-8 pr-2.5 py-1 bg-slate-50 dark:bg-[#1c1d22] border border-slate-200 dark:border-[#2e3039] rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#6c7486] focus:outline-none focus:border-sky-500"
            />
          </div>

          <button
            id="btn-table-more-actions"
            className="p-1 text-slate-400 dark:text-[#8e95a5] hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors"
            title="Table Options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[11px] font-medium text-slate-500 dark:text-[#9ca3af] select-none border-b border-slate-200 dark:border-[#2e303a]/40">
              <th
                onClick={() => handleSort("name")}
                className="py-2.5 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Members</span>
                  <ArrowUpDown className="w-2.5 h-2.5 opacity-60" />
                </div>
              </th>

              <th
                onClick={() => handleSort("memberId")}
                className="py-2.5 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Member ID</span>
                  <ArrowUpDown className="w-2.5 h-2.5 opacity-60" />
                </div>
              </th>

              <th
                onClick={() => handleSort("savingAmount")}
                className="py-2.5 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Amount</span>
                  <ArrowUpDown className="w-2.5 h-2.5 opacity-60" />
                </div>
              </th>

              <th className="py-2.5 px-3 text-right sm:text-left">
                <span>Status</span>
              </th>

              <th className="py-2.5 px-1 text-right">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>

          <tbody className="text-xs">
            {filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400 dark:text-[#717888]">
                  No matching members found.
                </td>
              </tr>
            ) : (
              filteredMembers.map((member) => (
                <tr
                  key={member.id}
                  id={`table-row-${member.memberId}`}
                  className="table-row-item transition-colors group cursor-pointer border-b border-slate-100 dark:border-[#2e303a]/20 hover:bg-slate-50 dark:hover:bg-[#282a32]"
                >
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-200 dark:bg-[#2a2c35] shrink-0 shadow-xs">
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-[#8e95a5]">
                          {member.name.charAt(0)}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-slate-900 dark:text-white text-xs">
                          {member.name}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-3 whitespace-nowrap font-mono text-xs text-slate-500 dark:text-[#9ca3af]">
                    {member.memberId}
                  </td>

                  <td className="py-3 px-3 whitespace-nowrap font-mono font-medium text-slate-900 dark:text-white text-xs">
                    {formatETB(member.savingAmount)}
                  </td>

                  <td className="py-3 px-3 whitespace-nowrap text-right sm:text-left">
                    {renderStatusBadge(member.status)}
                  </td>

                  <td className="py-3 px-1 whitespace-nowrap text-right">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end">
                      {onDeleteMember && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteMember(member.id);
                          }}
                          className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;
