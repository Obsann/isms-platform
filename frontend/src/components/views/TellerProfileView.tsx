'use client';

import StaffProfileView from '@/components/views/StaffProfileView';
import { useLang } from '@/components/i18n';

export function TellerProfileView() {
  const { t } = useLang();
  return <StaffProfileView portalLabel={t('portal.teller')} />;
}

export default TellerProfileView;
