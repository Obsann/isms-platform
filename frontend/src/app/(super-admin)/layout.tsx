'use client';

import PortalShell from '@/components/layout/PortalShell';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell
      portalName="Super Admin"
      portalBadgeColor="super-admin"
      user={{ name: "ByeWind", role: "Platform Administrator" }}
    >
      {children}
    </PortalShell>
  );
}
