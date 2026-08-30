'use client';

import { useEffect, useState } from 'react';
import { ApiRequestError } from '@/lib/api-client';
import { getMemberBalance, type MemberBalanceView } from '@/lib/api-client/member-self-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { CurrencyDisplay } from '@/components/currency/CurrencyDisplay';
import { StatusBadge } from '@/components/badges/StatusBadge';
import { addAmounts } from '@/lib/money';
import type { Account, AccountStatus, Amount, Member } from '@/types';

function sumField(accounts: Account[], field: 'balance' | 'availableBalance' | 'heldAmount'): Amount {
  return accounts.reduce((total, account) => addAmounts(total, account[field]), '0.00');
}

function accountStatus(status: AccountStatus): 'active' | 'inactive' | 'closed' {
  if (status === 'active') return 'active';
  if (status === 'closed') return 'closed';
  return 'inactive';
}

export default function MemberBalanceView({ member }: { member: Member }) {
  const [data, setData] = useState<MemberBalanceView | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    getMemberBalance(member.id)
      .then((view) => {
        if (!cancelled) setData(view);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ApiRequestError ? err.message : 'Could not load your balances.');
      });
    return () => {
      cancelled = true;
    };
  }, [member.id]);

  if (error) {
    return <p className="text-sm font-semibold text-rose-600" role="alert">{error}</p>;
  }

  if (!data) {
    return (
      <p className="text-sm text-slate-600 dark:text-slate-400" role="status">
        Loading live balances…
      </p>
    );
  }

  const totalBalance = sumField(data.accounts, 'balance');
  const totalAvailable = sumField(data.accounts, 'availableBalance');
  const totalHeld = sumField(data.accounts, 'heldAmount');

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-600 dark:text-slate-400">
        {data.fullName} · {data.memberNumber} · snapshot {new Date(data.asOf).toLocaleString()}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardHeader>
            <CardTitle>Total balance</CardTitle>
          </CardHeader>
          <CardContent>
            <CurrencyDisplay amount={totalBalance} size="xl" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Available</CardTitle>
          </CardHeader>
          <CardContent>
            <CurrencyDisplay amount={totalAvailable} size="xl" colorCode="positive" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Held</CardTitle>
          </CardHeader>
          <CardContent>
            <CurrencyDisplay amount={totalHeld} size="xl" />
          </CardContent>
        </Card>
      </div>

      {data.accounts.length === 0 ? (
        <p className="text-sm text-slate-600 dark:text-slate-400">
          You have no savings or share accounts yet. A teller can open one at the desk.
        </p>
      ) : (
        <div className="space-y-3">
          {data.accounts.map((account) => (
            <Card key={account.id}>
              <CardHeader>
                <CardTitle className="font-mono text-sm">{account.accountNumber}</CardTitle>
                <StatusBadge
                  status={accountStatus(account.status)}
                  label={account.status}
                  size="sm"
                />
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="font-bold uppercase tracking-wider text-slate-500">Type</p>
                  <p className="mt-1 capitalize font-medium">{account.type}</p>
                </div>
                <div>
                  <p className="font-bold uppercase tracking-wider text-slate-500">Balance</p>
                  <div className="mt-1">
                    <CurrencyDisplay amount={account.balance} size="md" />
                  </div>
                </div>
                <div>
                  <p className="font-bold uppercase tracking-wider text-slate-500">Available</p>
                  <div className="mt-1">
                    <CurrencyDisplay amount={account.availableBalance} size="md" colorCode="positive" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
