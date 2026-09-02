'use client';

import { LinkedMemberGate } from '@/components/member-portal/LinkedMemberGate';
import MemberDashboardView from '@/components/member-portal/MemberDashboardView';
import { MemberPage } from '@/components/member-portal/MemberPage';
import { useLang } from '@/components/i18n';

export default function MemberDashboardPage() {
  const { t } = useLang();
  return (
    <MemberPage
      eyebrow={t('dash.memberEyebrow')}
      title={t('dash.memberTitle')}
      description={t('dash.memberDesc')}
    >
      <LinkedMemberGate>{(member) => <MemberDashboardView member={member} />}</LinkedMemberGate>
    </MemberPage>
  );
}
