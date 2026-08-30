'use client';

import { LinkedMemberGate } from '@/components/member-portal/LinkedMemberGate';
import MemberDashboardView from '@/components/member-portal/MemberDashboardView';
import { MemberPage } from '@/components/member-portal/MemberPage';

export default function MemberDashboardPage() {
  return (
    <MemberPage
      eyebrow="My account"
      title="Member dashboard"
      description="Live balances and loan counts, plus mocked mobile money that never reports a false success."
    >
      <LinkedMemberGate>{(member) => <MemberDashboardView member={member} />}</LinkedMemberGate>
    </MemberPage>
  );
}
