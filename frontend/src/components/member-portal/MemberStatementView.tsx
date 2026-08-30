'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ApiRequestError } from '@/lib/api-client';
import { getMemberStatement, type MemberStatementView } from '@/lib/api-client/member-self-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { CurrencyDisplay } from '@/components/currency/CurrencyDisplay';
import { FormFieldGroup } from '@/components/forms/FormFieldGroup';
import type { Member, TransactionType } from '@/types';

function typeLabel(type: TransactionType): string {
  return type.replace(/-/g, ' ');
}

export default function MemberStatementView({ member }: { member: Member }) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [appliedFrom, setAppliedFrom] = useState('');
  const [appliedTo, setAppliedTo] = useState('');
  const [data, setData] = useState<MemberStatementView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getMemberStatement(member.id, {
      from: appliedFrom || undefined,
      to: appliedTo || undefined,
      limit: 100,
    })
      .then((view) => {
        if (!cancelled) setData(view);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ApiRequestError ? err.message : 'Could not load your statement.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [member.id, appliedFrom, appliedTo]);

  function onRequest(event: FormEvent) {
    event.preventDefault();
    setAppliedFrom(from);
    setAppliedTo(to);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Statement request</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onRequest} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
            <FormFieldGroup label="From" htmlFor="statement-from" helperText="YYYY-MM-DD">
              <input id="statement-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </FormFieldGroup>
            <FormFieldGroup label="To" htmlFor="statement-to" helperText="YYYY-MM-DD">
              <input id="statement-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </FormFieldGroup>
            <button
              type="submit"
              className="h-10 px-4 rounded-lg bg-midnight text-gold dark:bg-gold dark:text-midnight text-xs font-bold"
            >
              Request statement
            </button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <p className="text-sm font-semibold text-rose-600" role="alert">
          {error}
        </p>
      )}

      {loading && (
        <p className="text-sm text-slate-600 dark:text-slate-400" role="status">
          Loading statement from the ledger…
        </p>
      )}

      {!loading && data && data.transactions.length === 0 && (
        <p className="text-sm text-slate-600 dark:text-slate-400">No postings in this period.</p>
      )}

      {!loading && data && data.transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              {data.fullName} · {data.transactions.length} posting{data.transactions.length === 1 ? '' : 's'}
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-2 font-bold">Posted</th>
                  <th className="px-4 py-2 font-bold">Type</th>
                  <th className="px-4 py-2 font-bold">Reference</th>
                  <th className="px-4 py-2 font-bold text-right">Amount</th>
                  <th className="px-4 py-2 font-bold text-right">Balance after</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.map((tx) => (
                  <tr key={tx.id} className="border-t border-slate-200 dark:border-slate-800">
                    <td className="px-4 py-2 whitespace-nowrap">{new Date(tx.postedAt).toLocaleString()}</td>
                    <td className="px-4 py-2 capitalize">{typeLabel(tx.type)}</td>
                    <td className="px-4 py-2 font-mono">{tx.reference || tx.narration || '—'}</td>
                    <td className="px-4 py-2 text-right">
                      <CurrencyDisplay amount={tx.amount} size="sm" />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <CurrencyDisplay amount={tx.balanceAfter} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
