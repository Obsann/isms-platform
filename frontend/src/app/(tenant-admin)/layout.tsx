'use client';

import { useRouter } from 'next/navigation';
import PortalShell, { type NavSection } from '@/components/layout/PortalShell';
import PortalGuard from '@/components/auth/PortalGuard';
import { formatRoleLabel, useAuthUser } from '@/components/auth/useAuthUser';
import { logout } from '@/lib/api-client';
import { LayoutDashboard, Users, Settings, User, Building2 } from 'lucide-react';

const navSections: NavSection[] = [
  {
    label: 'Main',
    items: [
      { label: 'Dashboard', href: '/tenant-admin/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
      { label: 'Members', href: '/tenant-admin/members', icon: <Users className="w-4 h-4" /> },
      { label: 'Loans & Credit', href: '/tenant-admin/loans', icon: <Building2 className="w-4 h-4" /> },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Profile', href: '/tenant-admin/profile', icon: <User className="w-4 h-4" /> },
      { label: 'Settings', href: '/tenant-admin/settings', icon: <Settings className="w-4 h-4" /> },
    ],
  },
];

function TenantAdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const authUser = useAuthUser();
  return (
    <PortalShell
      portalName="Tenant Admin"
      portalBadgeColor="tenant-admin"
      navSections={navSections}
      user={{
        name: authUser?.fullName ?? 'Tenant Admin',
        role: authUser ? formatRoleLabel(authUser.role) : 'Tenant Administrator',
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
