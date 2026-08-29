'use client';

import { LinkedMemberGate } from '@/components/member-portal/LinkedMemberGate';
import MemberLoansStatusView from '@/components/member-portal/MemberLoansStatusView';
import { MemberPage } from '@/components/member-portal/MemberPage';

export default function MemberLoansPage() {
  return (
    <MemberPage
      eyebrow="My accounts"
      title="Loan status"
      description="Applications and disbursements from the loans service. Amounts are full figures, not estimates."
    >
      <LinkedMemberGate>{(member) => <MemberLoansStatusView member={member} />}</LinkedMemberGate>
    </MemberPage>
  );
}
