'use client';

import { useRouter } from 'next/navigation';
import { AppProvider, useApp } from '@/contexts/AppContext';
import PortalShell, { NavSection } from '@/components/layout/PortalShell';
import PortalGuard from '@/components/auth/PortalGuard';
import { formatRoleLabel, useAuthUser } from '@/components/auth/useAuthUser';
import { logout } from '@/lib/api-client';
import { GlobalToast, VendorDetailModal, QuickScanModal, SearchModal, HelpModal } from '@/components/ui/GlobalModals';
import {
  LayoutDashboard, ShieldCheck, AlertTriangle, Server,
  FileText, Settings, Users, Globe
} from 'lucide-react';

const navSections: NavSection[] = [
  {
    label: 'Platform Management',
    items: [
      { label: 'Overview', href: '/super-admin/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
      { label: 'All Tenants', href: '/super-admin/tenants', icon: <Globe className="w-4 h-4" /> },
      { label: 'All Members', href: '/super-admin/members', icon: <Users className="w-4 h-4" /> },
    ],
  },
  {
    label: 'Security Operations',
    items: [
      { label: 'Compliance', href: '/super-admin/compliance', icon: <ShieldCheck className="w-4 h-4" /> },
      { label: 'Risk Registry', href: '/super-admin/risk', icon: <AlertTriangle className="w-4 h-4" /> },
      { label: 'Assets', href: '/super-admin/assets', icon: <Server className="w-4 h-4" /> },
      { label: 'Audit Logs', href: '/super-admin/audit', icon: <FileText className="w-4 h-4" /> },
      { label: 'Settings', href: '/super-admin/settings', icon: <Settings className="w-4 h-4" /> },
    ],
  },
];

function SuperAdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const authUser = useAuthUser();
  const { darkMode, toggleDarkMode, notifications, markNotificationRead, setSearchModalOpen, setHelpModalOpen, userProfile } = useApp();
  return (
    <PortalShell
      portalName="Super Admin"
      portalBadgeColor="super-admin"
      navSections={navSections}
      user={{ name: authUser?.fullName ?? userProfile.name, role: authUser ? formatRoleLabel(authUser.role) : 'Platform Administrator' }}
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

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <PortalGuard portal="super-admin">
        <SuperAdminShell>{children}</SuperAdminShell>
      </PortalGuard>
    </AppProvider>
  );
}
