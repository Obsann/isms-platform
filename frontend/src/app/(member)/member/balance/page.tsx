'use client';

import { LinkedMemberGate } from '@/components/member-portal/LinkedMemberGate';
import MemberBalanceView from '@/components/member-portal/MemberBalanceView';
import { MemberPage } from '@/components/member-portal/MemberPage';

export default function MemberBalancePage() {
  return (
    <MemberPage
      eyebrow="My accounts"
      title="Balance"
      description="Live savings and share balances from the ledger. These figures are not mocked."
    >
      <LinkedMemberGate>{(member) => <MemberBalanceView member={member} />}</LinkedMemberGate>
    </MemberPage>
  );
}
