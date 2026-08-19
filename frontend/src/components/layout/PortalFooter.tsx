import Link from 'next/link';
import { Clock, Globe, Landmark, MapPin } from 'lucide-react';
import BrandMark from '@/components/layout/BrandMark';
import { portalRootFromPath } from '@/lib/portal-paths';

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h2 className="text-sm font-semibold text-white tracking-wide">{children}</h2>
      <span className="mt-2 block h-0.5 w-9 rounded-full bg-gold" />
    </div>
  );
}

function BulletLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link
        href={href}
        className="group flex items-center gap-2.5 text-[13px] text-slate-300 hover:text-gold transition-colors focus-visible:outline-none focus-visible:text-gold"
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
    <li className="flex items-center gap-2.5 text-[13px] text-slate-300">
      <span className="text-[8px] text-gold leading-none" aria-hidden="true">▶</span>
      {label}
    </li>
  );
}

function ContactCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-midnight-light/40 border border-white/10 px-3.5 py-3">
      <span className="mt-0.5 w-8 h-8 rounded-lg bg-gold/15 text-gold flex items-center justify-center shrink-0">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wider text-gold">{title}</p>
        <p className="text-[12px] text-slate-300 leading-snug mt-0.5">{body}</p>
      </div>
    </div>
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
        className="pointer-events-none absolute inset-0 opacity-[0.1]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgb(216 177 56 / 0.55) 0.8px, transparent 0.9px)',
          backgroundSize: '16px 16px',
        }}
      />

      <div className="relative px-6 md:px-10 pt-12 pb-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8 xl:gap-10">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <BrandMark />
            <div className="leading-none">
              <p className="font-display text-[15px] font-bold text-white tracking-[0.14em] uppercase">ISMS</p>
              <p className="text-[9px] text-white/40 tracking-[0.16em] uppercase mt-1">Savings & Credit</p>
            </div>
          </div>
          <p className="text-[13px] text-slate-400 leading-relaxed max-w-xs">
            One ledger-backed system for SACCO savings, shares, and loans — for members, tellers, and administrators.
          </p>
        </div>

        <div>
          <FooterHeading>Quick Links</FooterHeading>
          {portalRoot ? (
            <ul className="flex flex-col gap-2.5">
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
            <ul className="flex flex-col gap-2.5">
              <BulletText label="Dashboard" />
              <BulletText label="Profile" />
              <BulletText label="Settings" />
            </ul>
          )}
        </div>

        <div>
          <FooterHeading>Our Services</FooterHeading>
          <ul className="flex flex-col gap-2.5">
            <BulletText label="Savings accounts" />
            <BulletText label="Share capital" />
            <BulletText label="Loans & credit" />
          </ul>
        </div>

        <div>
          <FooterHeading>Contact Info</FooterHeading>
          <div className="flex flex-col gap-2.5">
            <ContactCard
              icon={<MapPin className="w-4 h-4" />}
              title="Branch"
              body="In-branch deposits, withdrawals, and loan applications."
            />
            <ContactCard
              icon={<Landmark className="w-4 h-4" />}
              title="Staff"
              body="Teller and tenant-admin portals for day-to-day work."
            />
            <ContactCard
              icon={<Globe className="w-4 h-4" />}
              title="Members"
              body="Balance, statement request, and loan status on the web."
            />
            <ContactCard
              icon={<Clock className="w-4 h-4" />}
              title="Hours"
              body="During your SACCO’s posted working hours."
            />
          </div>
        </div>
      </div>

      <div className="relative border-t border-white/10 px-6 md:px-10 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-slate-500">
        <span>© 2026 ISMS Platform</span>
        <span className="uppercase tracking-[0.16em] text-[10px] text-slate-600">Web portal · Tenant-scoped</span>
      </div>
    </footer>
  );
}
