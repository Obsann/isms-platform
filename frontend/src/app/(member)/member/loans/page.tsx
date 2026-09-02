'use client';

import { LinkedMemberGate } from '@/components/member-portal/LinkedMemberGate';
import MemberLoansStatusView from '@/components/member-portal/MemberLoansStatusView';
import { MemberPage } from '@/components/member-portal/MemberPage';
import { useLang } from '@/components/i18n';

export default function MemberLoansPage() {
  const { t } = useLang();
  return (
    <MemberPage
      eyebrow={t('dash.memberAccounts')}
      title={t('dash.memberLoansTitle')}
      description={t('dash.memberLoansDesc')}
    >
      <LinkedMemberGate>{(member) => <MemberLoansStatusView member={member} />}</LinkedMemberGate>
    </MemberPage>
  );
}
