'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { ApiRequestError } from '@/lib/api-client';
import {
  confirmMockChapaDeposit,
  getChapaStatus,
  getMemberBalance,
  initializeChapaDeposit,
  verifyChapaDeposit,
  type ChapaCheckoutMode,
  type ChapaPaymentView,
} from '@/lib/api-client/member-self-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { CurrencyDisplay } from '@/components/currency/CurrencyDisplay';
import { FormFieldGroup } from '@/components/forms/FormFieldGroup';
import { StatusBadge } from '@/components/badges/StatusBadge';
import { useApp } from '@/contexts/AppContext';
import { isValidAmountDecimal } from '@/lib/money';
import type { Amount, Member } from '@/types';

function toAmount(raw: string): Amount | null {
  const trimmed = raw.trim();
  if (!isValidAmountDecimal(trimmed)) return null;
  const [whole, fraction = ''] = trimmed.split('.');
  return `${whole}.${fraction.padEnd(2, '0')}`;
}

function statusBadge(status: ChapaPaymentView['status']) {
  if (status === 'paid') return { status: 'completed' as const, label: 'Paid — ledger posted' };
  if (status === 'failed') return { status: 'failed' as const, label: 'Failed' };
  return { status: 'pending' as const, label: 'Pending verification' };
}

export default function MemberMobileMoneyView({ member }: { member: Member }) {
  const { showToast } = useApp();
  const [mode, setMode] = useState<ChapaCheckoutMode | null>(null);
  const [ledgerAvailable, setLedgerAvailable] = useState<string | null>(null);
  const [accountId, setAccountId] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState(member.phone ?? '');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [checkout, setCheckout] = useState<ChapaPaymentView | null>(null);

  const msisdn = phone.trim() || member.phone || '';

  const syncCheckout = useCallback(
    async (txRef: string, opts?: { announce?: boolean }) => {
      const result = await verifyChapaDeposit(txRef);
      setCheckout(result);
      if (opts?.announce && result.status === 'paid') {
        showToast('Deposit posted', `${result.amount} ETB was credited to your savings.`, 'success');
      } else if (opts?.announce && result.status === 'failed') {
        showToast('Payment failed', 'Chapa did not confirm this checkout.', 'error');
      }
      if (result.status === 'paid') {
        const balance = await getMemberBalance(member.id);
        const savings = balance.accounts.find((account) => account.type === 'savings') ?? balance.accounts[0];
        setLedgerAvailable(savings?.availableBalance ?? '0.00');
      }
      return result;
    },
    [member.id, showToast],
  );

  useEffect(() => {
    let cancelled = false;
    Promise.all([getChapaStatus(), getMemberBalance(member.id)])
      .then(([status, balance]) => {
        if (cancelled) return;
        setMode(status.mode);
        const savings = balance.accounts.find((account) => account.type === 'savings') ?? balance.accounts[0];
        setAccountId(savings?.id ?? '');
        setAccountNumber(savings?.accountNumber ?? '');
        setLedgerAvailable(savings?.availableBalance ?? '0.00');
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ApiRequestError ? err.message : 'Could not load mobile money.');
      });
    return () => {
      cancelled = true;
    };
  }, [member.id]);

  useEffect(() => {
    const txRef = new URLSearchParams(window.location.search).get('tx_ref');
    if (!txRef) return;
    let cancelled = false;
    setBusy(true);
    syncCheckout(txRef, { announce: true })
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
  }, [showToast, syncCheckout]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const parsed = toAmount(amount);
    if (!parsed) {
      setError('Enter a valid amount such as 1500.00.');
      return;
    }
    if (!accountId) {
      setError('You need a savings account before a wallet deposit can start.');
      return;
    }

    setBusy(true);
    try {
      const started = await initializeChapaDeposit({
        amount: parsed,
        accountId,
        ...(phone.trim() ? { phone: phone.trim() } : {}),
      });
      setCheckout({ ...started, status: 'pending' });
      setAmount('');
      if (started.mode === 'live' && started.checkoutUrl) {
        window.location.assign(started.checkoutUrl);
        return;
      }
      showToast('Checkout started', 'Confirm the mock payment, then we will verify before crediting savings.', 'info');
    } catch (err: unknown) {
      const message = err instanceof ApiRequestError ? err.message : 'Could not start checkout.';
      setError(message);
      showToast('Checkout failed', message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function onMockComplete() {
    if (!checkout) return;
    setError(null);
    setBusy(true);
    try {
      await confirmMockChapaDeposit(checkout.txRef);
      await syncCheckout(checkout.txRef, { announce: true });
    } catch (err: unknown) {
      const message = err instanceof ApiRequestError ? err.message : 'Could not confirm the mock payment.';
      setError(message);
      showToast('Mock payment failed', message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function onRefresh() {
    if (!checkout) return;
    setError(null);
    setBusy(true);
    try {
      await syncCheckout(checkout.txRef, { announce: true });
    } catch (err: unknown) {
      const message = err instanceof ApiRequestError ? err.message : 'Could not verify this checkout.';
      setError(message);
      showToast('Verification failed', message, 'error');
    } finally {
      setBusy(false);
    }
  }

  const badge = checkout ? statusBadge(checkout.status) : null;
  const live = mode === 'live';

  return (
    <div className="space-y-4">
      <div
        className={`rounded-xl border p-4 ${
          live
            ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40'
            : 'border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40'
        }`}
      >
        <p
          className={`text-sm font-bold ${
            live ? 'text-emerald-950 dark:text-emerald-200' : 'text-amber-950 dark:text-amber-200'
          }`}
        >
          {mode === null ? 'Checking Chapa…' : live ? 'Live Chapa checkout' : 'Test / mock checkout'}
        </p>
        <p
          className={`mt-1 text-xs leading-relaxed ${
            live ? 'text-emerald-900 dark:text-emerald-300' : 'text-amber-900 dark:text-amber-300'
          }`}
        >
          {live
            ? 'You will be redirected to Chapa to pay. This screen only shows success after Chapa verify credits your savings through the ledger.'
            : 'Chapa keys are not configured on the API, so checkout stays in mock mode. Success is shown only after you confirm the mock payment and verify posts the ledger. Wallet withdrawals are not offered here.'}
        </p>
        {ledgerAvailable !== null && (
          <p
            className={`mt-2 text-xs font-medium ${
              live ? 'text-emerald-950 dark:text-emerald-200' : 'text-amber-950 dark:text-amber-200'
            }`}
          >
            Available savings:{' '}
            <CurrencyDisplay amount={ledgerAvailable} size="sm" />
          </p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Deposit from mobile money (C2B)</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-3">
            <FormFieldGroup label="Amount (ETB)" htmlFor="momo-amount" required>
              <input
                id="momo-amount"
                inputMode="decimal"
                placeholder="1500.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={busy}
              />
            </FormFieldGroup>
            <FormFieldGroup label="Phone (optional)" htmlFor="momo-phone">
              <input
                id="momo-phone"
                inputMode="tel"
                placeholder="+251911234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={busy}
              />
            </FormFieldGroup>
            <p className="text-[11px] text-slate-500">
              Wallet {msisdn || 'missing'} · Savings {accountNumber || 'none'}
            </p>
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
              {live ? 'Pay with Chapa' : 'Start mock checkout'}
            </button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Withdraw to wallet (B2C)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Wallet withdrawals are not available in this release. Ask a teller to
            record a cash withdrawal — this screen will not mark a B2C payout as successful.
          </p>
        </CardContent>
      </Card>

      {checkout && badge && (
        <Card>
          <CardHeader>
            <CardTitle>Checkout {checkout.txRef}</CardTitle>
            <StatusBadge status={badge.status} label={badge.label} size="sm" />
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <p>
              Amount <CurrencyDisplay amount={checkout.amount} size="sm" /> · {checkout.mode === 'live' ? 'Live' : 'Mock'}
            </p>
            {checkout.status === 'pending' && (
              <p className="font-medium text-amber-800 dark:text-amber-300">
                Not credited yet. The ledger posts only after verification succeeds.
              </p>
            )}
            {checkout.status === 'paid' && (
              <p className="font-medium text-emerald-800 dark:text-emerald-300">
                Savings credited. Reference {checkout.txRef}
              </p>
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => void onRefresh()}
                disabled={busy}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold disabled:opacity-60"
              >
                Verify status
              </button>
              {checkout.mode === 'mock' && checkout.status === 'pending' && (
                <button
                  type="button"
                  onClick={() => void onMockComplete()}
                  disabled={busy}
                  className="px-3 py-1.5 rounded-lg bg-midnight text-gold dark:bg-gold dark:text-midnight text-xs font-bold disabled:opacity-60"
                >
                  Simulate Chapa success
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
