'use client';

import { useRouter } from 'next/navigation';
import PortalShell, { type NavSection } from '@/components/layout/PortalShell';
import PortalGuard from '@/components/auth/PortalGuard';
import { useAuthUser } from '@/components/auth/useAuthUser';
import { logout } from '@/lib/api-client';
import { useLang } from '@/components/i18n';
import { LayoutDashboard, Globe, Settings, User } from 'lucide-react';

const navSections: NavSection[] = [
  {
    label: 'nav.platform',
    items: [
      { label: 'nav.overview', href: '/super-admin/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
      { label: 'nav.tenants', href: '/super-admin/tenants', icon: <Globe className="w-4 h-4" /> },
    ],
  },
  {
    label: 'nav.account',
    items: [
      { label: 'nav.profile', href: '/super-admin/profile', icon: <User className="w-4 h-4" /> },
      { label: 'nav.settings', href: '/super-admin/settings', icon: <Settings className="w-4 h-4" /> },
    ],
  },
];

function SuperAdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const authUser = useAuthUser();
  const { t } = useLang();
  return (
    <PortalShell
      portalName="portal.superAdmin"
      portalBadgeColor="super-admin"
      navSections={navSections}
      user={{
        name: authUser?.fullName ?? t('portal.superAdmin'),
        role: authUser ? t(`role.${authUser.role}`) : t('portal.superAdmin'),
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

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalGuard portal="super-admin">
      <SuperAdminShell>{children}</SuperAdminShell>
    </PortalGuard>
  );
}
