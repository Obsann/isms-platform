'use client';

import { useRouter } from 'next/navigation';
import { AppProvider, useApp } from '@/contexts/AppContext';
import PortalShell, { NavSection } from '@/components/layout/PortalShell';
import PortalGuard from '@/components/auth/PortalGuard';
import { formatRoleLabel, useAuthUser } from '@/components/auth/useAuthUser';
import { logout } from '@/lib/api-client';
import { GlobalToast, VendorDetailModal, QuickScanModal, SearchModal, HelpModal } from '@/components/ui/GlobalModals';
import {
  LayoutDashboard, Users, ShieldCheck, AlertTriangle, Server,
  FileText, Settings, HelpCircle, User
} from 'lucide-react';

const navSections: NavSection[] = [
  {
    label: 'Main Navigation',
    items: [
      { label: 'Dashboard', href: '/tenant-admin/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
      { label: 'Members', href: '/tenant-admin/members', icon: <Users className="w-4 h-4" /> },
    ],
  },
  {
    label: 'Security & Compliance',
    items: [
      { label: 'Compliance', href: '/tenant-admin/compliance', icon: <ShieldCheck className="w-4 h-4" /> },
      { label: 'Risk Registry', href: '/tenant-admin/risk', icon: <AlertTriangle className="w-4 h-4" /> },
      { label: 'Assets', href: '/tenant-admin/assets', icon: <Server className="w-4 h-4" /> },
      { label: 'Audit Logs', href: '/tenant-admin/audit', icon: <FileText className="w-4 h-4" /> },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Settings', href: '/tenant-admin/settings', icon: <Settings className="w-4 h-4" /> },
      { label: 'Support', href: '/tenant-admin/support', icon: <HelpCircle className="w-4 h-4" /> },
      { label: 'Profile', href: '/tenant-admin/profile', icon: <User className="w-4 h-4" /> },
    ],
  },
];

function TenantAdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const authUser = useAuthUser();
  const { darkMode, toggleDarkMode, notifications, markNotificationRead, setSearchModalOpen, setHelpModalOpen, userProfile } = useApp();
  return (
    <PortalShell
      portalName="Tenant Admin"
      portalBadgeColor="tenant-admin"
      navSections={navSections}
      user={{ name: authUser?.fullName ?? userProfile.name, role: authUser ? formatRoleLabel(authUser.role) : userProfile.role }}
      darkMode={darkMode}
      onToggleDarkMode={toggleDarkMode}
      notifications={notifications}
      onMarkNotificationRead={markNotificationRead}
      onOpenSearch={() => setSearchModalOpen(true)}
      onOpenHelp={() => setHelpModalOpen(true)}
      onLogout={() => {
        logout();
        router.replace('/login');
      }}
    >
      {children}
      <GlobalToast />
      <VendorDetailModal />
      <QuickScanModal />
      <SearchModal />
      <HelpModal />
    </PortalShell>
  );
}

export default function TenantAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <PortalGuard portal="tenant-admin">
        <TenantAdminShell>{children}</TenantAdminShell>
      </PortalGuard>
    </AppProvider>
  );
}
