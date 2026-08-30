'use client';

import { useRouter } from 'next/navigation';
import PortalShell, { type NavSection } from '@/components/layout/PortalShell';
import PortalGuard from '@/components/auth/PortalGuard';
import { formatRoleLabel, useAuthUser } from '@/components/auth/useAuthUser';
import { logout } from '@/lib/api-client';
import { LayoutDashboard, Settings, User, Wallet, FileText, Landmark, Smartphone } from 'lucide-react';

const navSections: NavSection[] = [
  {
    label: 'My account',
    items: [
      { label: 'Dashboard', href: '/member/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
      { label: 'Balance', href: '/member/balance', icon: <Wallet className="w-4 h-4" /> },
      { label: 'Statement', href: '/member/statement', icon: <FileText className="w-4 h-4" /> },
      { label: 'Loans', href: '/member/loans', icon: <Landmark className="w-4 h-4" /> },
      { label: 'Mobile money', href: '/member/mobile-money', icon: <Smartphone className="w-4 h-4" /> },
      { label: 'Profile', href: '/member/profile', icon: <User className="w-4 h-4" /> },
      { label: 'Settings', href: '/member/settings', icon: <Settings className="w-4 h-4" /> },
    ],
  },
];

function MemberShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const authUser = useAuthUser();
  return (
    <PortalShell
      portalName="Member"
      portalBadgeColor="member"
      navSections={navSections}
      user={{
        name: authUser?.fullName ?? 'Member',
        role: authUser ? formatRoleLabel(authUser.role) : 'Member',
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

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalGuard portal="member">
      <MemberShell>{children}</MemberShell>
    </PortalGuard>
  );
}
