'use client';

import { LinkedMemberGate } from '@/components/member-portal/LinkedMemberGate';
import MemberBalanceView from '@/components/member-portal/MemberBalanceView';
import { MemberPage } from '@/components/member-portal/MemberPage';
import { useLang } from '@/components/i18n';

export default function MemberBalancePage() {
  const { t } = useLang();
  return (
    <MemberPage
      eyebrow={t('dash.memberAccounts')}
      title={t('dash.memberBalanceTitle')}
      description={t('dash.memberBalanceDesc')}
    >
      <LinkedMemberGate>{(member) => <MemberBalanceView member={member} />}</LinkedMemberGate>
    </MemberPage>
  );
}
