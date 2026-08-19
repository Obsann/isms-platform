'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Menu, Search, Bell, Moon, Sun, X, HelpCircle, Settings, LogOut, User, ShieldAlert, CheckCircle2, Info, Check } from 'lucide-react';

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
  onLogout,
}) => {
  const pathname = usePathname();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Build sections from either navSections or legacy navItems
  const sections: NavSection[] = navSections ?? (navItems ? [{ items: navItems }] : []);

  // Build flat list for active detection
  const allNavItems = sections.flatMap((s) => s.items);

  const initials = user?.name.split(' ').map((n) => n[0]).slice(0, 2).join('') ?? '??';
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfileMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-midnight text-slate-300">
      {/* Brand */}
      <div className="p-5 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gold/15 border border-gold/25 flex items-center justify-center shrink-0">
            <span className="font-display text-[9px] font-bold text-gold tracking-wider">ISMS</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display text-[13px] font-bold text-white tracking-[0.2em] uppercase">ISMS</span>
            <span className="text-[8px] text-white/30 tracking-[0.15em] uppercase font-sans mt-0.5">Savings & Credit</span>
          </div>
        </div>
        <button onClick={() => setMobileSidebarOpen(false)} className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors" aria-label="Close Sidebar">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-4">
        {sections.map((section, si) => (
          <div key={si}>
            {section.label && (
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500 px-3 mb-2">{section.label}</p>
            )}
            <div className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link key={item.href} href={item.href} onClick={() => setMobileSidebarOpen(false)}
                    className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 group',
                      isActive ? 'bg-white/10 text-gold shadow-sm' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    )}>
                    {item.icon && (
                      <span className={cn('shrink-0 transition-colors', isActive ? 'text-gold' : 'text-slate-500 group-hover:text-slate-300')}>
                        {item.icon}
                      </span>
                    )}
                    <span className="flex-1">{item.label}</span>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-gold shrink-0" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* User Card */}
      {user && (
        <div className="mx-3 mb-4 p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gold text-midnight flex items-center justify-center font-bold text-[11px] shrink-0">{initials}</div>
          <div className="min-w-0">
            <div className="text-[12px] font-semibold text-white truncate">{user.name}</div>
            <div className="text-[10px] text-gold/60 capitalize truncate">{user.role}</div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className={cn('min-h-screen flex bg-surface text-slate-900', className)}>
      {/* Desktop Sidebar */}
      <aside className="w-56 bg-midnight fixed top-0 left-0 h-screen z-40 hidden md:flex flex-col shrink-0 border-r border-white/5">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />
          <div className="relative w-56 bg-midnight h-full shadow-2xl z-10"><SidebarContent /></div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen md:ml-56">
        {/* Header */}
        <header className="h-16 bg-midnight px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 border-b border-white/5 shadow-elevated">
          {/* Left */}
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileSidebarOpen(true)} className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg" aria-label="Open sidebar">
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="font-display text-[13px] font-bold text-white tracking-[0.15em] uppercase hidden md:block">ISMS</span>
              <div className="w-px h-5 bg-white/10 hidden md:block" />
              <span className={cn('px-2.5 py-1 rounded-md text-[10px] font-bold tracking-widest uppercase', badgeMap[portalBadgeColor])}>
                {portalName}
              </span>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-1">
            {onOpenSearch && (
              <button onClick={onOpenSearch} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" aria-label="Search">
                <Search className="w-4 h-4" />
              </button>
            )}

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors relative" aria-label="Notifications">
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 ring-1 ring-midnight animate-pulse" />}
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-elevated z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-800">Notifications</h3>
                      {unreadCount > 0 && <span className="px-1.5 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-800">{unreadCount} new</span>}
                    </div>
                    {onMarkNotificationRead && (
                      <button onClick={() => notifications.forEach((n) => onMarkNotificationRead(n.id))} className="text-xs text-slate-500 hover:text-slate-800 font-semibold">Mark all read</button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-center text-xs text-slate-400">No notifications</p>
                    ) : notifications.map((item) => (
                      <div key={item.id} onClick={() => onMarkNotificationRead?.(item.id)}
                        className={cn('p-3 hover:bg-slate-50 cursor-pointer flex gap-3 transition-colors', !item.read && 'bg-amber-50/40')}>
                        <div className="mt-0.5 shrink-0">
                          {item.type === 'alert' && <ShieldAlert className="w-4 h-4 text-rose-500" />}
                          {item.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                          {item.type === 'info' && <Info className="w-4 h-4 text-amber-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={cn('text-xs font-semibold truncate', !item.read ? 'text-slate-900' : 'text-slate-700')}>{item.title}</p>
                            <span className="text-[10px] text-slate-400 shrink-0">{item.timestamp}</span>
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{item.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Dark Mode Toggle */}
            {onToggleDarkMode && (
              <button onClick={onToggleDarkMode} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" aria-label="Toggle theme">
                {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>
            )}

            {onOpenHelp && (
              <button onClick={onOpenHelp} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" aria-label="Help">
                <HelpCircle className="w-4 h-4" />
              </button>
            )}

            {/* User Avatar */}
            {user && (
              <div className="relative ml-1" ref={profileRef}>
                <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="w-8 h-8 rounded-full bg-gold text-midnight flex items-center justify-center font-bold text-[12px] hover:ring-2 hover:ring-gold/40 transition-all" aria-label="Profile">
                  {initials}
                </button>
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-2">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="font-bold text-sm text-slate-800">{user.name}</p>
                      <p className="text-xs text-amber-600 font-semibold">{user.role}</p>
                    </div>
                    <div className="py-1">
                      <button className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2" onClick={() => setShowProfileMenu(false)}>
                        <User className="w-3.5 h-3.5 text-slate-400" /> View Profile
                      </button>
                      <button className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2" onClick={() => setShowProfileMenu(false)}>
                        <Settings className="w-3.5 h-3.5 text-slate-400" /> Settings
                      </button>
                    </div>
                    <div className="border-t border-slate-100 pt-1">
                      <button
                        type="button"
                        className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                        onClick={() => {
                          setShowProfileMenu(false);
                          onLogout?.();
                        }}
                      >
                        <LogOut className="w-3.5 h-3.5" /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-surface p-6 md:p-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="h-10 border-t border-slate-200 bg-white px-6 flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-widest shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span>System Health: 100% Operational</span>
          </div>
          <div>© 2026 ISMS Platform v2.4.1</div>
        </footer>
      </div>
    </div>
  );
};

export default PortalShell;
