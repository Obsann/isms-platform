'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { ApiRequestError } from '@/lib/api-client';
import { forgotPassword, resetPassword } from '@/lib/otp';
import { PLATFORM_TENANT_CODE } from '@/types';
import FormFieldGroup from '@/components/forms/FormFieldGroup';
import { Card, CardContent } from '@/components/ui/Card';
import ThemeToggleButton from '@/components/theme/ThemeToggleButton';
import { useLang } from '@/components/i18n';

type Step = 'request' | 'reset';

export default function ForgotPasswordForm() {
  const router = useRouter();
  const { t } = useLang();
  const [step, setStep] = useState<Step>('request');
  const [tenantCode, setTenantCode] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await forgotPassword({
        tenantCode: tenantCode.trim(),
        email: email.trim(),
      });
      setInfo(result.message);
      setStep('reset');
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t('forgot.failed'));
    } finally {
      setSubmitting(false);
    }
  }

  async function onReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (newPassword.length < 8) {
      setError(t('forgot.passwordLength'));
      return;
    }
    if (newPassword !== confirm) {
      setError(t('forgot.passwordMismatch'));
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword({
        tenantCode: tenantCode.trim(),
        email: email.trim(),
        otp,
        newPassword,
      });
      router.replace('/login?reset=1');
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t('forgot.resetFailed'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen bg-surface dark:bg-midnight flex items-center justify-center p-6 overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.18] dark:opacity-[0.12]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgb(216 177 56 / 0.5) 0.8px, transparent 0.9px)',
          backgroundSize: '16px 16px',
        }}
      />
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gold/10 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 rounded-lg px-1.5 py-1 text-sm font-medium text-slate-500 dark:text-white/50 hover:text-gold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            {t('forgot.backToLogin')}
          </Link>
          <ThemeToggleButton />
        </div>

        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-11 h-11 rounded-full bg-gold text-midnight flex items-center justify-center font-display text-[10px] font-bold tracking-wider shadow-[0_0_0_3px_rgba(197,155,39,0.2)] notranslate">
            ISMS
          </div>
          <div className="leading-none">
            <p className="font-display text-sm font-bold text-slate-900 dark:text-white tracking-[0.2em] uppercase notranslate">
              ISMS
            </p>
            <p className="text-[10px] text-slate-500 dark:text-white/40 tracking-[0.15em] uppercase mt-1">
              {t('forgot.subtitle')}
            </p>
          </div>
        </div>

        <Card>
          <CardContent>
            {step === 'request' ? (
              <form onSubmit={onRequest} className="flex flex-col gap-5">
                <p className="text-sm text-slate-600 dark:text-slate-300">{t('forgot.intro')}</p>
                <FormFieldGroup
                  label={t('login.tenantCode')}
                  htmlFor="forgot-tenant"
                  required
                  helperText={t('login.tenantHelper', { code: PLATFORM_TENANT_CODE })}
                >
                  <input
                    id="forgot-tenant"
                    value={tenantCode}
                    onChange={(e) => setTenantCode(e.target.value)}
                    autoComplete="organization"
                    required
                  />
                </FormFieldGroup>
                <FormFieldGroup label={t('login.email')} htmlFor="forgot-email" required>
                  <input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="username"
                    required
                  />
                </FormFieldGroup>
                {error && (
                  <p className="text-[13px] font-semibold text-rose-600" role="alert">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 rounded-lg bg-gold text-midnight font-semibold text-sm tracking-wide hover:bg-gold-light disabled:opacity-60"
                >
                  {submitting ? t('forgot.sending') : t('forgot.sendCode')}
                </button>
              </form>
            ) : (
              <form onSubmit={onReset} className="flex flex-col gap-5">
                {info && <p className="text-sm text-slate-600 dark:text-slate-300">{info}</p>}
                <FormFieldGroup label={t('forgot.code')} htmlFor="forgot-otp" required>
                  <input
                    id="forgot-otp"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="font-mono tracking-widest"
                    required
                  />
                </FormFieldGroup>
                <FormFieldGroup label={t('forgot.newPassword')} htmlFor="forgot-password" required>
                  <div className="relative">
                    <input
                      id="forgot-password"
                      type={passwordVisible ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                      minLength={8}
                      className="w-full px-3 py-2 pr-10 rounded-lg border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-900/90"
                    />
                    <button
                      type="button"
                      onClick={() => setPasswordVisible((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-gold"
                      aria-label={passwordVisible ? t('login.hidePassword') : t('login.showPassword')}
                    >
                      {passwordVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </FormFieldGroup>
                <FormFieldGroup label={t('forgot.confirmPassword')} htmlFor="forgot-confirm" required>
                  <input
                    id="forgot-confirm"
                    type={passwordVisible ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </FormFieldGroup>
                {error && (
                  <p className="text-[13px] font-semibold text-rose-600" role="alert">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={submitting || otp.length !== 6}
                  className="w-full py-2.5 rounded-lg bg-gold text-midnight font-semibold text-sm tracking-wide hover:bg-gold-light disabled:opacity-60"
                >
                  {submitting ? t('forgot.resetting') : t('forgot.reset')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep('request');
                    setError(null);
                  }}
                  className="text-xs font-semibold text-slate-500 hover:text-gold"
                >
                  {t('forgot.useDifferentEmail')}
                </button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
