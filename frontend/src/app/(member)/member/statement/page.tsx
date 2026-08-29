'use client';

import { LinkedMemberGate } from '@/components/member-portal/LinkedMemberGate';
import MemberStatementView from '@/components/member-portal/MemberStatementView';
import { MemberPage } from '@/components/member-portal/MemberPage';

export default function MemberStatementPage() {
  return (
    <MemberPage
      eyebrow="My accounts"
      title="Statement"
      description="Request a date-range statement. Rows come from ledger postings, not a mock list."
    >
      <LinkedMemberGate>{(member) => <MemberStatementView member={member} />}</LinkedMemberGate>
    </MemberPage>
  );
}
