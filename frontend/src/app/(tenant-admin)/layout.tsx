'use client';

import PortalShell from '@/components/layout/PortalShell';

export default function TenantAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell
      portalName="Tenant Admin"
      portalBadgeColor="tenant-admin"
      user={{ name: "Hirut Bekele", role: "Branch Manager" }}
    >
      {children}
    </PortalShell>
  );
}
