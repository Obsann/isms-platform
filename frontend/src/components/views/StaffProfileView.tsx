'use client';

import React from 'react';
import { Mail, Shield, Building2, KeyRound, Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { useAuthUser, formatRoleLabel } from '@/components/auth/useAuthUser';
import { StatusBadge } from '@/components/badges/StatusBadge';
import { useLang } from '@/components/i18n';

interface StaffProfileViewProps {
  portalLabel: string;
}

export function StaffProfileView({ portalLabel }: StaffProfileViewProps) {
  const user = useAuthUser();
  const { t } = useLang();
  const initials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : portalLabel.slice(0, 2).toUpperCase();

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="pb-3 border-b border-slate-200/80 dark:border-slate-800">
        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-gold">
          {t('profile.staffEyebrow')}
        </span>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-serif tracking-tight mt-0.5">
          {t('profile.staffTitle', { portal: portalLabel })}
        </h1>
        <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
          {t('profile.staffSubtitle')}
        </p>
      </div>

      <Card>
        <div className="p-4 sm:p-5 flex items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-midnight text-gold flex items-center justify-center font-bold text-base border border-gold/40 shadow-sm shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                {user?.fullName ?? portalLabel}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-mono font-medium truncate">
                {user?.email ?? '—'}
              </p>
            </div>
          </div>
          <StatusBadge
            status={user?.isActive ? 'active' : 'inactive'}
            size="sm"
            label={user?.isActive ? 'Active Staff' : 'Inactive'}
          />
        </div>

        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5">
              <Mail className="w-4 h-4 text-amber-800 dark:text-gold shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
                  Email Address
                </span>
                <span className="font-semibold text-slate-900 dark:text-slate-100 break-all">{user?.email ?? '—'}</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-amber-800 dark:text-gold shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
                  Portal Role
                </span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {user?.role ? formatRoleLabel(user.role) : portalLabel}
                </span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5">
              <KeyRound className="w-4 h-4 text-amber-800 dark:text-gold shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
                  Staff UUID
                </span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 break-all text-[11px]">
                  {user?.id ?? '—'}
                </span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5">
              <Building2 className="w-4 h-4 text-amber-800 dark:text-gold shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
                  Tenant Organization
                </span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{user?.tenantId ?? 'Platform'}</span>
              </div>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-800 flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
            <Lock className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
            <span>Tenant row-level security is on. This login cannot read another SACCO&apos;s members.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default StaffProfileView;
