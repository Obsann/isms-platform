'use client';

import PortalShell from '@/components/layout/PortalShell';

export default function TellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell
      portalName="Teller Portal"
      portalBadgeColor="teller"
      user={{ name: "Abebe Bikila", role: "Head Teller" }}
    >
      {children}
    </PortalShell>
  );
}
