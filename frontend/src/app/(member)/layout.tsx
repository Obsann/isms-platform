'use client';

import { useRouter } from 'next/navigation';
import PortalShell, { type NavSection } from '@/components/layout/PortalShell';
import PortalGuard from '@/components/auth/PortalGuard';
import { useAuthUser } from '@/components/auth/useAuthUser';
import { logout } from '@/lib/api-client';
import { useLang } from '@/components/i18n';
import { LayoutDashboard, Settings, User, Wallet, FileText, Landmark, Smartphone } from 'lucide-react';

const navSections: NavSection[] = [
  {
    label: 'nav.myAccount',
    items: [
      { label: 'nav.dashboard', href: '/member/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
      { label: 'nav.balance', href: '/member/balance', icon: <Wallet className="w-4 h-4" /> },
      { label: 'nav.statement', href: '/member/statement', icon: <FileText className="w-4 h-4" /> },
      { label: 'nav.memberLoans', href: '/member/loans', icon: <Landmark className="w-4 h-4" /> },
      { label: 'nav.mobileMoney', href: '/member/mobile-money', icon: <Smartphone className="w-4 h-4" /> },
      { label: 'nav.profile', href: '/member/profile', icon: <User className="w-4 h-4" /> },
      { label: 'nav.settings', href: '/member/settings', icon: <Settings className="w-4 h-4" /> },
    ],
  },
];

function MemberShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const authUser = useAuthUser();
  const { t } = useLang();
  return (
    <PortalShell
      portalName="portal.member"
      portalBadgeColor="member"
      navSections={navSections}
      user={{
        name: authUser?.fullName ?? t('portal.member'),
        role: authUser ? t(`role.${authUser.role}`) : t('portal.member'),
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
