"use client";

import React from "react";
import { useRouter } from "next/navigation";
import PortalShell from "@/components/layout/PortalShell";
import LegacyImportWizard from "@/components/members/LegacyImportWizard";

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
  { label: "Dashboard", href: "/teller/dashboard", icon: <IconDashboard /> },
  { label: "Members", href: "/teller/members", icon: <IconMembers />, active: true },
];

const mockUser = {
  name: "Jerry Teller",
  role: "teller",
};

export default function TellerLegacyImportPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/teller/members");
  };

  const handleCancel = () => {
    router.push("/teller/members");
  };

  return (
    <PortalShell
      portalName="Teller Desk"
      portalBadgeColor="teller"
      navItems={navItems}
      user={mockUser}
    >
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-850">
            Legacy Database Onboarding
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Import existing member profiles from legacy CSV database sheets.
          </p>
        </div>

        <LegacyImportWizard onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>
    </PortalShell>
  );
}
