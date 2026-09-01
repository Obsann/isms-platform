'use client';

import { useRouter } from 'next/navigation';
import PortalShell, { type NavSection } from '@/components/layout/PortalShell';
import PortalGuard from '@/components/auth/PortalGuard';
import { formatRoleLabel, useAuthUser } from '@/components/auth/useAuthUser';
import { logout } from '@/lib/api-client';
import { LayoutDashboard, Receipt, Users, Settings, User, Building2 } from 'lucide-react';

const navSections: NavSection[] = [
  {
    label: 'Teller operations',
    items: [
      { label: 'Dashboard', href: '/teller/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
      { label: 'Teller Desk', href: '/teller/desk', icon: <Receipt className="w-4 h-4" /> },
      { label: 'Members', href: '/teller/members', icon: <Users className="w-4 h-4" /> },
      { label: 'Loans & Credit', href: '/teller/loans', icon: <Building2 className="w-4 h-4" /> },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Profile', href: '/teller/profile', icon: <User className="w-4 h-4" /> },
      { label: 'Settings', href: '/teller/settings', icon: <Settings className="w-4 h-4" /> },
    ],
  },
];

function TellerShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const authUser = useAuthUser();
  return (
    <PortalShell
      portalName="Teller"
      portalBadgeColor="teller"
      navSections={navSections}
      user={{
        name: authUser?.fullName ?? 'Teller',
        role: authUser ? formatRoleLabel(authUser.role) : 'Teller',
      }}
      onLogout={() => {
        logout();
        router.replace('/login');
      }}
    >
      {children}
    </PortalShell>
  );
}

export default function TellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalGuard portal="teller">
      <TellerShell>{children}</TellerShell>
    </PortalGuard>
  );
}
