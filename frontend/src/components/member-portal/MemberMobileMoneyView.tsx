'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { ApiRequestError } from '@/lib/api-client';
import {
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

/** Chapa sandbox success numbers — https://developer.chapa.co/test/testing-mobile */
const CHAPA_TEST_PHONE = '0900123456';

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

function statusBadge(status: ChapaPaymentView['status']) {
  if (status === 'paid') return { status: 'completed' as const, label: 'Paid — savings credited' };
  if (status === 'failed') return { status: 'failed' as const, label: 'Failed' };
  return { status: 'pending' as const, label: 'Waiting for Chapa' };
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
  const [ledgerAvailable, setLedgerAvailable] = useState<string | null>(null);
  const [accountId, setAccountId] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState(CHAPA_TEST_PHONE);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [checkout, setCheckout] = useState<ChapaPaymentView | null>(null);

  const live = mode === 'live';

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
        const savings =
          balance.accounts.find((account) => account.type === 'savings') ?? balance.accounts[0];
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
        const savings =
          balance.accounts.find((account) => account.type === 'savings') ?? balance.accounts[0];
        setAccountId(savings?.id ?? '');
        setAccountNumber(savings?.accountNumber ?? '');
        setLedgerAvailable(savings?.availableBalance ?? '0.00');
        if (status.mode !== 'live') {
          setError(
            'Chapa is not configured on the API. Paste CHAPA_SECRET_KEY into backend/.env and restart the API.',
          );
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ApiRequestError ? err.message : 'Could not load Chapa deposit.');
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

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 p-4">
        <p className="text-sm font-bold text-emerald-950 dark:text-emerald-200">Pay with Chapa</p>
        <p className="mt-1 text-xs leading-relaxed text-emerald-900 dark:text-emerald-300">
          You will be sent to Chapa hosted checkout. This screen credits savings only after Chapa
          verify succeeds. Sandbox test phones:{' '}
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

      <Card>
        <CardHeader>
          <CardTitle>Deposit to savings</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-3">
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
          </form>
        </CardContent>
      </Card>

      {checkout && badge && (
        <Card>
          <CardHeader>
            <CardTitle>Payment</CardTitle>
            <StatusBadge status={badge.status} label={badge.label} size="sm" />
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <p>
              Amount <CurrencyDisplay amount={checkout.amount} size="sm" /> · ref {checkout.txRef}
            </p>
            {checkout.status === 'pending' && (
              <p className="font-medium text-amber-800 dark:text-amber-300">
                Not credited yet. Use Verify after you finish on Chapa.
              </p>
            )}
            {checkout.status === 'paid' && (
              <p className="font-medium text-emerald-800 dark:text-emerald-300">
                Savings credited through the ledger.
              </p>
            )}
            <button
              type="button"
              onClick={() => void onRefresh()}
              disabled={busy}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold disabled:opacity-60"
            >
              Verify status
            </button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
