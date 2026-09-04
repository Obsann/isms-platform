'use client';

import { useRouter } from 'next/navigation';
import PortalShell, { type NavSection } from '@/components/layout/PortalShell';
import PortalGuard from '@/components/auth/PortalGuard';
import { useAuthUser } from '@/components/auth/useAuthUser';
import { logout } from '@/lib/api-client';
import { useLang } from '@/components/i18n';
import { LayoutDashboard, Receipt, Users, Settings, User, Building2 } from 'lucide-react';

const navSections: NavSection[] = [
  {
    label: 'nav.tellerOps',
    items: [
      { label: 'nav.dashboard', href: '/teller/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
      { label: 'nav.tellerDesk', href: '/teller/desk', icon: <Receipt className="w-4 h-4" /> },
      { label: 'nav.members', href: '/teller/members', icon: <Users className="w-4 h-4" /> },
      { label: 'nav.loans', href: '/teller/loans', icon: <Building2 className="w-4 h-4" /> },
    ],
  },
  {
    label: 'nav.account',
    items: [
      { label: 'nav.profile', href: '/teller/profile', icon: <User className="w-4 h-4" /> },
      { label: 'nav.settings', href: '/teller/settings', icon: <Settings className="w-4 h-4" /> },
    ],
  },
];

function TellerShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const authUser = useAuthUser();
  const { t } = useLang();
  return (
    <PortalShell
      portalName="portal.teller"
      portalBadgeColor="teller"
      navSections={navSections}
      user={{
        name: authUser?.fullName ?? t('portal.teller'),
        role: authUser ? t(`role.${authUser.role}`) : t('portal.teller'),
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
