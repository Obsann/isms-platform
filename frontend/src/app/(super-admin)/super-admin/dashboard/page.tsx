import type { Metadata } from "next";
import PortalCard from "@/components/ui/PortalCard";

export const metadata: Metadata = {
  title: "Super Admin Dashboard",
  description: "Platform-level administration and configuration for ISMS.",
};

export default function SuperAdminDashboardPage() {
  return (
    <PortalCard
      portalName="Super Admin"
      accentColor="var(--portal-super-admin)"
      icon="🛡️"
      description="Platform-level administration and configuration. Manage tenants, global settings, and system health."
    />
  );
}
