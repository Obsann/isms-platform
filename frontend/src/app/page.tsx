import Link from "next/link";
import type { Metadata } from "next";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "ISMS Platform — Home",
  description: "Navigate to your portal on the ISMS Platform.",
};

const portals = [
  {
    href: "/super-admin/dashboard",
    label: "Super Admin",
    description: "Platform-level administration and configuration",
    accent: "var(--portal-super-admin)",
    icon: "🛡️",
  },
  {
    href: "/tenant-admin/dashboard",
    label: "Tenant Admin",
    description: "SACCO branch management and member oversight",
    accent: "var(--portal-tenant-admin)",
    icon: "🏢",
  },
  {
    href: "/teller/dashboard",
    label: "Teller",
    description: "Daily transactions, deposits and withdrawals",
    accent: "var(--portal-teller)",
    icon: "💰",
  },
  {
    href: "/member/dashboard",
    label: "Member",
    description: "Self-service account and loan management",
    accent: "var(--portal-member)",
    icon: "👤",
  },
];

export default function HomePage() {
  return (
    <main className={styles.main}>
      <div className={styles.hero}>
        <span className={styles.badge}>ISMS Platform</span>
        <h1 className={styles.title}>Select Your Portal</h1>
        <p className={styles.subtitle}>
          Choose the portal that matches your role to get started.
        </p>
      </div>

      <div className={styles.grid}>
        {portals.map((portal) => (
          <Link
            key={portal.href}
            href={portal.href}
            className={styles.card}
            style={{ "--accent": portal.accent } as React.CSSProperties}
          >
            <span className={styles.icon}>{portal.icon}</span>
            <h2 className={styles.cardTitle}>{portal.label}</h2>
            <p className={styles.cardDesc}>{portal.description}</p>
            <span className={styles.arrow}>→</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
