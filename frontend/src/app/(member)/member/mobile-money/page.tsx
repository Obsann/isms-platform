'use client';

import { LinkedMemberGate } from '@/components/member-portal/LinkedMemberGate';
import MemberMobileMoneyView from '@/components/member-portal/MemberMobileMoneyView';
import { MemberPage } from '@/components/member-portal/MemberPage';
import { useLang } from '@/components/i18n';

export default function MemberMobileMoneyPage() {
  const { t } = useLang();
  return (
    <MemberPage
      eyebrow={t('dash.memberChannels')}
      title={t('dash.memberMomoTitle')}
      description={t('dash.memberMomoDesc')}
    >
      <LinkedMemberGate>{(member) => <MemberMobileMoneyView member={member} />}</LinkedMemberGate>
    </MemberPage>
  );
}
