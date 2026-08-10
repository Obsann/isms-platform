"use client";

import React from "react";
import DataTable, { Column } from "@/components/tables/DataTable";
import StatusBadge from "@/components/badges/StatusBadge";
import { Button } from "@/components/ui/button";
import type { Member } from "@/types";

interface MemberSearchTableProps {
  members: Member[];
  total: number;
  isLoading?: boolean;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  onMemberClick?: (member: Member) => void;
  onRegisterClick?: () => void;
  onImportClick?: () => void;
  limit: number;
  offset: number;
  onPageChange: (newOffset: number) => void;
}

export const MemberSearchTable: React.FC<MemberSearchTableProps> = ({
  members,
  total,
  isLoading = false,
  searchValue,
  onSearchChange,
  onSearch,
  onMemberClick,
  onRegisterClick,
  onImportClick,
  limit,
  offset,
  onPageChange,
}) => {
  const columns: Column<Member>[] = [
    {
      key: "memberNumber",
      header: "Member Number",
      className: "font-semibold text-slate-800",
    },
    {
      key: "fullName",
      header: "Full Name",
      className: "font-medium text-slate-900",
    },
    {
      key: "phone",
      header: "Phone",
      render: (row) => row.phone ?? "-",
    },
    {
      key: "email",
      header: "Email",
      render: (row) => row.email ?? "-",
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (row) => (
        <div className="flex justify-end gap-2">
          {onMemberClick && (
            <Button
              variant="outline"
              size="sm"
              className="text-midnight hover:text-midnight border-slate-200 hover:bg-slate-50 font-medium"
              onClick={() => onMemberClick(row)}
            >
              View Profile
            </Button>
          )}
        </div>
      ),
    },
  ];

  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit) || 1;

  const handlePrevPage = () => {
    if (offset > 0) {
      onPageChange(Math.max(0, offset - limit));
    }
  };

  const handleNextPage = () => {
    if (offset + limit < total) {
      onPageChange(offset + limit);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onSearch();
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-slate-200/80 shadow-card">
        <div className="flex w-full sm:max-w-md gap-2">
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search by name, phone, email, or member number..."
            className="flex-1 px-3.5 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-800 bg-white outline-none transition-all focus:border-gold focus:ring-2 focus:ring-amber-100"
            disabled={isLoading}
          />
          <Button
            onClick={onSearch}
            disabled={isLoading}
            className="bg-midnight hover:bg-midnight/90 text-gold font-semibold px-5"
          >
            {isLoading ? "Searching..." : "Search"}
          </Button>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {onImportClick && (
            <Button
              variant="outline"
              onClick={onImportClick}
              disabled={isLoading}
              className="flex-1 sm:flex-initial text-midnight border-slate-200 hover:bg-slate-50 font-semibold px-5"
            >
              Import Legacy List
            </Button>
          )}
          {onRegisterClick && (
            <Button
              onClick={onRegisterClick}
              disabled={isLoading}
              className="flex-1 sm:flex-initial bg-gold hover:bg-gold/90 text-midnight font-bold px-6 shadow-sm border border-gold/15"
            >
              + Register Member
            </Button>
          )}
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={members}
        emptyMessage={isLoading ? "Loading members..." : "No members found"}
        rowKey={(row) => row.id}
      />

      {/* Pagination & Count */}
      {total > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-2">
          <p className="text-xs font-semibold text-slate-400">
            Showing <span className="text-slate-700">{offset + 1}</span> to{" "}
            <span className="text-slate-700">
              {Math.min(offset + limit, total)}
            </span>{" "}
            of <span className="text-slate-700">{total}</span> members
          </p>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={offset === 0 || isLoading}
              className="text-slate-600 border-slate-200 disabled:opacity-40"
            >
              Previous
            </Button>
            <div className="flex items-center justify-center px-3 rounded-lg border border-slate-100 bg-slate-50/50 text-xs font-bold text-slate-600">
              {currentPage} / {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={offset + limit >= total || isLoading}
              className="text-slate-600 border-slate-200 disabled:opacity-40"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberSearchTable;
