import type { Metadata } from "next";
import PortalCard from "@/components/ui/PortalCard";

export const metadata: Metadata = {
  title: "Tenant Admin Dashboard",
  description: "SACCO branch management and member oversight for ISMS.",
};

export default function TenantAdminDashboardPage() {
  return (
    <PortalCard
      portalName="Tenant Admin"
      accentColor="var(--portal-tenant-admin)"
      icon="🏢"
      description="SACCO branch management and member oversight. Configure products, approve loans, and monitor branch activity."
    />
  );
}
