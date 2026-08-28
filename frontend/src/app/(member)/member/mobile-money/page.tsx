'use client';

import { LinkedMemberGate } from '@/components/member-portal/LinkedMemberGate';
import MemberMobileMoneyView from '@/components/member-portal/MemberMobileMoneyView';
import { MemberPage } from '@/components/member-portal/MemberPage';

export default function MemberMobileMoneyPage() {
  return (
    <MemberPage
      eyebrow="Channels"
      title="Mobile money"
      description="Mock Telebirr, M-PESA, and CBE Birr requests. They stay pending confirmation and never post as a success."
    >
      <LinkedMemberGate>{(member) => <MemberMobileMoneyView member={member} />}</LinkedMemberGate>
    </MemberPage>
  );
}
