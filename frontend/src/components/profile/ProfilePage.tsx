'use client';

import { useEffect, useState } from 'react';
import {
  User,
  Mail,
  Shield,
  Building2,
  Clock,
  Key,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { FormFieldGroup } from '@/components/forms/FormFieldGroup';
import { apiClient, getSessionUser } from '@/lib/api-client';
import type { AuthUser } from '@/types';
import { useLang } from '@/components/i18n';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface ProfilePageProps {
  /** Eyebrow label above the page title */
  eyebrow?: string;
  /** Show platform-level scoping badge (Super Admin only) */
  platformLevel?: boolean;
}

interface PasswordForm {
  current: string;
  next: string;
  confirm: string;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function ProfilePage({ eyebrow = 'profile.eyebrowAccount', platformLevel = false }: ProfilePageProps) {
  const { t } = useLang();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Password change form
  const [pwForm, setPwForm] = useState<PasswordForm>({ current: '', next: '', confirm: '' });
  const [pwVisible, setPwVisible] = useState({ current: false, next: false, confirm: false });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      setError(null);
      try {
        const me = await apiClient.get<AuthUser>('/auth/me');
        setUser(me);
      } catch {
        // Fall back to session data if backend is unreachable
        const session = getSessionUser();
        if (session) {
          setUser(session);
        } else {
          setError(t('profile.loadError'));
        }
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  function handlePwChange(field: keyof PasswordForm, value: string) {
    setPwForm((prev) => ({ ...prev, [field]: value }));
    setPwError(null);
    setPwSuccess(false);
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(false);

    if (!pwForm.current) {
      setPwError('Current password is required.');
      return;
    }
    if (pwForm.next.length < 8) {
      setPwError('New password must be at least 8 characters.');
      return;
    }
    if (pwForm.next !== pwForm.confirm) {
      setPwError('New password and confirmation do not match.');
      return;
    }

    setPwSaving(true);
    try {
      await apiClient.post('/auth/change-password', {
        currentPassword: pwForm.current,
        newPassword: pwForm.next,
      });
      setPwSuccess(true);
      setPwForm({ current: '', next: '', confirm: '' });
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to update password. Please check current password and try again.';
      setPwError(msg);
    } finally {
      setPwSaving(false);
    }
  }

  /* ---- Role display helpers ---- */
  const roleDisplay: Record<string, { label: string; color: string }> = {
    'super-admin': { label: 'Super Admin', color: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/30' },
    'tenant-admin': { label: 'Tenant Admin', color: 'text-sky-600 bg-sky-50 dark:text-sky-400 dark:bg-sky-900/30' },
    teller: { label: 'Teller', color: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30' },
    'loan-officer': { label: 'Loan Officer', color: 'text-violet-600 bg-violet-50 dark:text-violet-400 dark:bg-violet-900/30' },
    member: { label: 'Member', color: 'text-slate-600 bg-slate-100 dark:text-slate-400 dark:bg-slate-800' },
  };

  const initials = user?.fullName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '??';

  const roleMeta = user ? (roleDisplay[user.role] ?? { label: user.role, color: 'text-slate-600 bg-slate-100' }) : null;

  /* ---- Loading state ---- */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-gold animate-spin" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('profile.loading')}</p>
        </div>
      </div>
    );
  }

  /* ---- Error state ---- */
  if (error && !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-10">
            <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{error ?? t('profile.loadError')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-gold mb-1">{t(eyebrow)}</p>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{t('profile.title')}</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
          {t('profile.subtitle')}
        </p>
      </div>

      {/* Platform badge */}
      {platformLevel && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40">
          <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
            {t('profile.platformBadge')}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left column: Identity card ── */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardContent className="flex flex-col items-center text-center pt-8 pb-6">
              {/* Avatar */}
              <div className="relative mb-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold to-amber-500 text-midnight flex items-center justify-center font-bold text-2xl tracking-wide shadow-lg shadow-amber-500/20">
                  {initials}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                </div>
              </div>

              {/* Name */}
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                {user?.fullName ?? '—'}
              </h2>

              {/* Role badge */}
              {roleMeta && (
                <span className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${roleMeta.color}`}>
                  <Shield className="w-3 h-3" />
                  {roleMeta.label}
                </span>
              )}

              {/* Status */}
              <div className="mt-4 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${user?.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {user?.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Quick info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Email</p>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{user?.email ?? '—'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Building2 className="w-4 h-4 text-slate-400 dark:text-slate-500 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Tenant</p>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    {user?.tenantId ? user.tenantId.slice(0, 8) + '…' : 'Platform (Global)'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-slate-400 dark:text-slate-500 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Staff ID</p>
                  <p className="text-xs font-mono text-slate-600 dark:text-slate-400 break-all">{user?.id ?? '—'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Right column: Details & Security ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Account Details */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Account Details</CardTitle>
                <CardDescription>Your basic account information</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FormFieldGroup label="Full Name" htmlFor="profile-name">
                  <input
                    id="profile-name"
                    value={user?.fullName ?? ''}
                    readOnly
                    className="cursor-default bg-slate-50 dark:bg-slate-800/50"
                  />
                </FormFieldGroup>
                <FormFieldGroup label="Email Address" htmlFor="profile-email">
                  <input
                    id="profile-email"
                    type="email"
                    value={user?.email ?? ''}
                    readOnly
                    className="cursor-default bg-slate-50 dark:bg-slate-800/50"
                  />
                </FormFieldGroup>
                <FormFieldGroup label="Role" htmlFor="profile-role">
                  <input
                    id="profile-role"
                    value={roleMeta?.label ?? user?.role ?? ''}
                    readOnly
                    className="cursor-default bg-slate-50 dark:bg-slate-800/50"
                  />
                </FormFieldGroup>
                <FormFieldGroup label="Account Status" htmlFor="profile-status">
                  <input
                    id="profile-status"
                    value={user?.isActive ? 'Active' : 'Inactive'}
                    readOnly
                    className="cursor-default bg-slate-50 dark:bg-slate-800/50"
                  />
                </FormFieldGroup>
              </div>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-gold" />
                  Change Password
                </CardTitle>
                <CardDescription>Update your account password for security</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <FormFieldGroup label="Current Password" htmlFor="pw-current" required>
                      <div className="relative">
                        <input
                          id="pw-current"
                          type={pwVisible.current ? 'text' : 'password'}
                          value={pwForm.current}
                          onChange={(e) => handlePwChange('current', e.target.value)}
                          placeholder="Enter current password"
                          autoComplete="current-password"
                          className="!pr-10"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                          onClick={() => setPwVisible((v) => ({ ...v, current: !v.current }))}
                          tabIndex={-1}
                        >
                          {pwVisible.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </FormFieldGroup>
                  </div>

                  <FormFieldGroup label="New Password" htmlFor="pw-new" required>
                    <div className="relative">
                      <input
                        id="pw-new"
                        type={pwVisible.next ? 'text' : 'password'}
                        value={pwForm.next}
                        onChange={(e) => handlePwChange('next', e.target.value)}
                        placeholder="At least 8 characters"
                        autoComplete="new-password"
                        className="!pr-10"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                        onClick={() => setPwVisible((v) => ({ ...v, next: !v.next }))}
                        tabIndex={-1}
                      >
                        {pwVisible.next ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </FormFieldGroup>

                  <FormFieldGroup label="Confirm New Password" htmlFor="pw-confirm" required>
                    <div className="relative">
                      <input
                        id="pw-confirm"
                        type={pwVisible.confirm ? 'text' : 'password'}
                        value={pwForm.confirm}
                        onChange={(e) => handlePwChange('confirm', e.target.value)}
                        placeholder="Re-enter new password"
                        autoComplete="new-password"
                        className="!pr-10"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                        onClick={() => setPwVisible((v) => ({ ...v, confirm: !v.confirm }))}
                        tabIndex={-1}
                      >
                        {pwVisible.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </FormFieldGroup>
                </div>

                {/* Password validation feedback */}
                {pwForm.next.length > 0 && (
                  <div className="flex flex-wrap gap-3 text-[11px]">
                    <span className={`flex items-center gap-1 font-medium ${pwForm.next.length >= 8 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                      {pwForm.next.length >= 8 ? <CheckCircle2 className="w-3 h-3" /> : <span className="w-3 h-3 rounded-full border border-slate-300 dark:border-slate-600 inline-block" />}
                      8+ characters
                    </span>
                    <span className={`flex items-center gap-1 font-medium ${/[A-Z]/.test(pwForm.next) ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                      {/[A-Z]/.test(pwForm.next) ? <CheckCircle2 className="w-3 h-3" /> : <span className="w-3 h-3 rounded-full border border-slate-300 dark:border-slate-600 inline-block" />}
                      Uppercase
                    </span>
                    <span className={`flex items-center gap-1 font-medium ${/[0-9]/.test(pwForm.next) ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                      {/[0-9]/.test(pwForm.next) ? <CheckCircle2 className="w-3 h-3" /> : <span className="w-3 h-3 rounded-full border border-slate-300 dark:border-slate-600 inline-block" />}
                      Number
                    </span>
                    <span className={`flex items-center gap-1 font-medium ${/[^A-Za-z0-9]/.test(pwForm.next) ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                      {/[^A-Za-z0-9]/.test(pwForm.next) ? <CheckCircle2 className="w-3 h-3" /> : <span className="w-3 h-3 rounded-full border border-slate-300 dark:border-slate-600 inline-block" />}
                      Special char
                    </span>
                    {pwForm.confirm.length > 0 && (
                      <span className={`flex items-center gap-1 font-medium ${pwForm.next === pwForm.confirm ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                        {pwForm.next === pwForm.confirm ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        Passwords match
                      </span>
                    )}
                  </div>
                )}

                {/* Error / Success alerts */}
                {pwError && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/40">
                    <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                    <p className="text-xs font-semibold text-rose-700 dark:text-rose-300">{pwError}</p>
                  </div>
                )}
                {pwSuccess && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Password updated successfully.</p>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={pwSaving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-midnight text-gold hover:bg-midnight-light dark:bg-gold dark:text-midnight dark:hover:bg-gold-light font-bold text-xs sm:text-sm tracking-wide shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    {pwSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Updating Password...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Update Password
                      </>
                    )}
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Session & Security */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gold" />
                  Session & Security
                </CardTitle>
                <CardDescription>Your current session information</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Session Status</p>
                    <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Active</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Auth Method</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">JWT Bearer Token</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                    <RefreshCw className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Token Expiry</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">8 hours</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                    <Key className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">2FA</p>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Not configured</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
