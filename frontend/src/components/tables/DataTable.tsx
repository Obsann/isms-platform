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

interface DataTableProps<T = any> {
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
  defaultPageSize?: number;
  onRowClick?: (row: T) => void;
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
  defaultPageSize,
  onRowClick,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof MemberRecord>("memberId");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // If generic columns/data props are provided (from Task 7 verification component usage)
  if (data && columns) {
    const filteredGenericData = data.filter((row: any) =>
      Object.values(row).some((val) =>
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

    return (
      <div
        id="data-table-card"
        className="dashboard-card bg-[#23242a] border border-[#2e303a] rounded-2xl p-4 sm:p-6 shadow-sm transition-colors"
      >
        {(title || searchPlaceholder) && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div>
              {title && <h3 className="text-sm sm:text-base font-bold text-white font-serif">{title}</h3>}
              {description && <p className="text-xs text-[#717888] mt-0.5">{description}</p>}
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#6c7486] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={searchPlaceholder || "Search..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-36 sm:w-48 pl-8 pr-2.5 py-1 bg-[#1c1d22] light:bg-[#f8fafc] border border-[#2e3039] light:border-[#d0d5dd] rounded-lg text-xs text-white light:text-[#0f172a] placeholder-[#6c7486] focus:outline-hidden"
              />
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[11px] font-medium text-[#9ca3af] dark:text-[#717888] select-none border-b border-[#2e303a]/40 light:border-[#eaecf0]">
                {columns.map((col) => (
                  <th key={col.key} className={cn("py-2.5 px-3", col.className)}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-xs">
              {filteredGenericData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="py-8 text-center text-[#717888]">
                    No matching records found.
                  </td>
                </tr>
              ) : (
                filteredGenericData.slice(0, defaultPageSize || 10).map((row, idx) => (
                  <tr
                    key={keyExtractor ? keyExtractor(row) : idx}
                    onClick={() => onRowClick?.(row)}
                    className="table-row-item transition-colors group cursor-pointer border-b border-[#2e303a]/20 light:border-[#f8fafc]"
                  >
                    {columns.map((col) => (
                      <td key={col.key} className={cn("py-3 px-3 whitespace-nowrap", col.className)}>
                        {col.render ? col.render(row) : (row as any)[col.key]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
          <span className="inline-flex items-center justify-center px-3.5 py-1 text-xs font-medium rounded-full bg-[#271b33] text-[#c084fc] border border-[#482a63]/50 dark:bg-[#271b33] dark:text-[#c084fc] light-badge-in-progress">
            In Review
          </span>
        );
      case "Complete":
      case "Active / Verified":
        return (
          <span className="inline-flex items-center justify-center px-3.5 py-1 text-xs font-medium rounded-full bg-[#13261a] text-[#22c55e] border border-[#1d4d33]/50 dark:bg-[#13261a] dark:text-[#22c55e] light-badge-complete">
            Active / Verified
          </span>
        );
      case "Pending":
        return (
          <span className="inline-flex items-center justify-center px-3.5 py-1 text-xs font-medium rounded-full bg-[#292113] text-[#eab308] border border-[#4d3b14]/50 dark:bg-[#292113] dark:text-[#eab308] light-badge-pending">
            Pending
          </span>
        );
      case "Approved":
        return (
          <span className="inline-flex items-center justify-center px-3.5 py-1 text-xs font-medium rounded-full bg-[#2a1d12] text-[#f59e0b] border border-[#563515]/50 dark:bg-[#2a1d12] dark:text-[#f59e0b] light-badge-approved">
            Approved
          </span>
        );
      case "Rejected":
        return (
          <span className="inline-flex items-center justify-center px-3.5 py-1 text-xs font-medium rounded-full bg-[#281417] text-[#ef4444] border border-[#521a22]/50 dark:bg-[#281417] dark:text-[#ef4444] light-badge-rejected">
            Rejected
          </span>
        );
      case "Inactive":
      default:
        return (
          <span className="inline-flex items-center justify-center px-3.5 py-1 text-xs font-medium rounded-full bg-[#1c2028] text-[#94a3b8] border border-[#2e3745]/50 light-badge-inactive">
            {status || "Inactive"}
          </span>
        );
    }
  };

  return (
    <div
      id="data-table-card"
      className="dashboard-card bg-[#23242a] border border-[#2e303a] rounded-2xl p-4 sm:p-6 shadow-sm transition-colors"
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          {statusFilter ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-sky-400 font-medium bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/20">
                Filtered: {statusFilter}
              </span>
              <button
                onClick={() => onAddNewMember && onAddNewMember()}
                className="text-xs text-[#717888] hover:text-white dark:hover:text-white light:hover:text-black transition-colors"
              >
                Clear filter
              </button>
            </div>
          ) : (
            <span className="text-xs font-medium text-[#717888] light:text-[#64748b]">
              {filteredMembers.length} Members Recorded
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#6c7486] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-36 sm:w-48 pl-8 pr-2.5 py-1 bg-[#1c1d22] light:bg-[#f8fafc] border border-[#2e3039] light:border-[#d0d5dd] rounded-lg text-xs text-white light:text-[#0f172a] placeholder-[#6c7486] focus:outline-hidden focus:border-sky-500"
            />
          </div>

          <button
            id="btn-table-more-actions"
            className="p-1 text-[#8e95a5] hover:text-[#0f172a] dark:hover:text-white rounded-lg transition-colors"
            title="Table Options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[11px] font-medium text-[#9ca3af] dark:text-[#717888] select-none border-b border-[#2e303a]/40 light:border-[#eaecf0]">
              <th
                onClick={() => handleSort("name")}
                className="py-2.5 px-3 cursor-pointer hover:text-[#0f172a] dark:hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Members</span>
                  <ArrowUpDown className="w-2.5 h-2.5 opacity-60" />
                </div>
              </th>

              <th
                onClick={() => handleSort("memberId")}
                className="py-2.5 px-3 cursor-pointer hover:text-[#0f172a] dark:hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Member ID</span>
                  <ArrowUpDown className="w-2.5 h-2.5 opacity-60" />
                </div>
              </th>

              <th
                onClick={() => handleSort("savingAmount")}
                className="py-2.5 px-3 cursor-pointer hover:text-[#0f172a] dark:hover:text-white transition-colors"
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
                <td colSpan={5} className="py-8 text-center text-[#717888]">
                  No matching members found.
                </td>
              </tr>
            ) : (
              filteredMembers.map((member) => (
                <tr
                  key={member.id}
                  id={`table-row-${member.memberId}`}
                  className="table-row-item transition-colors group cursor-pointer border-b border-[#2e303a]/20 light:border-[#f8fafc]"
                >
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-[#2a2c35] shrink-0 shadow-xs">
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-[#8e95a5]">
                          {member.name.charAt(0)}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-[#1e293b] dark:text-white text-xs">
                          {member.name}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-3 whitespace-nowrap font-mono text-xs text-[#64748b] dark:text-[#9ca3af]">
                    {member.memberId}
                  </td>

                  <td className="py-3 px-3 whitespace-nowrap font-mono font-medium text-[#1e293b] dark:text-white text-xs">
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
                          className="p-1 text-[#9ca3af] hover:text-red-500 transition-colors"
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
