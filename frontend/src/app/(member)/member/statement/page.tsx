'use client';

import { LinkedMemberGate } from '@/components/member-portal/LinkedMemberGate';
import MemberStatementView from '@/components/member-portal/MemberStatementView';
import { MemberPage } from '@/components/member-portal/MemberPage';
import { useLang } from '@/components/i18n';

export default function MemberStatementPage() {
  const { t } = useLang();
  return (
    <MemberPage
      eyebrow={t('dash.memberAccounts')}
      title={t('dash.memberStatementTitle')}
      description={t('dash.memberStatementDesc')}
    >
      <LinkedMemberGate>{(member) => <MemberStatementView member={member} />}</LinkedMemberGate>
    </MemberPage>
  );
}
