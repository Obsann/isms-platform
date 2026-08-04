import type { Metadata } from "next";
import PortalCard from "@/components/ui/PortalCard";

export const metadata: Metadata = {
  title: "Teller Dashboard",
  description: "Daily transactions, deposits and withdrawals for ISMS.",
};

export default function TellerDashboardPage() {
  return (
    <PortalCard
      portalName="Teller"
      accentColor="var(--portal-teller)"
      icon="💰"
      description="Daily transactions, deposits, and withdrawals. Process member requests quickly and accurately."
    />
  );
}
