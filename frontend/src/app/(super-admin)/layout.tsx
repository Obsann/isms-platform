'use client';

import { useRouter } from 'next/navigation';
import PortalShell, { type NavSection } from '@/components/layout/PortalShell';
import PortalGuard from '@/components/auth/PortalGuard';
import { formatRoleLabel, useAuthUser } from '@/components/auth/useAuthUser';
import { logout } from '@/lib/api-client';
import { LayoutDashboard, Globe, Settings, User } from 'lucide-react';

const navSections: NavSection[] = [
  {
    label: 'Platform',
    items: [
      { label: 'Overview', href: '/super-admin/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
      { label: 'Tenants', href: '/super-admin/tenants', icon: <Globe className="w-4 h-4" /> },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Profile', href: '/super-admin/profile', icon: <User className="w-4 h-4" /> },
      { label: 'Settings', href: '/super-admin/settings', icon: <Settings className="w-4 h-4" /> },
    ],
  },
];

function SuperAdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const authUser = useAuthUser();
  return (
    <PortalShell
      portalName="Super Admin"
      portalBadgeColor="super-admin"
      navSections={navSections}
      user={{
        name: authUser?.fullName ?? 'Super Admin',
        role: authUser ? formatRoleLabel(authUser.role) : 'Platform Administrator',
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
