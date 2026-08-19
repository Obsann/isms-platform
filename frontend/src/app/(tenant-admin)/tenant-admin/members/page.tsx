import MemberManagementView from '@/components/members/MemberManagementView';

export const metadata = { title: 'Members | ISMS Tenant Admin' };

export default function TenantAdminMembersPage() {
  return <MemberManagementView portalType="tenant-admin" />;
}
