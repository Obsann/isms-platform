import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  active?: boolean;
}

export interface PortalShellProps {
  portalName: string;
  portalBadgeColor?: "super-admin" | "tenant-admin" | "teller" | "member";
  navItems?: NavItem[];
  user?: { name: string; role: string };
  children: React.ReactNode;
  className?: string;
}

const badgeMap: Record<string, string> = {
  "super-admin":  "bg-gold/15 text-gold border border-gold/25",
  "tenant-admin": "bg-gold/15 text-gold border border-gold/25",
  teller:         "bg-gold-dark/20 text-gold-light border border-gold-dark/30",
  member:         "bg-gold-light/15 text-gold-light border border-gold-light/25",
};

export const PortalShell: React.FC<PortalShellProps> = ({
  portalName,
  portalBadgeColor = "tenant-admin",
  navItems = [],
  user,
  children,
  className,
}) => {
  const initials = user
    ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("")
    : "?";

  return (
    <div className={cn("min-h-screen flex flex-col bg-surface text-slate-900", className)}>

      {/* ── Header ── */}
      <header className="h-16 bg-midnight px-6 flex items-center justify-between sticky top-0 z-30 border-b border-white/5 shadow-elevated">

        {/* Left: brand + portal badge */}
        <div className="flex items-center gap-4">
          {/* Logo mark */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gold/15 border border-gold/25 flex items-center justify-center shrink-0">
              <span className="font-display text-[9px] font-bold text-gold tracking-wider">ISMS</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display text-[13px] font-bold text-white tracking-[0.2em] uppercase">
                ISMS
              </span>
              <span className="text-[8px] text-white/30 tracking-[0.15em] uppercase font-sans mt-0.5">
                Savings &amp; Credit
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-white/10" />

          {/* Portal badge */}
          <span className={cn("px-2.5 py-1 rounded-md text-[10px] font-bold tracking-widest uppercase", badgeMap[portalBadgeColor])}>
            {portalName}
          </span>
        </div>

        {/* Right: user */}
        {user && (
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-[13px] font-semibold text-white leading-tight">{user.name}</div>
              <div className="text-[10px] text-white/35 capitalize tracking-wide mt-0.5">{user.role}</div>
            </div>
            <div className="w-9 h-9 rounded-full bg-gold text-midnight flex items-center justify-center font-bold text-[13px] ring-2 ring-gold/30 shrink-0">
              {initials}
            </div>
          </div>
        )}
      </header>

      {/* ── Body ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Sidebar */}
        {navItems.length > 0 && (
          <aside className="w-56 bg-white border-r border-slate-200/60 flex flex-col shrink-0">

            {/* Nav items */}
            <nav className="flex-1 px-3 pt-6 pb-4 flex flex-col gap-0.5">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 px-3 mb-3">
                Navigation
              </p>
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 group",
                    item.active
                      ? "bg-midnight text-gold shadow-sm"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  )}
                >
                  {item.icon && (
                    <span className={cn("shrink-0 transition-colors", item.active ? "text-gold" : "text-slate-400 group-hover:text-slate-600")}>
                      {item.icon}
                    </span>
                  )}
                  <span className="flex-1">{item.label}</span>
                  {item.active && (
                    <span className="w-1.5 h-1.5 rounded-full bg-gold shrink-0" />
                  )}
                </Link>
              ))}
            </nav>

            {/* Bottom user card */}
            {user && (
              <div className="mx-3 mb-4 p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-midnight text-gold flex items-center justify-center font-bold text-[11px] shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <div className="text-[12px] font-semibold text-slate-800 truncate">{user.name}</div>
                  <div className="text-[10px] text-slate-400 capitalize truncate">{user.role}</div>
                </div>
              </div>
            )}
          </aside>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-surface p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default PortalShell;
