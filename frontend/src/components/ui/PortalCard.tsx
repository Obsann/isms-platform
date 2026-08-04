import Link from "next/link";
import styles from "./PortalCard.module.css";

export interface PortalCardProps {
  /** Portal display name */
  portalName: string;
  /** CSS custom property value for the accent colour */
  accentColor: string;
  /** Emoji or icon string */
  icon: string;
  /** One-line description */
  description: string;
  /** Back-to-home link */
  homeHref?: string;
}

/**
 * PortalCard — shared placeholder card used by every portal dashboard.
 * Lives in src/components/ so it is never imported across portal route groups.
 */
export default function PortalCard({
  portalName,
  accentColor,
  icon,
  description,
  homeHref = "/",
}: PortalCardProps) {
  return (
    <div
      className={styles.wrapper}
      style={{ "--accent": accentColor } as React.CSSProperties}
    >
      <div className={styles.card}>
        <div className={styles.stripe} />
        <span className={styles.icon}>{icon}</span>
        <h1 className={styles.title}>{portalName} Portal</h1>
        <p className={styles.description}>{description}</p>

        <div className={styles.statusBadge}>
          <span className={styles.dot} />
          Placeholder — implementation coming soon
        </div>

        <Link href={homeHref} className={styles.backLink}>
          ← Back to portal select
        </Link>
      </div>
    </div>
  );
}
