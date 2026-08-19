"use client";

import React from "react";
import PortalShell from "@/components/layout/PortalShell";
import StatusBadge from "@/components/badges/StatusBadge";
import CurrencyDisplay from "@/components/currency/CurrencyDisplay";
import FormFieldGroup from "@/components/forms/FormFieldGroup";
import DataTable from "@/components/tables/DataTable";

const IconUsers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IconWallet = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 12V8H6a2 2 0 0 1 0-4h14v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/>
    <circle cx="17" cy="12" r="1" fill="currentColor"/>
  </svg>
);
const IconTrend = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
  </svg>
);
const IconShield = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

function KpiCard({
  label, value, sub, icon, variant = "light",
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon: React.ReactNode;
  variant?: "light" | "dark";
}) {
  if (variant === "dark") {
    return (
      <div className="relative rounded-2xl p-6 bg-midnight border border-gold/15 shadow-elevated overflow-hidden flex flex-col gap-4">
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-gold/10 blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-gold/60">{label}</span>
          <span className="w-9 h-9 rounded-xl bg-gold/10 text-gold flex items-center justify-center">{icon}</span>
        </div>
        <div className="text-2xl font-semibold text-white leading-none">{value}</div>
        {sub && <span className="text-[11px] text-gold/40 font-medium">{sub}</span>}
      </div>
    );
  }
  return (
    <div className="relative rounded-2xl p-6 bg-white border border-slate-200/80 shadow-card overflow-hidden flex flex-col gap-4">
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-slate-50 pointer-events-none" />
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{label}</span>
        <span className="w-9 h-9 rounded-xl bg-midnight/5 text-midnight flex items-center justify-center">{icon}</span>
      </div>
      <div className="text-2xl font-semibold text-slate-900 leading-none">{value}</div>
      {sub && <span className="text-[11px] text-slate-400 font-medium">{sub}</span>}
    </div>
  );
}

function Section({ index, title, description, children, id }: {
  index: number; title: string; description?: string; children: React.ReactNode; id?: string;
}) {
  return (
    <div id={id} className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden scroll-mt-24">
      <div className="px-7 py-5 border-b border-slate-100 flex items-start gap-4">
        <span className="mt-0.5 w-7 h-7 rounded-lg bg-midnight text-gold text-[11px] font-bold flex items-center justify-center shrink-0 shadow-sm">
          {index}
        </span>
        <div>
          <h2 className="text-sm font-bold text-slate-800 tracking-tight">{title}</h2>
          {description && <p className="text-[12px] text-slate-400 mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="px-7 py-6">{children}</div>
    </div>
  );
}

export default function Task7VerifyPage() {
  const members = [
    { id: "M-001", name: "Abebe Bikila",     idType: "national_id", balance: "45230.00",  status: "active"   as const },
    { id: "M-002", name: "Tigist Assefa",    idType: "passport",    balance: "128500.50", status: "pending"  as const },
    { id: "M-003", name: "Mulugeta Seretse", idType: "other",       balance: "0.00",      status: "inactive" as const },
    { id: "M-004", name: "Hirut Bekele",     idType: "national_id", balance: "892100.00", status: "approved" as const },
  ];

  const columns = [
    {
      key: "id",
      header: "Member ID",
      render: (r: (typeof members)[0]) => (
        <span className="font-mono text-[12px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded">{r.id}</span>
      ),
    },
    {
      key: "name",
      header: "Full Name",
      render: (r: (typeof members)[0]) => (
        <span className="font-medium text-slate-800">{r.name}</span>
      ),
    },
    {
      key: "idType",
      header: "ID Type",
      render: (r: (typeof members)[0]) => (
        <span className="text-[12px] text-slate-600 capitalize">{r.idType.replace("_", " ")}</span>
      ),
    },
    {
      key: "balance",
      header: "Savings Balance",
      render: (r: (typeof members)[0]) => (
        <CurrencyDisplay value={r.balance} variant="gold" className="text-[13px]" />
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r: (typeof members)[0]) => <StatusBadge status={r.status} />,
    },
  ];

  return (
    <PortalShell
      portalName="Design System"
      portalBadgeColor="tenant-admin"
      user={{ name: "Liya Fitsum", role: "UI / Design Engineer" }}
      navItems={[
        { label: "Overview",     href: "/task7-verify#overview",     icon: <IconShield /> },
        { label: "Members",      href: "/task7-verify#members",      icon: <IconUsers /> },
        { label: "Transactions", href: "/task7-verify#transactions", icon: <IconWallet /> },
        { label: "Reports",      href: "/task7-verify#reports",      icon: <IconTrend /> },
      ]}
    >
      <div className="max-w-5xl space-y-7">

        <div className="relative rounded-2xl overflow-hidden bg-midnight px-8 py-8 shadow-elevated">
          <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-gold/8 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-40 h-40 rounded-full bg-midnight-light/40 blur-2xl pointer-events-none" />

          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold/60 mb-2">
                Task 7 · Shared UI Kit
              </p>
              <h1 className="font-display text-2xl font-bold text-white tracking-wide leading-snug">
                Design System Verification
              </h1>
              <p className="text-[13px] text-white/40 mt-2 max-w-md leading-relaxed">
                All five foundation components — badges, currency, forms, table, and shell — using generic SACCO sample data.
              </p>
            </div>
            <div className="hidden md:flex flex-col items-end gap-2">
              <StatusBadge status="completed" label="All Components Ready" />
              <span className="text-[10px] text-white/30 tracking-wider">ISMS Platform v0.1</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Total Members"   value="1,284"  sub="↑ 12 this month"     icon={<IconUsers />} />
          <KpiCard label="Total Savings"   value={<CurrencyDisplay value="4820500.00" className="text-2xl text-slate-900" />} sub="Across all accounts" icon={<IconWallet />} />
          <KpiCard label="Active Loans"    value="347"    sub="23 pending approval"  icon={<IconTrend />} />
          <KpiCard label="Portfolio Value" value={<CurrencyDisplay value="12650000.00" variant="gold" className="text-2xl" />} sub="As of today" icon={<IconShield />} variant="dark" />
        </div>

        <Section index={1} id="overview" title="Status Badges" description="Pill badges used across member, loan, and transaction states.">
          <div className="flex flex-wrap gap-3">
            <StatusBadge status="active" />
            <StatusBadge status="approved" />
            <StatusBadge status="completed" />
            <StatusBadge status="pending" />
            <StatusBadge status="rejected" />
            <StatusBadge status="inactive" />
          </div>
        </Section>

        <Section index={2} title="Currency Display" description="Always full, unabbreviated figures. Never 45.2K — always 45,230.00 ETB.">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl p-5 bg-slate-50 border border-slate-100 flex flex-col gap-2">
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Standard</span>
              <CurrencyDisplay value="45230.00" className="text-xl text-slate-900" />
            </div>
            <div className="rounded-xl p-5 bg-gold-muted border border-amber-100 flex flex-col gap-2">
              <span className="text-[10px] uppercase tracking-widest text-amber-600/60 font-bold">Gold Variant</span>
              <CurrencyDisplay value="1250999.75" variant="gold" className="text-xl" />
            </div>
            <div className="rounded-xl p-5 bg-midnight border border-gold/15 flex flex-col gap-2">
              <span className="text-[10px] uppercase tracking-widest text-gold/50 font-bold">Navy Variant</span>
              <CurrencyDisplay value="500000.00" variant="navy" className="text-xl" />
            </div>
          </div>
        </Section>

        <Section index={3} id="transactions" title="Form Field Group" description="Shared inputs with required markers, helper text, and inline error states. ID is a stored field pair — no live verification.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormFieldGroup label="Full Name" required helperText="Enter the member's full legal name">
              <input type="text" placeholder="Abebe Bikila" />
            </FormFieldGroup>
            <FormFieldGroup label="National ID" required error="National ID is required">
              <input type="text" placeholder="ID number as typed by staff" />
            </FormFieldGroup>
            <FormFieldGroup label="ID Type" required helperText="national_id, passport, or other">
              <select defaultValue="national_id">
                <option value="national_id">National ID</option>
                <option value="passport">Passport</option>
                <option value="other">Other</option>
              </select>
            </FormFieldGroup>
            <FormFieldGroup label="Account Type">
              <input type="text" placeholder="Savings" readOnly />
            </FormFieldGroup>
          </div>
        </Section>

        <Section index={4} id="members" title="Data Table" description="Shared member table with midnight header, gold column labels, and hover states.">
          <DataTable columns={columns} data={members} />
        </Section>

        <Section index={5} id="reports" title="Portal Shell Layout" description="The full-page shell wrapping every portal — header, sidebar, and content area.">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(["super-admin", "tenant-admin", "teller", "member"] as const).map((role) => (
              <div key={role} className="rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="h-9 bg-midnight flex items-center px-3 gap-2">
                  <span className="text-[9px] font-bold text-white tracking-widest uppercase font-display">ISMS</span>
                  <span className="w-px h-4 bg-gold/20" />
                  <span className="text-[8px] font-bold uppercase tracking-widest text-gold/70 bg-gold/10 px-2 py-0.5 rounded">
                    {role.replace("-", " ")}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 text-[11px] text-slate-500 capitalize font-medium">
                  {role.replace("-", " ")} portal
                </div>
              </div>
            ))}
          </div>
        </Section>

      </div>
    </PortalShell>
  );
}
