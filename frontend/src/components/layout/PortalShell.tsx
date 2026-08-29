'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import BrandMark from '@/components/layout/BrandMark';
import PortalFooter from '@/components/layout/PortalFooter';
import { useTheme } from '@/components/theme/ThemeProvider';
import { isNavActive, portalDashboardHref, portalRootFromPath } from '@/lib/portal-paths';
import { Menu, Search, Bell, Moon, Sun, X, HelpCircle, Settings, LogOut, User, ShieldAlert, CheckCircle2, Info } from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

export interface NavSection {
  label?: string;
  items: NavItem[];
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'alert' | 'info' | 'success';
}

export interface PortalShellProps {
  portalName: string;
  portalBadgeColor?: 'super-admin' | 'tenant-admin' | 'teller' | 'member';
  navSections?: NavSection[];
  /** @deprecated use navSections instead */
  navItems?: NavItem[];
  user?: { name: string; role: string };
  children: React.ReactNode;
  className?: string;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  notifications?: NotificationItem[];
  onMarkNotificationRead?: (id: string) => void;
  onOpenSearch?: () => void;
  onOpenHelp?: () => void;
  onViewProfile?: () => void;
  onOpenSettings?: () => void;
  onLogout?: () => void;
}

const badgeMap: Record<string, string> = {
  'super-admin': 'bg-gold/15 text-gold border border-gold/25',
  'tenant-admin': 'bg-gold/15 text-gold border border-gold/25',
  teller: 'bg-gold-dark/20 text-gold-light border border-gold-dark/30',
  member: 'bg-gold-light/15 text-gold-light border border-gold-light/25',
};

export const PortalShell: React.FC<PortalShellProps> = ({
  portalName,
  portalBadgeColor = 'tenant-admin',
  navSections,
  navItems,
  user,
  children,
  className,
  darkMode = false,
  onToggleDarkMode,
  notifications = [],
  onMarkNotificationRead,
  onOpenSearch,
  onOpenHelp,
  onViewProfile,
  onOpenSettings,
  onLogout,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const portalRoot = portalRootFromPath(pathname);
  const homeHref = portalDashboardHref(pathname) ?? '/';
  const [hash, setHash] = useState('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const sections: NavSection[] = navSections ?? (navItems ? [{ items: navItems }] : []);
  const allNavItems = sections.flatMap((s) => s.items);
  const currentPage = [...allNavItems].reverse().find((item) => isNavActive(pathname, item.href, hash));

  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = darkMode ?? (resolvedTheme === 'dark');

  const initials = user?.name.split(' ').map((n) => n[0]).slice(0, 2).join('') ?? '??';
  const unreadCount = notifications.filter((n) => !n.read).length;
  const canGoProfile = Boolean(onViewProfile || portalRoot);
  const canGoSettings = Boolean(onOpenSettings || portalRoot);

  useEffect(() => {
    const syncHash = () => setHash(window.location.hash);
    syncHash();
    window.addEventListener('hashchange', syncHash);
    return () => window.removeEventListener('hashchange', syncHash);
  }, [pathname]);

  useEffect(() => {
    setMobileSidebarOpen(false);
    setShowNotifications(false);
    setShowProfileMenu(false);
  }, [pathname]);

  useEffect(() => {
    const onPointer = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfileMenu(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setShowNotifications(false);
      setShowProfileMenu(false);
      setMobileSidebarOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => {
    if (!mobileSidebarOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileSidebarOpen]);

  const goProfile = () => {
    setShowProfileMenu(false);
    if (onViewProfile) {
      onViewProfile();
      return;
    }
    if (portalRoot) router.push(`${portalRoot}/profile`);
  };

  const goSettings = () => {
    setShowProfileMenu(false);
    if (onOpenSettings) {
      onOpenSettings();
      return;
    }
    if (portalRoot) router.push(`${portalRoot}/settings`);
  };

  const renderSidebar = () => (
    <div className="flex flex-col h-full bg-midnight text-slate-300">
      <div className="p-5 flex items-center justify-between border-b border-white/5">
        <Link href={homeHref} className="flex items-center gap-2.5 min-w-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60">
          <BrandMark size="sm" />
          <div className="flex flex-col leading-none min-w-0">
            <span className="font-display text-[13px] font-bold text-white tracking-[0.2em] uppercase">ISMS</span>
            <span className="text-[8px] text-white/30 tracking-[0.15em] uppercase font-sans mt-0.5">Savings & Credit</span>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(false)}
          className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-5" aria-label={`${portalName} navigation`}>
        {sections.map((section, si) => (
          <div key={si}>
            {section.label && (
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500 px-3 mb-2">{section.label}</p>
            )}
            <div className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const active = isNavActive(pathname, item.href, hash);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileSidebarOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60',
                      active ? 'bg-white/10 text-gold shadow-sm' : 'text-slate-400 hover:bg-white/5 hover:text-white',
                    )}
                  >
                    {item.icon && (
                      <span className={cn('shrink-0 transition-colors', active ? 'text-gold' : 'text-slate-500 group-hover:text-slate-300')}>
                        {item.icon}
                      </span>
                    )}
                    <span className="flex-1 truncate">{item.label}</span>
                    {active && <span className="w-1.5 h-1.5 rounded-full bg-gold shrink-0" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {user && (
        <button
          type="button"
          onClick={goProfile}
          className="mx-3 mb-4 p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2.5 text-left hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
        >
          <div className="w-8 h-8 rounded-full bg-gold text-midnight flex items-center justify-center font-bold text-[11px] shrink-0">{initials}</div>
          <div className="min-w-0">
            <div className="text-[12px] font-semibold text-white truncate">{user.name}</div>
            <div className="text-[10px] text-gold/70 truncate">{user.role}</div>
          </div>
        </button>
      )}
    </div>
  );

  return (
    <div className={cn('min-h-screen flex bg-surface text-slate-900 dark:text-slate-100', className)}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-gold focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-midnight"
      >
        Skip to content
      </a>

      <aside className="w-60 bg-midnight fixed top-0 left-0 h-screen z-40 hidden md:flex flex-col shrink-0 border-r border-white/5">
        {renderSidebar()}
      </aside>

      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />
          <div className="relative w-60 bg-midnight h-full shadow-2xl z-10">{renderSidebar()}</div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-h-screen min-w-0 md:ml-60">
        <header className="h-16 bg-midnight px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 border-b border-white/5">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5 min-w-0">
              <span className={cn('px-2.5 py-1 rounded-md text-[10px] font-bold tracking-widest uppercase shrink-0', badgeMap[portalBadgeColor])}>
                {portalName}
              </span>
              {currentPage && (
                <>
                  <span className="text-white/20 hidden sm:inline" aria-hidden="true">/</span>
                  <span className="text-sm text-white/80 font-medium truncate hidden sm:inline">{currentPage.label}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {onOpenSearch && (
              <button
                type="button"
                onClick={onOpenSearch}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
                aria-label="Search"
              >
                <Search className="w-4 h-4" />
              </button>
            )}

            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => {
                  setShowNotifications((open) => !open);
                  setShowProfileMenu(false);
                }}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
                aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
                aria-expanded={showNotifications}
                aria-haspopup="true"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 ring-1 ring-midnight" />}
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-elevated z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                    <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Notifications</h3>
                    {onMarkNotificationRead && unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={() => notifications.forEach((n) => onMarkNotificationRead(n.id))}
                        className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-semibold"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-10 text-center">
                        <Bell className="w-5 h-5 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">You’re all caught up</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">New alerts will show up here.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {notifications.map((item) => (
                          <button
                            type="button"
                            key={item.id}
                            onClick={() => onMarkNotificationRead?.(item.id)}
                            className={cn('w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex gap-3 transition-colors', !item.read && 'bg-amber-50/40 dark:bg-amber-950/20')}
                          >
                            <div className="mt-0.5 shrink-0">
                              {item.type === 'alert' && <ShieldAlert className="w-4 h-4 text-rose-500" />}
                              {item.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                              {item.type === 'info' && <Info className="w-4 h-4 text-amber-500" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className={cn('text-xs font-semibold truncate', !item.read ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300')}>{item.title}</p>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">{item.timestamp}</span>
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">{item.message}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onToggleDarkMode ?? toggleTheme}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
              aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {onOpenHelp && (
              <button
                type="button"
                onClick={onOpenHelp}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
                aria-label="Help"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            )}

            {user && (
              <div className="relative ml-1" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu((open) => !open);
                    setShowNotifications(false);
                  }}
                  className="w-8 h-8 rounded-full bg-gold text-midnight flex items-center justify-center font-bold text-[12px] hover:ring-2 hover:ring-gold/40 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                  aria-label="Account menu"
                  aria-expanded={showProfileMenu}
                  aria-haspopup="true"
                >
                  {initials}
                </button>
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 py-2">
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                      <p className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">{user.name}</p>
                      <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold truncate">{user.role}</p>
                    </div>
                    {(canGoProfile || canGoSettings) && (
                      <div className="py-1">
                        {canGoProfile && (
                          <button
                            type="button"
                            className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2"
                            onClick={goProfile}
                          >
                            <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> View Profile
                          </button>
                        )}
                        {canGoSettings && (
                          <button
                            type="button"
                            className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2"
                            onClick={goSettings}
                          >
                            <Settings className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> Settings
                          </button>
                        )}
                      </div>
                    )}
                    {onLogout && (
                      <div className="border-t border-slate-100 dark:border-slate-800 pt-1">
                        <button
                          type="button"
                          className="w-full text-left px-4 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2"
                          onClick={() => {
                            setShowProfileMenu(false);
                            onLogout();
                          }}
                        >
                          <LogOut className="w-3.5 h-3.5" /> Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        <main id="main-content" className="flex-1 overflow-y-auto bg-surface flex flex-col">
          <div className="flex-1 p-4 sm:p-5 lg:p-6 flex flex-col max-w-7xl w-full mx-auto">
            {children}
          </div>
          <PortalFooter pathname={pathname} />
        </main>
      </div>
    </div>
  );
};

export default PortalShell;
