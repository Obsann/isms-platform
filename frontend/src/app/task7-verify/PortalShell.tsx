'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Menu, Search, Bell, Moon, Sun, X,
  HelpCircle, Settings, LogOut, User,
  ShieldAlert, CheckCircle2, Info,
} from 'lucide-react';

// ── Social Icons (inline SVG, no extra dep) ─────────────────────────────────
const IconInstagram = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);
const IconLinkedIn = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect x="2" y="9" width="4" height="12"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
);
const IconWhatsApp = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
  </svg>
);

// ── Chevron icons for collapse toggle ───────────────────────────────────────
const IconChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);
const IconChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

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
}) => {
  const pathname = usePathname();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const sections: NavSection[] = navSections ?? (navItems ? [{ items: navItems }] : []);
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

  const SidebarContent = ({ collapsed }: { collapsed: boolean }) => (
    <div className="flex flex-col h-full bg-[#122240] text-slate-300">

      {/* ── Brand bar (darker bg) with collapse toggle on the right ── */}
      <div className={cn(
        'bg-[#071021] border-b border-white/5 flex items-center',
        collapsed ? 'flex-col py-4 px-2 gap-3' : 'px-4 py-4 justify-between'
      )}>
        {/* Logo mark + name */}
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Icon box — always visible, never contains a letter */}
          <div className="w-8 h-8 rounded-lg bg-gold/15 border border-gold/25 flex items-center justify-center shrink-0">
            {/* Shield / brand icon — pure graphic, no text */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gold">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-none min-w-0">
              <span className="font-display text-[13px] font-bold text-white tracking-[0.2em] uppercase">SACCO</span>
              <span className="text-[8px] text-white/30 tracking-[0.12em] uppercase font-sans mt-0.5">Savings &amp; Credit</span>
            </div>
          )}
        </div>

        {/* Desktop collapse toggle — chevron only, no text */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex w-7 h-7 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <IconChevronRight /> : <IconChevronLeft />}
        </button>

        {/* Mobile close button */}
        <button
          onClick={() => setMobileSidebarOpen(false)}
          className="md:hidden w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
          aria-label="Close Sidebar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── Divider ── */}
      <div className="border-t border-white/10" />

      {/* ── Nav Sections ── */}
      <div className="flex-1 overflow-y-auto px-2 py-3 flex flex-col gap-3">
        {sections.map((section, si) => (
          <div key={si} className="flex flex-col gap-0.5">
            {section.label && !collapsed && (
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500 px-3 mb-1.5">{section.label}</p>
            )}
            {section.items.map((item, idx) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <React.Fragment key={item.href}>
                  {idx > 0 && (
                    <div className="border-t border-white/5 mx-2 my-0.5" />
                  )}
                  <Link
                    href={item.href}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={cn(
                      'flex items-center rounded-xl text-[13px] font-medium transition-all duration-150 group',
                      collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5',
                      isActive ? 'bg-white/10 text-gold shadow-sm' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    {item.icon && (
                      <span className={cn('shrink-0 transition-colors', isActive ? 'text-gold' : 'text-slate-500 group-hover:text-slate-300')}>
                        {item.icon}
                      </span>
                    )}
                    {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                    {!collapsed && isActive && <span className="w-1.5 h-1.5 rounded-full bg-gold shrink-0" />}
                  </Link>
                </React.Fragment>
              );
            })}
          </div>
        ))}
      </div>

      {/* ── Divider ── */}
      {user && <div className="border-t border-white/10" />}

      {/* ── User Card ── */}
      {user && (
        <div className={cn(
          'mx-2 mb-3 rounded-xl bg-white/5 border border-white/10 flex items-center transition-all duration-300',
          collapsed ? 'justify-center p-2' : 'p-3 gap-2.5'
        )}>
          <div className="w-8 h-8 rounded-full bg-gold text-midnight flex items-center justify-center font-bold text-[11px] shrink-0">
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-[12px] font-semibold text-white truncate">{user.name}</div>
              <div className="text-[10px] text-gold/60 capitalize truncate">{user.role}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className={cn('min-h-screen flex bg-surface text-slate-900', className)}>

      {/* Desktop Sidebar */}
      <aside className={cn(
        'bg-[#122240] fixed top-0 left-0 h-screen z-40 hidden md:flex flex-col shrink-0 border-r border-white/5 transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-16' : 'w-56'
      )}>
        <SidebarContent collapsed={isCollapsed} />
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />
          <div className="relative w-56 bg-[#122240] h-full shadow-2xl z-10">
            <SidebarContent collapsed={false} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={cn(
        'flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out',
        isCollapsed ? 'md:ml-16' : 'md:ml-56'
      )}>

        {/* Header */}
        <header className="h-16 bg-midnight px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 border-b border-white/5 shadow-elevated">
          {/* Left */}
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileSidebarOpen(true)} className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg" aria-label="Open sidebar">
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="font-display text-[13px] font-bold text-white tracking-[0.15em] uppercase hidden md:block">SACCO</span>
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
                      <Link
                        href={pathname.startsWith('/super-admin') ? '/super-admin/settings' : pathname.startsWith('/tenant-admin') ? '/tenant-admin/profile' : pathname.startsWith('/member') ? '/member/profile' : pathname.startsWith('/teller') ? '/teller/settings' : '#profile'}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <User className="w-3.5 h-3.5 text-slate-400" /> View Profile
                      </Link>
                      <Link
                        href={pathname.startsWith('/super-admin') ? '/super-admin/settings' : pathname.startsWith('/tenant-admin') ? '/tenant-admin/settings' : pathname.startsWith('/member') ? '/member/support' : pathname.startsWith('/teller') ? '/teller/settings' : '#settings'}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <Settings className="w-3.5 h-3.5 text-slate-400" /> Settings
                      </Link>
                    </div>
                    <div className="border-t border-slate-100 pt-1">
                      <button className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2">
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

        {/* Footer — single line with real social icons */}
        <footer className="h-10 border-t border-slate-200 bg-white px-6 flex items-center justify-center shrink-0">
          <div className="flex items-center gap-3 text-[10px] text-slate-400 uppercase tracking-widest">
            <span>© 2026 SACCO</span>
            <span className="text-slate-200">·</span>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-pink-500 transition-colors" aria-label="Instagram">
              <IconInstagram />
              <span>Instagram</span>
            </a>
            <span className="text-slate-200">·</span>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-blue-600 transition-colors" aria-label="LinkedIn">
              <IconLinkedIn />
              <span>LinkedIn</span>
            </a>
            <span className="text-slate-200">·</span>
            <a href="https://wa.me" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-green-500 transition-colors" aria-label="WhatsApp">
              <IconWhatsApp />
              <span>WhatsApp</span>
            </a>
            <span className="text-slate-200">·</span>
            <span>All rights reserved</span>
          </div>
        </footer>

      </div>
    </div>
  );
};

export default PortalShell;
