import Link from 'next/link';
import { Mail, Phone } from 'lucide-react';
import BrandMark from '@/components/layout/BrandMark';
import { portalRootFromPath } from '@/lib/portal-paths';

function BulletLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link
        href={href}
        className="group flex items-center gap-2 text-[13px] text-slate-300 hover:text-gold transition-colors focus-visible:outline-none focus-visible:text-gold"
      >
        <span className="text-[8px] text-gold leading-none transition-transform group-hover:translate-x-0.5" aria-hidden="true">
          ▶
        </span>
        {label}
      </Link>
    </li>
  );
}

function BulletText({ label }: { label: string }) {
  return (
    <li className="flex items-center gap-2 text-[13px] text-slate-300">
      <span className="text-[8px] text-gold leading-none" aria-hidden="true">▶</span>
      {label}
    </li>
  );
}

function SocialIcon({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="w-8 h-8 rounded-lg border border-white/10 bg-midnight-light/40 text-slate-300 hover:text-gold hover:border-gold/40 flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:text-gold focus-visible:border-gold/40"
    >
      {children}
    </a>
  );
}

function FacebookGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
      <path d="M13.5 21v-7h2.3l.4-2.8h-2.7V9.4c0-.8.3-1.4 1.5-1.4h1.3V5.6c-.6-.1-1.4-.2-2.3-.2-2.3 0-3.8 1.4-3.8 3.9v1.9H8.3V14h2.1v7h3.1z" />
    </svg>
  );
}

function InstagramGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TelegramGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
      <path d="M20.6 4.6 3.3 11.3c-.7.3-.7 1.0 0 1.2l4.3 1.4 1.6 5.1c.2.5.8.6 1.2.2l2.4-2.2 4.3 3.2c.5.4 1.2.1 1.3-.5l3-14c.2-.8-.6-1.4-1.3-1.1zM9.5 13.2l8.4-5.2c.2-.1.4.1.2.3l-6.8 6.1-.3 3.2-1.5-4.4z" />
    </svg>
  );
}

export default function PortalFooter({ pathname }: { pathname: string }) {
  const portalRoot = portalRootFromPath(pathname);

  return (
    <footer className="relative bg-midnight text-slate-300">
      <div className="absolute -top-px left-0 right-0 h-8 overflow-hidden bg-surface" aria-hidden="true">
        <svg className="absolute bottom-0 w-full h-8 text-midnight" viewBox="0 0 1440 32" preserveAspectRatio="none">
          <path fill="currentColor" d="M0,32 C360,0 1080,0 1440,32 L1440,32 L0,32 Z" />
        </svg>
      </div>

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgb(216 177 56 / 0.55) 0.8px, transparent 0.9px)',
          backgroundSize: '16px 16px',
        }}
      />

      <div className="relative px-6 md:px-10 pt-10 pb-6 grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-10">
        <div className="sm:col-span-1">
          <div className="flex items-center gap-3 mb-3">
            <BrandMark size="sm" />
            <div className="leading-none">
              <p className="font-display text-[13px] font-bold text-white tracking-[0.14em] uppercase">ISMS</p>
              <p className="text-[9px] text-white/40 tracking-[0.16em] uppercase mt-1">Savings & Credit</p>
            </div>
          </div>
          <p className="text-[12px] text-slate-400 leading-relaxed max-w-xs">
            One ledger-backed system for SACCO savings, shares, and loans.
          </p>
          <div className="mt-4 flex items-center gap-2">
            <SocialIcon href="https://facebook.com" label="ISMS on Facebook">
              <FacebookGlyph />
            </SocialIcon>
            <SocialIcon href="https://instagram.com" label="ISMS on Instagram">
              <InstagramGlyph />
            </SocialIcon>
            <SocialIcon href="https://telegram.org" label="ISMS on Telegram">
              <TelegramGlyph />
            </SocialIcon>
          </div>
        </div>

        <div>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-gold mb-3">Quick Links</h2>
          {portalRoot ? (
            <ul className="flex flex-col gap-2">
              <BulletLink href={`${portalRoot}/dashboard`} label="Dashboard" />
              {(portalRoot === '/tenant-admin' || portalRoot === '/teller') && (
                <BulletLink href={`${portalRoot}/members`} label="Members" />
              )}
              {portalRoot === '/super-admin' && (
                <BulletLink href="/super-admin/tenants" label="Tenants" />
              )}
              <BulletLink href={`${portalRoot}/profile`} label="Profile" />
              <BulletLink href={`${portalRoot}/settings`} label="Settings" />
            </ul>
          ) : (
            <ul className="flex flex-col gap-2">
              <BulletLink href="/login" label="Sign in" />
              <BulletText label="Dashboard" />
              <BulletText label="Profile" />
              <BulletText label="Settings" />
            </ul>
          )}
        </div>

        <div>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-gold mb-3">Services</h2>
          <ul className="flex flex-col gap-2">
            <BulletText label="Savings accounts" />
            <BulletText label="Share capital" />
            <BulletText label="Loans & credit" />
          </ul>
        </div>
      </div>

      <div className="relative border-t border-white/10 px-6 md:px-10 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px] text-slate-500">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <a
            href="mailto:info@isms.et"
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-gold transition-colors focus-visible:outline-none focus-visible:text-gold"
          >
            <Mail className="w-3.5 h-3.5" aria-hidden="true" />
            info@isms.et
          </a>
          <a
            href="tel:+251111223344"
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-gold transition-colors focus-visible:outline-none focus-visible:text-gold"
          >
            <Phone className="w-3.5 h-3.5" aria-hidden="true" />
            +251 111 223 344
          </a>
        </div>
        <div className="flex items-center gap-4">
          <span>© 2026 ISMS Platform</span>
          <span className="uppercase tracking-[0.16em] text-[10px] text-slate-600">Web portal · Tenant-scoped</span>
        </div>
      </div>
    </footer>
  );
}
