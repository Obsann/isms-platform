'use client';

import { useRouter } from 'next/navigation';
import { AppProvider, useApp } from '@/contexts/AppContext';
import PortalShell, { NavSection } from '@/components/layout/PortalShell';
import PortalGuard from '@/components/auth/PortalGuard';
import { formatRoleLabel, useAuthUser } from '@/components/auth/useAuthUser';
import { logout } from '@/lib/api-client';
import { GlobalToast, HelpModal } from '@/components/ui/GlobalModals';
import { LayoutDashboard, User, HelpCircle } from 'lucide-react';

const navSections: NavSection[] = [
  {
    label: 'My Account',
    items: [
      { label: 'My Dashboard', href: '/member/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
      { label: 'My Profile', href: '/member/profile', icon: <User className="w-4 h-4" /> },
      { label: 'Support', href: '/member/support', icon: <HelpCircle className="w-4 h-4" /> },
    ],
  },
];

function MemberShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const authUser = useAuthUser();
  const { darkMode, toggleDarkMode, notifications, markNotificationRead, setHelpModalOpen, userProfile, members } = useApp();
  // Find the current member by email match
  const myMember = members.find((m) => m.email === (authUser?.email ?? userProfile.email)) ?? members[0];
  return (
    <PortalShell
      portalName="Member"
      portalBadgeColor="member"
      navSections={navSections}
      user={{
        name: authUser?.fullName ?? myMember?.fullName ?? userProfile.name,
        role: authUser ? formatRoleLabel(authUser.role) : `${myMember?.membershipType ?? 'Full'} Member`,
      }}
      darkMode={darkMode}
      onToggleDarkMode={toggleDarkMode}
      notifications={notifications}
      onMarkNotificationRead={markNotificationRead}
      onOpenHelp={() => setHelpModalOpen(true)}
      onLogout={() => {
        logout();
        router.replace('/login');
      }}
    >
      {children}
      <GlobalToast />
      <HelpModal />
    </PortalShell>
  );
}

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <PortalGuard portal="member">
        <MemberShell>{children}</MemberShell>
      </PortalGuard>
    </AppProvider>
  );
}
