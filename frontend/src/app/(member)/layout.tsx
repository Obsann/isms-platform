'use client';

import { AppProvider, useApp } from '@/contexts/AppContext';
import PortalShell, { NavSection } from '@/components/layout/PortalShell';
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
  const { darkMode, toggleDarkMode, notifications, markNotificationRead, setHelpModalOpen, userProfile, members } = useApp();
  // Find the current member by email match
  const myMember = members.find((m) => m.email === userProfile.email) ?? members[0];
  return (
    <PortalShell
      portalName="Member"
      portalBadgeColor="member"
      navSections={navSections}
      user={{ name: myMember?.fullName ?? userProfile.name, role: `${myMember?.membershipType ?? 'Full'} Member` }}
      darkMode={darkMode}
      onToggleDarkMode={toggleDarkMode}
      notifications={notifications}
      onMarkNotificationRead={markNotificationRead}
      onOpenHelp={() => setHelpModalOpen(true)}
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
      <MemberShell>{children}</MemberShell>
    </AppProvider>
  );
}
