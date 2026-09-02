'use client';

import { useRouter } from 'next/navigation';
import PortalShell, { type NavSection } from '@/components/layout/PortalShell';
import PortalGuard from '@/components/auth/PortalGuard';
import { useAuthUser } from '@/components/auth/useAuthUser';
import { logout } from '@/lib/api-client';
import { useLang } from '@/components/i18n';
import { LayoutDashboard, Users, Settings, User, Building2 } from 'lucide-react';

const navSections: NavSection[] = [
  {
    label: 'nav.main',
    items: [
      { label: 'nav.dashboard', href: '/tenant-admin/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
      { label: 'nav.members', href: '/tenant-admin/members', icon: <Users className="w-4 h-4" /> },
      { label: 'nav.loans', href: '/tenant-admin/loans', icon: <Building2 className="w-4 h-4" /> },
    ],
  },
  {
    label: 'nav.account',
    items: [
      { label: 'nav.profile', href: '/tenant-admin/profile', icon: <User className="w-4 h-4" /> },
      { label: 'nav.settings', href: '/tenant-admin/settings', icon: <Settings className="w-4 h-4" /> },
    ],
  },
];

function TenantAdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const authUser = useAuthUser();
  const { t } = useLang();
  return (
    <PortalShell
      portalName="portal.tenantAdmin"
      portalBadgeColor="tenant-admin"
      navSections={navSections}
      user={{
        name: authUser?.fullName ?? t('portal.tenantAdmin'),
        role: authUser ? t(`role.${authUser.role}`) : t('portal.tenantAdmin'),
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

export default function TenantAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalGuard portal="tenant-admin">
      <TenantAdminShell>{children}</TenantAdminShell>
    </PortalGuard>
  );
}
