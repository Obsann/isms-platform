'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ApiRequestError } from '@/lib/api-client';
import { getMemberBalance, getMemberLoans } from '@/lib/api-client/member-self-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { CurrencyDisplay } from '@/components/currency/CurrencyDisplay';
import { FormFieldGroup } from '@/components/forms/FormFieldGroup';
import { StatusBadge } from '@/components/badges/StatusBadge';
import { isValidAmountDecimal } from '@/lib/money';
import {
  buildB2CPayload,
  buildC2BPayload,
  readMockedMomoRequests,
  saveMockedMomoRequest,
  type MomoProvider,
  type MockedMomoRequest,
} from '@/lib/momo-mock';
import type { Amount, Member } from '@/types';

const PROVIDERS: { id: MomoProvider; label: string }[] = [
  { id: 'telebirr', label: 'Telebirr' },
  { id: 'mpesa', label: 'M-PESA Ethiopia' },
  { id: 'cbe_birr', label: 'CBE Birr' },
];

function toAmount(raw: string): Amount | null {
  const trimmed = raw.trim();
  if (!isValidAmountDecimal(trimmed)) return null;
  const [whole, fraction = ''] = trimmed.split('.');
  return `${whole}.${fraction.padEnd(2, '0')}`;
}

export default function MemberMobileMoneyView({ member }: { member: Member }) {
  const [ledgerAvailable, setLedgerAvailable] = useState<string | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [loanId, setLoanId] = useState<string | null>(null);
  const [direction, setDirection] = useState<'c2b' | 'b2c'>('c2b');
  const [provider, setProvider] = useState<MomoProvider>('telebirr');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [mocks, setMocks] = useState<MockedMomoRequest[]>([]);

  const msisdn = member.phone || '';

  useEffect(() => {
    setMocks(readMockedMomoRequests());
    let cancelled = false;
    Promise.all([getMemberBalance(member.id), getMemberLoans(member.id)])
      .then(([balance, loans]) => {
        if (cancelled) return;
        const savings = balance.accounts.find((account) => account.type === 'savings') ?? balance.accounts[0];
        setAccountNumber(savings?.accountNumber ?? '');
        setLedgerAvailable(savings?.availableBalance ?? '0.00');
        const loan = loans.loans.find((row) => row.disbursedAmount) ?? loans.loans[0];
        setLoanId(loan?.loanId ?? null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ApiRequestError ? err.message : 'Could not load account details for the mock.');
      });
    return () => {
      cancelled = true;
    };
  }, [member.id]);

  const latest = mocks[0];
  const pendingCopy = useMemo(
    () => 'Pending confirmation — mock only. No money moved and the ledger was not posted.',
    [],
  );

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const parsed = toAmount(amount);
    if (!parsed) {
      setError('Enter a valid amount such as 1500.00.');
      return;
    }
    if (!msisdn) {
      setError('Your member record has no phone number, so a mock wallet request cannot be built.');
      return;
    }
    if (direction === 'c2b' && !accountNumber) {
      setError('You need a savings account number before a mock C2B deposit can be staged.');
      return;
    }

    const id = crypto.randomUUID();
    if (direction === 'c2b') {
      const payload = buildC2BPayload({
        provider,
        memberId: member.id,
        accountNumber,
        msisdn,
        amount: parsed,
      });
      setMocks(saveMockedMomoRequest({ id, direction: 'c2b', label: 'Wallet deposit (C2B)', payload }));
    } else {
      const payload = buildB2CPayload({
        provider,
        memberId: member.id,
        loanId,
        msisdn,
        amount: parsed,
      });
      setMocks(saveMockedMomoRequest({ id, direction: 'b2c', label: 'Wallet disbursement (B2C)', payload }));
    }
    setAmount('');
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-4">
        <p className="text-sm font-bold text-amber-950 dark:text-amber-200">Mock flow — pending confirmation</p>
        <p className="mt-1 text-xs text-amber-900 dark:text-amber-300 leading-relaxed">
          Live mobile money is out of scope. This screen only builds the documented C2B/B2C webhook
          shape and leaves it as <strong>pending confirmation</strong>. It never marks a deposit or
          disbursement successful, and it never posts to the ledger.
        </p>
        {ledgerAvailable !== null && (
          <p className="mt-2 text-xs font-medium text-amber-950 dark:text-amber-200">
            Live available savings (unchanged by this mock):{' '}
            <CurrencyDisplay amount={ledgerAvailable} size="sm" />
          </p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stage a mock request</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-3">
            <FormFieldGroup label="Flow" htmlFor="momo-direction">
              <select
                id="momo-direction"
                value={direction}
                onChange={(e) => setDirection(e.target.value as 'c2b' | 'b2c')}
              >
                <option value="c2b">C2B — deposit from wallet to savings</option>
                <option value="b2c">B2C — disbursement to wallet</option>
              </select>
            </FormFieldGroup>
            <FormFieldGroup label="Provider" htmlFor="momo-provider">
              <select
                id="momo-provider"
                value={provider}
                onChange={(e) => setProvider(e.target.value as MomoProvider)}
              >
                {PROVIDERS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </FormFieldGroup>
            <FormFieldGroup label="Amount (ETB)" htmlFor="momo-amount" required>
              <input
                id="momo-amount"
                inputMode="decimal"
                placeholder="1500.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </FormFieldGroup>
            <p className="text-[11px] text-slate-500">
              Wallet {msisdn || 'missing'} · Savings {accountNumber || 'none'}
              {direction === 'b2c' && loanId ? ` · Loan ${loanId}` : ''}
            </p>
            {error && (
              <p className="text-sm font-semibold text-rose-600" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-midnight text-gold dark:bg-gold dark:text-midnight text-xs font-bold"
            >
              Stage pending request
            </button>
          </form>
        </CardContent>
      </Card>

      {latest && (
        <Card>
          <CardHeader>
            <CardTitle>{latest.label}</CardTitle>
            <StatusBadge status="pending" label="Pending confirmation" size="sm" />
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <p className="font-medium text-amber-800 dark:text-amber-300">{pendingCopy}</p>
            <p>
              Provider ref <span className="font-mono">{latest.payload.providerReference}</span>
            </p>
            <p>
              Amount <CurrencyDisplay amount={latest.payload.amount} size="sm" />
            </p>
            <p>Status in payload: {latest.payload.status}</p>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-950 text-slate-100 p-3 text-[11px] leading-relaxed">
              {JSON.stringify(latest.payload, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {mocks.length > 1 && (
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Earlier mock requests</h2>
          {mocks.slice(1).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-xs"
            >
              <div>
                <p className="font-semibold">{item.label}</p>
                <p className="font-mono text-slate-500">{item.payload.providerReference}</p>
              </div>
              <StatusBadge status="pending" label="Pending confirmation" size="sm" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
