import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sacco ISMS Platform — Home",
  description: "Navigate to your portal on the Sacco ISMS Platform.",
};

const portals = [
  {
    href: "/super-admin/dashboard",
    label: "Super Admin",
    description: "Platform-level administration, security and configuration",
    badge: "Super Admin",
    badgeBg: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  },
  {
    href: "/tenant-admin/dashboard",
    label: "Tenant Admin",
    description: "SACCO branch management, audit logs, and member oversight",
    badge: "Tenant Admin",
    badgeBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  },
  {
    href: "/teller/dashboard",
    label: "Teller",
    description: "Daily transactions, deposits, withdrawals, and counter ops",
    badge: "Teller",
    badgeBg: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  },
  {
    href: "/member/dashboard",
    label: "Member",
    description: "Self-service account, savings, loans, and profile management",
    badge: "Member",
    badgeBg: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  },
  {
    href: "/task7-verify",
    label: "Task 7 UI Verification",
    description: "Full interactive Figma-designed UI kit & dashboard showcase",
    badge: "UI Showcase",
    badgeBg: "bg-sky-500/10 text-sky-400 border-sky-500/30",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#18191d] text-[#e2e8f0] flex flex-col justify-between p-6 sm:p-12">
      <div className="max-w-4xl mx-auto w-full space-y-8 my-auto">
        {/* Brand Header */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-sky-500 to-cyan-400 p-0.5 shadow-lg shadow-sky-500/20">
            <div className="w-full h-full bg-[#1c1d22] rounded-[10px] flex items-center justify-center">
              <svg className="w-5 h-5 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07l14.14-14.14" />
                <circle cx="12" cy="12" r="3" fill="currentColor" />
              </svg>
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white font-serif">Sacco ISMS Platform</h1>
            <p className="text-xs text-[#717888]">Enterprise Security &amp; Financial Management System</p>
          </div>
        </div>

        {/* Hero Section */}
        <div className="bg-[#23242a] border border-[#2e303a] rounded-2xl p-8 shadow-xl space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-400 bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/20 inline-block">
            Portal Selection
          </span>
          <h2 className="text-3xl font-bold text-white tracking-tight">Select Your Portal</h2>
          <p className="text-sm text-[#8e95a5] max-w-xl">
            Choose the portal that corresponds to your assigned role on the platform.
          </p>
        </div>

        {/* Portals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {portals.map((portal) => (
            <Link
              key={portal.href}
              href={portal.href}
              className="group relative p-6 bg-[#23242a] border border-[#2e303a] hover:border-sky-500/50 rounded-2xl shadow-md hover:shadow-xl transition-all duration-200 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${portal.badgeBg}`}>
                  {portal.badge}
                </span>
                <span className="text-sky-400 group-hover:translate-x-1 transition-transform font-bold text-sm">
                  →
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-sky-400 transition-colors">
                  {portal.label}
                </h3>
                <p className="text-xs text-[#8e95a5] mt-1">
                  {portal.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-[#717888] pt-8 border-t border-[#282a32]">
        © 2026 Sacco ISMS Platform · All Rights Reserved
      </footer>
    </main>
  );
}
