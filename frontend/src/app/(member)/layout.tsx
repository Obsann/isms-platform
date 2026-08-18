'use client';

import PortalShell from '@/components/layout/PortalShell';

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell
      portalName="Member Portal"
      portalBadgeColor="member"
      user={{ name: "Tigist Assefa", role: "Sacco Member" }}
    >
      {children}
    </PortalShell>
  );
}
