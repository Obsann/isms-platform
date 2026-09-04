'use client';

import { useState } from 'react';
import { Loader2, Mail } from 'lucide-react';
import { ApiRequestError } from '@/lib/api-client';
import { requestOtp, type OtpPurpose } from '@/lib/otp';
import { FormFieldGroup } from '@/components/forms/FormFieldGroup';

interface OtpRequestFieldProps {
  purpose: Exclude<OtpPurpose, 'password-reset'>;
  amount?: string;
  accountId?: string;
  loanId?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  helperText?: string;
}

export default function OtpRequestField({
  purpose,
  amount,
  accountId,
  loanId,
  value,
  onChange,
  disabled,
  helperText = 'A 6-digit code will be emailed to your login address.',
}: OtpRequestFieldProps) {
  const [sending, setSending] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function sendCode() {
    setError(null);
    setSending(true);
    try {
      const result = await requestOtp({ purpose, amount, accountId, loanId });
      setInfo(`Code sent to ${result.maskedEmail}. It expires in ${result.expiresInSeconds} seconds.`);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not send the verification code.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-2">
        <div className="flex-1 min-w-0">
          <FormFieldGroup label="Email verification code" htmlFor={`otp-${purpose}`} required helperText={helperText}>
            <input
              id={`otp-${purpose}`}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={value}
              onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              disabled={disabled}
              className="font-mono tracking-widest"
            />
          </FormFieldGroup>
        </div>
        <button
          type="button"
          onClick={() => void sendCode()}
          disabled={disabled || sending}
          className="mb-[2px] inline-flex items-center gap-1.5 shrink-0 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-gold hover:text-gold disabled:opacity-50"
        >
          {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
          {sending ? 'Sending…' : info ? 'Resend' : 'Send code'}
        </button>
      </div>
      {info && <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">{info}</p>}
      {error && <p className="text-[11px] font-semibold text-rose-600" role="alert">{error}</p>}
    </div>
  );
}
