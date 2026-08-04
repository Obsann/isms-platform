import type { Metadata } from "next";
import PortalCard from "@/components/ui/PortalCard";

export const metadata: Metadata = {
  title: "Member Dashboard",
  description: "Self-service account and loan management for ISMS members.",
};

export default function MemberDashboardPage() {
  return (
    <PortalCard
      portalName="Member"
      accentColor="var(--portal-member)"
      icon="👤"
      description="Self-service account and loan management. Check balances, apply for loans, and view statements."
    />
  );
}
