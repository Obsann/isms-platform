'use client';

import { useRouter } from 'next/navigation';
import { AppProvider, useApp } from '@/contexts/AppContext';
import PortalShell, { NavSection } from '@/components/layout/PortalShell';
import PortalGuard from '@/components/auth/PortalGuard';
import { formatRoleLabel, useAuthUser } from '@/components/auth/useAuthUser';
import { logout } from '@/lib/api-client';
import { GlobalToast, SearchModal, HelpModal } from '@/components/ui/GlobalModals';
import { LayoutDashboard, Users, FileText, Settings } from 'lucide-react';

const navSections: NavSection[] = [
  {
    label: 'Teller Operations',
    items: [
      { label: 'Dashboard', href: '/teller/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
      { label: 'Members', href: '/teller/members', icon: <Users className="w-4 h-4" /> },
      { label: 'Audit Logs', href: '/teller/audit', icon: <FileText className="w-4 h-4" /> },
      { label: 'Settings', href: '/teller/settings', icon: <Settings className="w-4 h-4" /> },
    ],
  },
];

function TellerShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const authUser = useAuthUser();
  const { darkMode, toggleDarkMode, notifications, markNotificationRead, setSearchModalOpen, setHelpModalOpen, userProfile } = useApp();
  return (
    <PortalShell
      portalName="Teller"
      portalBadgeColor="teller"
      navSections={navSections}
      user={{ name: authUser?.fullName ?? userProfile.name, role: authUser ? formatRoleLabel(authUser.role) : 'Teller' }}
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
      <SearchModal />
      <HelpModal />
    </PortalShell>
  );
}

export default function TellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <PortalGuard portal="teller">
        <TellerShell>{children}</TellerShell>
      </PortalGuard>
    </AppProvider>
  );
}
