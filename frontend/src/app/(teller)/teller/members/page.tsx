import MemberManagementView from '@/components/members/MemberManagementView';

export const metadata = { title: 'Members | ISMS Teller Desk' };

export default function TellerMembersPage() {
  return <MemberManagementView portalType="teller" />;
}
