"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import PortalShell from "@/components/layout/PortalShell";
import MemberSearchTable from "@/components/members/MemberSearchTable";
import { getMembers } from "@/lib/api-client";
import type { Member } from "@/types";

// Nav Icons
const IconDashboard = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" />
    <rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" />
  </svg>
);
const IconMembers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const navItems = [
  { label: "Dashboard", href: "/tenant-admin/dashboard", icon: <IconDashboard /> },
  { label: "Members", href: "/tenant-admin/members", icon: <IconMembers />, active: true },
];

const mockUser = {
  name: "Melkamu Manager",
  role: "tenant-admin",
};

export default function TenantAdminMembersPage() {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [limit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getMembers({
        search: activeSearch || undefined,
        limit,
        offset,
      });
      setMembers(data.items);
      setTotal(data.total);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load members.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [activeSearch, limit, offset]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount
    fetchMembers();
  }, [fetchMembers]);

  const handleSearch = () => {
    setOffset(0);
    setActiveSearch(searchValue.trim());
  };

  return (
    <PortalShell
      portalName="Tenant Admin"
      portalBadgeColor="tenant-admin"
      navItems={navItems}
      user={mockUser}
    >
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-850">
            Member Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Register, search, and view profiles of all members in this SACCO tenant.
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-lg font-medium">
            ⚠️ {error}
          </div>
        )}

        <MemberSearchTable
          members={members}
          total={total}
          isLoading={isLoading}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          onSearch={handleSearch}
          onMemberClick={(member) => router.push(`/tenant-admin/members/${member.id}`)}
          onRegisterClick={() => router.push("/tenant-admin/members/register")}
          limit={limit}
          offset={offset}
          onPageChange={setOffset}
        />
      </div>
    </PortalShell>
  );
}
