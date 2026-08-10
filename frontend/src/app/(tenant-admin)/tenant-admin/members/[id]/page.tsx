"use client";

import React, { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import PortalShell from "@/components/layout/PortalShell";
import MemberProfileView from "@/components/members/MemberProfileView";
import MemberForm from "@/components/members/MemberForm";
import { getMember, updateMember, type UpdateMemberPayload } from "@/lib/api-client";
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

interface TenantAdminMemberDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function TenantAdminMemberDetailPage({ params }: TenantAdminMemberDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMember = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getMember(id);
      setMember(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load member profile.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount
    fetchMember();
  }, [fetchMember]);

  const handleUpdate = async (payload: UpdateMemberPayload) => {
    setIsSaving(true);
    try {
      const updated = await updateMember(id, payload);
      setMember(updated);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
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
            {isEditing ? "Edit Member Profile" : "Member Profile"}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isEditing
              ? "Update this member's settings and personal information."
              : "Detailed view of the member file, including status and details."}
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-lg font-medium">
            ⚠️ {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12 text-slate-400 text-sm font-medium">
            Loading member profile...
          </div>
        ) : member ? (
          isEditing ? (
            <MemberForm
              initialValues={{
                ...member,
                middleName: member.middleName ?? "",
                nationalId: member.nationalId ?? "",
                idType: member.idType ?? "",
                phone: member.phone ?? "",
                email: member.email ?? "",
                dateOfBirth: member.dateOfBirth ?? "",
                joinedAt: member.joinedAt ?? "",
              }}
              onSubmit={handleUpdate}
              isLoading={isSaving}
              submitLabel="Save Changes"
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <MemberProfileView
              member={member}
              onEdit={() => setIsEditing(true)}
              onBack={() => router.push("/tenant-admin/members")}
            />
          )
        ) : (
          <div className="text-center py-12 text-slate-400 text-sm font-medium">
            Member profile not found.
          </div>
        )}
      </div>
    </PortalShell>
  );
}
