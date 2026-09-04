'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { ApiRequestError } from '@/lib/api-client';
import {
  confirmMockChapaWithdrawal,
  getChapaStatus,
  getMemberBalance,
  initializeChapaDeposit,
  initializeChapaWithdrawal,
  verifyChapaDeposit,
  verifyChapaWithdrawal,
  type ChapaCheckoutMode,
  type ChapaPaymentView,
  type ChapaPayoutChannel,
} from '@/lib/api-client/member-self-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { CurrencyDisplay } from '@/components/currency/CurrencyDisplay';
import { FormFieldGroup } from '@/components/forms/FormFieldGroup';
import { StatusBadge } from '@/components/badges/StatusBadge';
import { useApp } from '@/contexts/AppContext';
import { isValidAmountDecimal } from '@/lib/money';
import type { Amount, Member } from '@/types';
import OtpRequestField from '@/components/auth/OtpRequestField';
import { HIGH_VALUE_OTP_THRESHOLD, requiresHighValueOtp } from '@/lib/otp';

/** Chapa sandbox success numbers — https://developer.chapa.co/test/testing-mobile */
const CHAPA_TEST_PHONE = '0900123456';

type WalletOp = 'deposit' | 'withdrawal';

function toAmount(raw: string): Amount | null {
  const trimmed = raw.trim();
  if (!isValidAmountDecimal(trimmed)) return null;
  const [whole, fraction = ''] = trimmed.split('.');
  return `${whole}.${fraction.padEnd(2, '0')}`;
}

function readReturnTxRef(): string | null {
  const params = new URLSearchParams(window.location.search);
  const txRef = params.get('tx_ref')?.trim() || params.get('trx_ref')?.trim();
  return txRef || null;
}

function statusBadge(payment: ChapaPaymentView) {
  if (payment.status === 'paid') {
    return {
      status: 'completed' as const,
      label:
        payment.kind === 'withdrawal' ? 'Paid — savings debited' : 'Paid — savings credited',
    };
  }
  if (payment.status === 'failed') return { status: 'failed' as const, label: 'Failed' };
  return {
    status: 'pending' as const,
    label: payment.kind === 'withdrawal' ? 'Waiting for Chapa payout' : 'Waiting for Chapa',
  };
}

function isHostedCheckout(url: string | null | undefined, mode: ChapaCheckoutMode): boolean {
  if (!url || mode !== 'live') return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === 'checkout.chapa.co' || host.endsWith('.chapa.co');
  } catch {
    return false;
  }
}

export default function MemberMobileMoneyView({ member }: { member: Member }) {
  const { showToast } = useApp();
  const [mode, setMode] = useState<ChapaCheckoutMode | null>(null);
  const [op, setOp] = useState<WalletOp>('deposit');
  const [ledgerAvailable, setLedgerAvailable] = useState<string | null>(null);
  const [accountId, setAccountId] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState(CHAPA_TEST_PHONE);
  const [channel, setChannel] = useState<ChapaPayoutChannel>('telebirr');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [checkout, setCheckout] = useState<ChapaPaymentView | null>(null);
  const [otp, setOtp] = useState('');

  const live = mode === 'live';

  const refreshBalance = useCallback(async () => {
    const balance = await getMemberBalance(member.id);
    const savings =
      balance.accounts.find((account) => account.type === 'savings') ?? balance.accounts[0];
    setLedgerAvailable(savings?.availableBalance ?? '0.00');
    setAccountId(savings?.id ?? '');
    setAccountNumber(savings?.accountNumber ?? '');
  }, [member.id]);

  const syncPayment = useCallback(
    async (txRef: string, kind: WalletOp, opts?: { announce?: boolean }) => {
      const result =
        kind === 'withdrawal' ? await verifyChapaWithdrawal(txRef) : await verifyChapaDeposit(txRef);
      setCheckout(result);
      if (opts?.announce && result.status === 'paid') {
        showToast(
          kind === 'withdrawal' ? 'Withdrawal posted' : 'Deposit posted',
          kind === 'withdrawal'
            ? `${result.amount} ETB was sent from your savings.`
            : `${result.amount} ETB was credited to your savings.`,
          'success',
        );
      } else if (opts?.announce && result.status === 'failed') {
        showToast(
          kind === 'withdrawal' ? 'Payout failed' : 'Payment failed',
          kind === 'withdrawal'
            ? 'Chapa did not confirm this payout. Held funds were released.'
            : 'Chapa did not confirm this checkout.',
          'error',
        );
      }
      if (result.status === 'paid' || result.status === 'failed') {
        await refreshBalance();
      }
      return result;
    },
    [refreshBalance, showToast],
  );

  useEffect(() => {
    let cancelled = false;
    Promise.all([getChapaStatus(), getMemberBalance(member.id)])
      .then(([status, balance]) => {
        if (cancelled) return;
        setMode(status.mode);
        const savings =
          balance.accounts.find((account) => account.type === 'savings') ?? balance.accounts[0];
        setAccountId(savings?.id ?? '');
        setAccountNumber(savings?.accountNumber ?? '');
        setLedgerAvailable(savings?.availableBalance ?? '0.00');
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ApiRequestError ? err.message : 'Could not load Chapa wallet.');
      });
    return () => {
      cancelled = true;
    };
  }, [member.id]);

  useEffect(() => {
    const txRef = readReturnTxRef();
    if (!txRef) return;
    window.history.replaceState({}, '', window.location.pathname);
    let cancelled = false;
    setBusy(true);
    setOp('deposit');
    syncPayment(txRef, 'deposit', { announce: true })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof ApiRequestError ? err.message : 'Could not verify this checkout.';
        setError(message);
        showToast('Verification failed', message, 'error');
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [showToast, syncPayment]);

  async function onDeposit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!live) {
      setError(
        'Chapa is not configured on the API. Paste CHAPA_SECRET_KEY into backend/.env and restart the API.',
      );
      return;
    }

    const parsed = toAmount(amount);
    if (!parsed) {
      setError('Enter a valid amount such as 1500.00.');
      return;
    }
    if (!accountId) {
      setError('You need a savings account before a Chapa deposit can start.');
      return;
    }
    if (!phone.trim()) {
      setError('Enter a Chapa checkout phone such as 0900123456.');
      return;
    }

    setBusy(true);
    try {
      const started = await initializeChapaDeposit({
        amount: parsed,
        accountId,
        phone: phone.trim(),
      });
      if (!isHostedCheckout(started.checkoutUrl, started.mode)) {
        setError(
          'Chapa did not return a hosted checkout URL. Confirm CHAPA_SECRET_KEY is a real CHASECK_TEST or live key, then restart the API.',
        );
        return;
      }
      window.location.assign(started.checkoutUrl);
    } catch (err: unknown) {
      const message = err instanceof ApiRequestError ? err.message : 'Could not start Chapa checkout.';
      setError(message);
      showToast('Checkout failed', message, 'error');
      setBusy(false);
    }
  }

  async function onWithdraw(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const parsed = toAmount(amount);
    if (!parsed) {
      setError('Enter a valid amount such as 1500.00.');
      return;
    }
    if (!accountId) {
      setError('You need a savings account before a Chapa withdrawal can start.');
      return;
    }
    if (!phone.trim()) {
      setError('Enter the wallet phone such as 0900123456.');
      return;
    }
    if (requiresHighValueOtp(parsed) && !/^\d{6}$/.test(otp)) {
      setError(`Withdrawals of ${HIGH_VALUE_OTP_THRESHOLD} ETB or more need an email verification code.`);
      return;
    }

    setBusy(true);
    try {
      const started = await initializeChapaWithdrawal({
        amount: parsed,
        accountId,
        phone: phone.trim(),
        channel,
        otp: requiresHighValueOtp(parsed) ? otp : undefined,
      });
      setCheckout(started);
      if (started.status === 'pending') {
        showToast(
          'Payout reserved',
          'Available savings are held until Chapa confirms the transfer.',
          'info',
        );
        await refreshBalance();
        if (started.mode === 'live') {
          await syncPayment(started.txRef, 'withdrawal', { announce: true });
        }
      }
    } catch (err: unknown) {
      const message = err instanceof ApiRequestError ? err.message : 'Could not start Chapa payout.';
      setError(message);
      showToast('Payout failed', message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function onRefresh() {
    if (!checkout) return;
    setError(null);
    setBusy(true);
    try {
      await syncPayment(checkout.txRef, checkout.kind === 'withdrawal' ? 'withdrawal' : 'deposit', {
        announce: true,
      });
    } catch (err: unknown) {
      const message = err instanceof ApiRequestError ? err.message : 'Could not verify this payment.';
      setError(message);
      showToast('Verification failed', message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function onSimulatePayout() {
    if (!checkout || checkout.kind !== 'withdrawal') return;
    setError(null);
    setBusy(true);
    try {
      const result = await confirmMockChapaWithdrawal(checkout.txRef);
      setCheckout(result);
      if (result.status === 'paid') {
        showToast('Withdrawal posted', `${result.amount} ETB was sent from your savings.`, 'success');
        await refreshBalance();
      }
    } catch (err: unknown) {
      const message = err instanceof ApiRequestError ? err.message : 'Could not simulate this payout.';
      setError(message);
      showToast('Simulation failed', message, 'error');
    } finally {
      setBusy(false);
    }
  }

  const badge = checkout ? statusBadge(checkout) : null;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 p-4">
        <p className="text-sm font-bold text-emerald-950 dark:text-emerald-200">Chapa wallet</p>
        <p className="mt-1 text-xs leading-relaxed text-emerald-900 dark:text-emerald-300">
          Deposit via hosted checkout. Withdraw to Telebirr or M-PESA from available savings. The
          ledger moves only after Chapa verify. Sandbox test phones:{' '}
          <span className="font-mono">0900123456</span> (OTP <span className="font-mono">12345</span>
          ). M-PESA test: <span className="font-mono">0700123456</span>.
        </p>
        {ledgerAvailable !== null && (
          <p className="mt-2 text-xs font-medium text-emerald-950 dark:text-emerald-200">
            Available savings: <CurrencyDisplay amount={ledgerAvailable} size="sm" />
            {accountNumber ? ` · ${accountNumber}` : ''}
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setOp('deposit');
            setError(null);
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
            op === 'deposit'
              ? 'bg-midnight text-gold dark:bg-gold dark:text-midnight'
              : 'border border-slate-300 dark:border-slate-700'
          }`}
        >
          Deposit
        </button>
        <button
          type="button"
          onClick={() => {
            setOp('withdrawal');
            setError(null);
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
            op === 'withdrawal'
              ? 'bg-midnight text-gold dark:bg-gold dark:text-midnight'
              : 'border border-slate-300 dark:border-slate-700'
          }`}
        >
          Withdraw
        </button>
      </div>

      {op === 'deposit' ? (
        <Card>
          <CardHeader>
            <CardTitle>Deposit to savings</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(event) => void onDeposit(event)} className="space-y-3">
              <FormFieldGroup label="Amount (ETB)" htmlFor="chapa-amount" required>
                <input
                  id="chapa-amount"
                  inputMode="decimal"
                  placeholder="1500.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={busy}
                />
              </FormFieldGroup>
              <FormFieldGroup label="Chapa phone" htmlFor="chapa-phone" required>
                <input
                  id="chapa-phone"
                  inputMode="tel"
                  placeholder="0900123456"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={busy}
                />
              </FormFieldGroup>
              {error && (
                <p className="text-sm font-semibold text-rose-600" role="alert">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={busy || !live}
                className="px-4 py-2 rounded-lg bg-midnight text-gold dark:bg-gold dark:text-midnight text-xs font-bold disabled:opacity-60"
              >
                {busy ? 'Opening Chapa…' : 'Pay with Chapa'}
              </button>
              {!live && mode === 'mock' && (
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  Live checkout needs CHAPA_SECRET_KEY on the API. Withdrawals can still be simulated.
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Withdraw to mobile wallet</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(event) => void onWithdraw(event)} className="space-y-3">
              <FormFieldGroup label="Amount (ETB)" htmlFor="chapa-wd-amount" required>
                <input
                  id="chapa-wd-amount"
                  inputMode="decimal"
                  placeholder="500.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={busy}
                />
              </FormFieldGroup>
              <FormFieldGroup label="Wallet" htmlFor="chapa-wd-channel" required>
                <select
                  id="chapa-wd-channel"
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as ChapaPayoutChannel)}
                  disabled={busy}
                >
                  <option value="telebirr">Telebirr</option>
                  <option value="mpesa">M-PESA</option>
                </select>
              </FormFieldGroup>
              <FormFieldGroup label="Wallet phone" htmlFor="chapa-wd-phone" required>
                <input
                  id="chapa-wd-phone"
                  inputMode="tel"
                  placeholder="0900123456"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={busy}
                />
              </FormFieldGroup>
              {requiresHighValueOtp(amount) && (
                <OtpRequestField
                  purpose="large-withdrawal"
                  amount={toAmount(amount) ?? amount.trim()}
                  accountId={accountId || undefined}
                  value={otp}
                  onChange={setOtp}
                  disabled={busy}
                  helperText={`Withdrawals of ${HIGH_VALUE_OTP_THRESHOLD} ETB or more need a code emailed to your login address.`}
                />
              )}
              {error && (
                <p className="text-sm font-semibold text-rose-600" role="alert">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={busy}
                className="px-4 py-2 rounded-lg bg-midnight text-gold dark:bg-gold dark:text-midnight text-xs font-bold disabled:opacity-60"
              >
                {busy ? 'Starting payout…' : live ? 'Send with Chapa' : 'Reserve mock payout'}
              </button>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Available savings are held immediately. The ledger withdrawal posts only after Chapa
                confirms. Live payouts need a funded Chapa merchant balance.
              </p>
            </form>
          </CardContent>
        </Card>
      )}

      {checkout && badge && (
        <Card>
          <CardHeader>
            <CardTitle>{checkout.kind === 'withdrawal' ? 'Payout' : 'Payment'}</CardTitle>
            <StatusBadge status={badge.status} label={badge.label} size="sm" />
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <p>
              Amount <CurrencyDisplay amount={checkout.amount} size="sm" /> · ref {checkout.txRef}
              {checkout.payoutChannel ? ` · ${checkout.payoutChannel}` : ''}
            </p>
            {checkout.status === 'pending' && checkout.kind === 'deposit' && (
              <p className="font-medium text-amber-800 dark:text-amber-300">
                Not credited yet. Use Verify after you finish on Chapa.
              </p>
            )}
            {checkout.status === 'pending' && checkout.kind === 'withdrawal' && (
              <p className="font-medium text-amber-800 dark:text-amber-300">
                Not debited yet. Funds are held until Chapa transfer verify succeeds.
              </p>
            )}
            {checkout.status === 'paid' && checkout.kind === 'deposit' && (
              <p className="font-medium text-emerald-800 dark:text-emerald-300">
                Savings credited through the ledger.
              </p>
            )}
            {checkout.status === 'paid' && checkout.kind === 'withdrawal' && (
              <p className="font-medium text-emerald-800 dark:text-emerald-300">
                Savings withdrawn through the ledger.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void onRefresh()}
                disabled={busy}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold disabled:opacity-60"
              >
                Verify status
              </button>
              {checkout.kind === 'withdrawal' &&
                checkout.status === 'pending' &&
                checkout.mode === 'mock' && (
                  <button
                    type="button"
                    onClick={() => void onSimulatePayout()}
                    disabled={busy}
                    className="px-3 py-1.5 rounded-lg bg-midnight text-gold dark:bg-gold dark:text-midnight text-xs font-bold disabled:opacity-60"
                  >
                    Simulate payout
                  </button>
                )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
