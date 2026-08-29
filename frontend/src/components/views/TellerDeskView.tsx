'use client';

/**
 * frontend/src/components/views/TellerDeskView.tsx
 *
 * Compact, professional Teller Desk Workstation (Task 14).
 * Account-Lookup-First workflow with real-time optimistic balance updates,
 * server reconciliation, rollback protection, and full light/dark theme support.
 */

import React, { useState, useCallback, useId } from 'react';
import {
  Search,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  CreditCard,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Receipt,
  Clock,
  ArrowRightLeft,
  ShieldCheck,
  Check,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { FormFieldGroup } from '@/components/forms/FormFieldGroup';
import { StatusBadge } from '@/components/badges/StatusBadge';
import { formatAmount } from '@/components/format';
import { isValidAmountDecimal, addAmounts, subtractAmounts, amountGreaterThan } from '@/lib/money';
import { ApiRequestError } from '@/lib/api-client';
import {
  getAccountBalance,
  createDeposit,
  createWithdrawal,
  createLoanRepayment,
  getLoan,
  resolveSavingsAccount,
} from '@/lib/api-client/teller';
import type {
  AccountBalance,
  LoanDetails,
  LoanRepaymentResult,
} from '@/lib/api-client/teller';
import type { Transaction, Amount } from '@/types';

// ---------------------------------------------------------------------------
// Helpers & Types
// ---------------------------------------------------------------------------

type TellerOp = 'deposit' | 'withdrawal' | 'loan-repayment';

interface PendingTx {
  id: string;
  type: TellerOp;
  amount: Amount;
  narration: string;
  status: 'pending' | 'confirmed' | 'failed';
  serverTx?: Transaction;
  repaymentResult?: LoanRepaymentResult;
  postedAt: string;
}

function generateTempId(): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return 'opt-' + Date.now() + '-' + rand;
}

function getErrorMessage(err: unknown): string {
  if (err instanceof ApiRequestError) {
    if (Array.isArray(err.messages) && err.messages.length > 0) {
      const msgs = err.messages.filter(
        (m) => typeof m === 'string' && m.trim().length > 0 && m !== '[object Object]',
      );
      if (msgs.length > 0) return msgs.join('. ');
    }
    if (typeof err.message === 'string' && err.message.trim().length > 0 && err.message !== '[object Object]') {
      return err.message;
    }
  }
  if (err instanceof Error) {
    if (typeof err.message === 'string' && err.message.trim().length > 0 && err.message !== '[object Object]') {
      return err.message;
    }
  }
  if (typeof err === 'string' && err.trim().length > 0 && err !== '[object Object]') {
    return err;
  }
  return 'An unexpected error occurred. Please try again.';
}

// ---------------------------------------------------------------------------
// AlertBanner
// ---------------------------------------------------------------------------

function AlertBanner({
  type,
  message,
  onDismiss,
}: {
  type: 'error' | 'success' | 'info';
  message: string;
  onDismiss?: () => void;
}) {
  const styles = {
    error: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50 text-rose-900 dark:text-rose-200 font-medium',
    success: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-200 font-medium',
    info: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/50 text-blue-900 dark:text-blue-200 font-medium',
  };
  const iconColor = {
    error: 'text-rose-700 dark:text-rose-400',
    success: 'text-emerald-700 dark:text-emerald-400',
    info: 'text-blue-700 dark:text-blue-400',
  };
  const Icon = type === 'error' ? XCircle : type === 'success' ? CheckCircle2 : Info;
  return (
    <div className={cn('flex items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-xs', styles[type])}>
      <Icon className={cn('w-4 h-4 shrink-0', iconColor[type])} />
      <p className="flex-1 leading-snug">{message}</p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="opacity-60 hover:opacity-100 transition-opacity text-sm leading-none p-0.5"
          aria-label="Dismiss"
        >
          &times;
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// DepositForm
// ---------------------------------------------------------------------------

function DepositForm({
  accountId,
  currentBalance,
  isMutating,
  onStartMutation,
  onEndMutation,
  onOptimistic,
  onSuccess,
  onRollback,
}: {
  accountId: string;
  currentBalance: AccountBalance;
  isMutating: boolean;
  onStartMutation: () => void;
  onEndMutation: () => void;
  onOptimistic: (tx: PendingTx, newBalance: Amount) => void;
  onSuccess: (tempId: string, tx: Transaction, balanceAfter: Amount) => void;
  onRollback: (tempId: string, snapshot: AccountBalance) => void;
}) {
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [narration, setNarration] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const amountId = useId();
  const refId = useId();
  const narrId = useId();

  const amountError = (() => {
    if (!amount) return undefined;
    if (!isValidAmountDecimal(amount)) return 'Enter a valid positive decimal (e.g. 500.00)';
    return undefined;
  })();

  const canSubmit =
    !isSubmitting &&
    !isMutating &&
    isValidAmountDecimal(amount) &&
    !amountError &&
    reference.trim().length <= 128 &&
    narration.trim().length <= 255;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);

    const tempId = generateTempId();
    const snapshot: AccountBalance = { ...currentBalance };
    const trimmedAmount = amount.trim();

    const optimisticTx: PendingTx = {
      id: tempId,
      type: 'deposit',
      amount: trimmedAmount,
      narration: narration.trim() || reference.trim() || 'Cash Deposit',
      status: 'pending',
      postedAt: new Date().toISOString(),
    };

    const optimisticBal = addAmounts(currentBalance.balance, trimmedAmount);
    onStartMutation();
    onOptimistic(optimisticTx, optimisticBal);
    setIsSubmitting(true);

    try {
      const tx = await createDeposit(accountId, {
        amount: trimmedAmount,
        reference: reference.trim() || undefined,
        narration: narration.trim() || undefined,
      });
      onSuccess(tempId, tx, tx.balanceAfter);
      setAmount('');
      setReference('');
      setNarration('');
    } catch (err) {
      setError(getErrorMessage(err));
      onRollback(tempId, snapshot);
    } finally {
      setIsSubmitting(false);
      onEndMutation();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      {error && <AlertBanner type="error" message={error} onDismiss={() => setError(null)} />}

      <FormFieldGroup
        label="Deposit Amount (ETB)"
        htmlFor={amountId}
        required
        error={amountError}
        helperText="Exact amount to credit to this savings account"
      >
        <input
          id={amountId}
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="font-mono text-base font-semibold"
          disabled={isSubmitting || isMutating}
        />
      </FormFieldGroup>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormFieldGroup label="Reference" htmlFor={refId} helperText="Optional receipt ref">
          <input
            id={refId}
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="DEP-2024-001"
            className="text-xs"
            disabled={isSubmitting || isMutating}
          />
        </FormFieldGroup>

        <FormFieldGroup label="Narration" htmlFor={narrId} helperText="Optional description">
          <input
            id={narrId}
            type="text"
            value={narration}
            onChange={(e) => setNarration(e.target.value)}
            placeholder="Cash counter deposit"
            className="text-xs"
            disabled={isSubmitting || isMutating}
          />
        </FormFieldGroup>
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Posting Deposit...</span>
          </>
        ) : (
          <>
            <ArrowDownCircle className="w-3.5 h-3.5" />
            <span>Post Cash Deposit</span>
          </>
        )}
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// WithdrawalForm
// ---------------------------------------------------------------------------

function WithdrawalForm({
  accountId,
  currentBalance,
  isMutating,
  onStartMutation,
  onEndMutation,
  onOptimistic,
  onSuccess,
  onRollback,
}: {
  accountId: string;
  currentBalance: AccountBalance;
  isMutating: boolean;
  onStartMutation: () => void;
  onEndMutation: () => void;
  onOptimistic: (tx: PendingTx, newBalance: Amount) => void;
  onSuccess: (tempId: string, tx: Transaction, balanceAfter: Amount) => void;
  onRollback: (tempId: string, snapshot: AccountBalance) => void;
}) {
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [narration, setNarration] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const amountId = useId();
  const refId = useId();
  const narrId = useId();

  const available = currentBalance.availableBalance;

  const amountError = (() => {
    if (!amount) return undefined;
    if (!isValidAmountDecimal(amount)) return 'Enter a valid positive decimal (e.g. 500.00)';
    try {
      if (amountGreaterThan(amount.trim(), available)) {
        return `Exceeds available balance of ${formatAmount(available)} ETB`;
      }
    } catch {
      return 'Invalid amount';
    }
    return undefined;
  })();

  const canSubmit =
    !isSubmitting &&
    !isMutating &&
    isValidAmountDecimal(amount) &&
    !amountError &&
    reference.trim().length <= 128 &&
    narration.trim().length <= 255;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);

    const tempId = generateTempId();
    const snapshot: AccountBalance = { ...currentBalance };
    const trimmedAmount = amount.trim();

    const optimisticTx: PendingTx = {
      id: tempId,
      type: 'withdrawal',
      amount: trimmedAmount,
      narration: narration.trim() || reference.trim() || 'Cash Withdrawal',
      status: 'pending',
      postedAt: new Date().toISOString(),
    };

    let optimisticBal: Amount = currentBalance.balance;
    try {
      optimisticBal = subtractAmounts(currentBalance.balance, trimmedAmount);
    } catch {}

    onStartMutation();
    onOptimistic(optimisticTx, optimisticBal);
    setIsSubmitting(true);

    try {
      const tx = await createWithdrawal(accountId, {
        amount: trimmedAmount,
        reference: reference.trim() || undefined,
        narration: narration.trim() || undefined,
      });
      onSuccess(tempId, tx, tx.balanceAfter);
      setAmount('');
      setReference('');
      setNarration('');
    } catch (err) {
      setError(getErrorMessage(err));
      onRollback(tempId, snapshot);
    } finally {
      setIsSubmitting(false);
      onEndMutation();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      {error && <AlertBanner type="error" message={error} onDismiss={() => setError(null)} />}

      <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-900 dark:text-amber-300">
        <span className="flex items-center gap-1.5 font-medium">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          Max Withdrawable:
        </span>
        <span className="font-mono font-bold">{formatAmount(available)} ETB</span>
      </div>

      <FormFieldGroup
        label="Withdrawal Amount (ETB)"
        htmlFor={amountId}
        required
        error={amountError}
        helperText="Must not exceed available balance"
      >
        <input
          id={amountId}
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="font-mono text-base font-semibold"
          disabled={isSubmitting || isMutating}
        />
      </FormFieldGroup>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormFieldGroup label="Reference" htmlFor={refId} helperText="Optional receipt ref">
          <input
            id={refId}
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="WTH-2024-001"
            className="text-xs"
            disabled={isSubmitting || isMutating}
          />
        </FormFieldGroup>

        <FormFieldGroup label="Narration" htmlFor={narrId} helperText="Optional description">
          <input
            id={narrId}
            type="text"
            value={narration}
            onChange={(e) => setNarration(e.target.value)}
            placeholder="Counter member withdrawal"
            className="text-xs"
            disabled={isSubmitting || isMutating}
          />
        </FormFieldGroup>
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Processing Withdrawal...</span>
          </>
        ) : (
          <>
            <ArrowUpCircle className="w-3.5 h-3.5" />
            <span>Post Cash Withdrawal</span>
          </>
        )}
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// LoanRepaymentForm
// ---------------------------------------------------------------------------

function LoanRepaymentForm({
  isMutating,
  onStartMutation,
  onEndMutation,
  onOptimistic,
  onSuccess,
  onRollback,
}: {
  isMutating: boolean;
  onStartMutation: () => void;
  onEndMutation: () => void;
  onOptimistic: (tx: PendingTx) => void;
  onSuccess: (tempId: string, result: LoanRepaymentResult) => void;
  onRollback: (tempId: string) => void;
}) {
  const [loanId, setLoanId] = useState('');
  const [loanDetails, setLoanDetails] = useState<LoanDetails | null>(null);
  const [isLoadingLoan, setIsLoadingLoan] = useState(false);
  const [loanError, setLoanError] = useState<string | null>(null);

  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<LoanRepaymentResult | null>(null);

  const loanInputId = useId();
  const amountId = useId();
  const refId = useId();

  const handleLoadLoan = async () => {
    const id = loanId.trim();
    if (!id) return;
    setIsLoadingLoan(true);
    setLoanError(null);
    setLoanDetails(null);
    setReceipt(null);
    try {
      const loan = await getLoan(id);
      setLoanDetails(loan);
    } catch (err) {
      setLoanError(getErrorMessage(err));
    } finally {
      setIsLoadingLoan(false);
    }
  };

  const amountError = (() => {
    if (!amount) return undefined;
    if (!isValidAmountDecimal(amount)) return 'Enter a valid positive decimal (e.g. 500.00)';
    return undefined;
  })();

  const isLoanActive = loanDetails ? ['disbursed', 'repaying'].includes(loanDetails.status) : false;

  const canSubmit =
    !isSubmitting &&
    !isMutating &&
    loanDetails !== null &&
    isLoanActive &&
    isValidAmountDecimal(amount) &&
    !amountError;

  const handleRepay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !loanDetails) return;
    setSubmitError(null);

    const tempId = generateTempId();
    const trimmedAmount = amount.trim();
    const pendingTx: PendingTx = {
      id: tempId,
      type: 'loan-repayment',
      amount: trimmedAmount,
      narration: reference.trim() || `Loan repayment #${loanDetails.loanNumber}`,
      status: 'pending',
      postedAt: new Date().toISOString(),
    };

    onStartMutation();
    onOptimistic(pendingTx);
    setIsSubmitting(true);

    try {
      const result = await createLoanRepayment(loanDetails.id, {
        amount: trimmedAmount,
        reference: reference.trim() || undefined,
      });
      onSuccess(tempId, result);
      setReceipt(result);
      setAmount('');
      setReference('');
    } catch (err) {
      setSubmitError(getErrorMessage(err));
      onRollback(tempId);
    } finally {
      setIsSubmitting(false);
      onEndMutation();
    }
  };

  return (
    <div className="space-y-3.5">
      <FormFieldGroup
        label="Loan UUID"
        htmlFor={loanInputId}
        required
        error={loanError ?? undefined}
        helperText="Enter loan UUID to fetch contract terms"
      >
        <div className="flex gap-2">
          <input
            id={loanInputId}
            type="text"
            value={loanId}
            onChange={(e) => {
              setLoanId(e.target.value);
              setLoanDetails(null);
              setLoanError(null);
              setReceipt(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleLoadLoan();
            }}
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            className="flex-1 font-mono text-xs"
            disabled={isMutating}
          />
          <button
            type="button"
            onClick={handleLoadLoan}
            disabled={isLoadingLoan || !loanId.trim() || isMutating}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-midnight text-gold hover:bg-midnight-light dark:bg-gold dark:text-midnight dark:hover:bg-gold-light disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
          >
            {isLoadingLoan ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
            <span>Fetch</span>
          </button>
        </div>
      </FormFieldGroup>

      {loanDetails && (
        <div className="p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 dark:text-slate-200">
              Loan #{loanDetails.loanNumber}
            </span>
            <StatusBadge status={loanDetails.status as any} size="sm" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
            <div>
              <span className="text-slate-400 dark:text-slate-500 block">Requested</span>
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                {formatAmount(loanDetails.requestedAmount)} ETB
              </span>
            </div>
            {loanDetails.disbursedAmount && (
              <div>
                <span className="text-slate-400 dark:text-slate-500 block">Disbursed</span>
                <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                  {formatAmount(loanDetails.disbursedAmount)} ETB
                </span>
              </div>
            )}
            <div>
              <span className="text-slate-400 dark:text-slate-500 block">Term</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {loanDetails.termMonths} mos
              </span>
            </div>
          </div>
        </div>
      )}

      {loanDetails && isLoanActive && !receipt && (
        <form onSubmit={handleRepay} className="space-y-3 pt-1">
          {submitError && <AlertBanner type="error" message={submitError} onDismiss={() => setSubmitError(null)} />}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormFieldGroup label="Repayment Amount (ETB)" htmlFor={amountId} required error={amountError}>
              <input
                id={amountId}
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="font-mono text-base font-semibold"
                disabled={isSubmitting || isMutating}
              />
            </FormFieldGroup>

            <FormFieldGroup label="Reference" htmlFor={refId}>
              <input
                id={refId}
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="RPY-2024-001"
                className="text-xs"
                disabled={isSubmitting || isMutating}
              />
            </FormFieldGroup>
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Posting Repayment...</span>
              </>
            ) : (
              <>
                <CreditCard className="w-3.5 h-3.5" />
                <span>Post Loan Repayment</span>
              </>
            )}
          </button>
        </form>
      )}

      {receipt && (
        <div className="p-3 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-xs text-emerald-800 dark:text-emerald-200 space-y-1.5 font-mono">
          <div className="flex items-center gap-1.5 font-bold font-sans text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>Repayment Posted Successfully</span>
          </div>
          <p>ID: {receipt.repaymentId}</p>
          <p>Amount: {formatAmount(receipt.amount)} ETB</p>
          <button
            type="button"
            onClick={() => {
              setReceipt(null);
              setAmount('');
              setReference('');
            }}
            className="mt-1 text-xs text-emerald-700 dark:text-emerald-400 underline font-sans font-semibold block"
          >
            Post another repayment
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Operation Tabs
// ---------------------------------------------------------------------------

const OPS: { key: TellerOp; label: string; icon: React.ReactNode }[] = [
  { key: 'deposit', label: 'Deposit', icon: <ArrowDownCircle className="w-3.5 h-3.5" /> },
  { key: 'withdrawal', label: 'Withdrawal', icon: <ArrowUpCircle className="w-3.5 h-3.5" /> },
  { key: 'loan-repayment', label: 'Loan Repay', icon: <CreditCard className="w-3.5 h-3.5" /> },
];

// ---------------------------------------------------------------------------
// Main TellerDeskView
// ---------------------------------------------------------------------------

export function TellerDeskView() {
  const [lookupInput, setLookupInput] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [accountId, setAccountId] = useState<string>('');
  const [balance, setBalance] = useState<AccountBalance | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [activeOp, setActiveOp] = useState<TellerOp>('deposit');
  const [txFeed, setTxFeed] = useState<PendingTx[]>([]);
  const [sessionMsg, setSessionMsg] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const lookupInputId = useId();

  const handleAccountLookup = useCallback(async (idToFetch?: string) => {
    const rawId = (idToFetch ?? lookupInput).trim();
    if (!rawId) return;

    setIsLookingUp(true);
    setLookupError(null);
    setSessionMsg(null);

    try {
      const bal = await resolveSavingsAccount(rawId);
      setAccountId(bal.accountId);
      setBalance(bal);
      setTxFeed([]);
      setSessionMsg({
        type: 'info',
        text: `Account ${bal.accountId} loaded. Ready for transactions.`,
      });
    } catch (err) {
      setLookupError(getErrorMessage(err));
      setAccountId('');
      setBalance(null);
      setTxFeed([]);
    } finally {
      setIsLookingUp(false);
    }
  }, [lookupInput]);

  const handleRefreshBalance = useCallback(async () => {
    if (!accountId) return;
    setIsRefreshing(true);
    try {
      const fresh = await getAccountBalance(accountId);
      setBalance(fresh);
    } catch (err) {
      setSessionMsg({
        type: 'error',
        text: 'Failed to refresh balance: ' + getErrorMessage(err),
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [accountId]);

  const handleStartMutation = useCallback(() => setIsMutating(true), []);
  const handleEndMutation = useCallback(() => setIsMutating(false), []);

  const handleOptimistic = useCallback(
    (pendingTx: PendingTx, newBalance?: Amount) => {
      setTxFeed((prev) => [pendingTx, ...prev]);
      if (newBalance !== undefined) {
        setBalance((prev) => {
          if (!prev) return prev;
          let newAvailable = newBalance;
          try {
            if (isValidAmountDecimal(prev.heldAmount)) {
              newAvailable = subtractAmounts(newBalance, prev.heldAmount);
            }
          } catch {
            newAvailable = newBalance;
          }
          return {
            ...prev,
            balance: newBalance,
            availableBalance: newAvailable,
          };
        });
      }
    },
    [],
  );

  const handleTxSuccess = useCallback(
    (tempId: string, tx: Transaction, balanceAfter: Amount) => {
      setTxFeed((prev) =>
        prev.map((item) => {
          if (item.id === tempId) {
            return {
              ...item,
              id: tx.id,
              amount: tx.amount,
              narration: tx.narration || tx.reference || item.narration,
              postedAt: tx.postedAt,
              status: 'confirmed',
              serverTx: tx,
            };
          }
          return item;
        }),
      );
      setBalance((prev) => {
        if (!prev) return prev;
        let newAvailable = balanceAfter;
        try {
          if (isValidAmountDecimal(prev.heldAmount)) {
            newAvailable = subtractAmounts(balanceAfter, prev.heldAmount);
          }
        } catch {
          newAvailable = balanceAfter;
        }
        return {
          ...prev,
          balance: balanceAfter,
          availableBalance: newAvailable,
        };
      });
      setSessionMsg({ type: 'success', text: 'Transaction posted and reconciled.' });
    },
    [],
  );

  const handleRollback = useCallback(
    (tempId: string, snapshot: AccountBalance) => {
      setTxFeed((prev) =>
        prev.map((item) =>
          item.id === tempId ? { ...item, status: 'failed' } : item,
        ),
      );
      setBalance(snapshot);
    },
    [],
  );

  const handleRepaymentSuccess = useCallback(
    (tempId: string, result: LoanRepaymentResult) => {
      setTxFeed((prev) =>
        prev.map((item) => {
          if (item.id === tempId) {
            return {
              ...item,
              id: result.repaymentId,
              amount: result.amount,
              narration: result.reference || item.narration,
              postedAt: result.paidAt,
              status: 'confirmed',
              repaymentResult: result,
            };
          }
          return item;
        }),
      );
      setSessionMsg({
        type: 'success',
        text: `Loan repayment of ${formatAmount(result.amount)} ETB posted.`,
      });
    },
    [],
  );

  const handleRepaymentRollback = useCallback((tempId: string) => {
    setTxFeed((prev) =>
      prev.map((item) =>
        item.id === tempId ? { ...item, status: 'failed' } : item,
      ),
    );
  }, []);

  const handleClearAccount = useCallback(() => {
    setLookupInput('');
    setAccountId('');
    setBalance(null);
    setLookupError(null);
    setSessionMsg(null);
    setTxFeed([]);
  }, []);

  return (
    <div className="space-y-4">
      {/* Compact Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-serif tracking-tight">
            Teller Desk
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            Process account transactions securely and in real time.
          </p>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
          <span>Double-Entry Arithmetic</span>
        </div>
      </div>

      {/* Session Alert */}
      {sessionMsg && (
        <AlertBanner
          type={sessionMsg.type}
          message={sessionMsg.text}
          onDismiss={() => setSessionMsg(null)}
        />
      )}

      {/* Account Lookup Bar (1 compact row on desktop) */}
      <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAccountLookup();
          }}
          className="flex flex-col sm:flex-row sm:items-center gap-2.5"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 shrink-0">
            <Search className="w-4 h-4 text-amber-800 dark:text-gold" />
            <label htmlFor={lookupInputId}>Member or account:</label>
          </div>

          <input
            id={lookupInputId}
            type="text"
            value={lookupInput}
            onChange={(e) => {
              setLookupInput(e.target.value);
              setLookupError(null);
            }}
            placeholder="MEM-10001, Abebe, or account UUID"
            className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/80 text-xs font-mono text-slate-900 dark:text-slate-100 outline-none focus:border-gold focus:ring-1 focus:ring-gold/30 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            disabled={isMutating}
          />

          <button
            type="submit"
            disabled={isLookingUp || !lookupInput.trim() || isMutating}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-midnight text-gold hover:bg-midnight-light dark:bg-gold dark:text-midnight dark:hover:bg-gold-light disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm shrink-0"
          >
            {isLookingUp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            <span>Look Up</span>
          </button>
        </form>

        {lookupError && (
          <p className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 mt-2 flex items-center gap-1">
            <span>⚠</span> {lookupError}
          </p>
        )}
      </div>

      {!accountId || !balance ? (
        /* Compact Empty State (140-180px) */
        <div className="py-10 px-4 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 flex flex-col items-center justify-center">
          <Wallet className="w-8 h-8 text-slate-400 dark:text-slate-600 mb-2" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No Account Loaded
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 max-w-sm font-medium">
            Look up an account UUID above to view balances and begin posting cash deposits, withdrawals, or loan repayments.
          </p>
        </div>
      ) : (
        /* Workstation Layout */
        <div className="space-y-4">
          {/* Account Summary Strip */}
          <div className="p-4 rounded-xl border border-gold/40 dark:border-gold/30 bg-white dark:bg-slate-900 shadow-sm space-y-3">
            {/* Top row: ID, Badge, Refresh, Switch */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs pb-2.5 border-b border-slate-200/70 dark:border-slate-800">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Account:
                </span>
                <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {accountId}
                </span>
                <StatusBadge status="active" size="sm" label="Active" />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleRefreshBalance}
                  disabled={isRefreshing || isMutating}
                  title="Refresh authoritative server balance"
                  className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors disabled:opacity-40"
                  aria-label="Refresh balance"
                >
                  <RefreshCw className={cn('w-3.5 h-3.5', isRefreshing && 'animate-spin text-gold')} />
                </button>
                <button
                  type="button"
                  onClick={handleClearAccount}
                  disabled={isMutating}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:text-midnight dark:hover:text-gold underline"
                >
                  <ArrowRightLeft className="w-3 h-3" />
                  <span>Switch</span>
                </button>
              </div>
            </div>

            {/* Metrics: Available Balance (Hero) + Sub-metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              <div className="sm:col-span-1 p-3 rounded-lg bg-midnight text-white dark:bg-slate-800 border border-white/10 dark:border-slate-700">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gold-light block">
                  Available Balance
                </span>
                <div className="text-xl font-bold font-mono text-gold mt-0.5">
                  {formatAmount(balance.availableBalance)} <span className="text-xs text-slate-300">ETB</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
                  Ledger Balance
                </span>
                <div className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5">
                  {formatAmount(balance.balance)} ETB
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
                  Held Amount
                </span>
                <div className="text-sm font-bold font-mono text-amber-800 dark:text-amber-400 mt-0.5">
                  {formatAmount(balance.heldAmount)} ETB
                </div>
              </div>
            </div>
          </div>

          {/* Workstation Grid: Transaction Form + Activity Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Left: Transaction Form (3 cols) */}
            <div className="lg:col-span-3">
              <Card>
                <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30">
                  {OPS.map((op) => (
                    <button
                      key={op.key}
                      type="button"
                      disabled={isMutating}
                      onClick={() => setActiveOp(op.key)}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-bold transition-all border-b-2 -mb-px disabled:opacity-50',
                        activeOp === op.key
                          ? 'border-gold text-midnight dark:text-gold bg-white dark:bg-slate-900 shadow-sm'
                          : 'border-transparent text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-800/50',
                      )}
                    >
                      <span>{op.icon}</span>
                      <span>{op.label}</span>
                    </button>
                  ))}
                </div>

                <CardContent className="p-4 sm:p-5">
                  {activeOp === 'deposit' && (
                    <DepositForm
                      accountId={accountId}
                      currentBalance={balance}
                      isMutating={isMutating}
                      onStartMutation={handleStartMutation}
                      onEndMutation={handleEndMutation}
                      onOptimistic={handleOptimistic}
                      onSuccess={handleTxSuccess}
                      onRollback={handleRollback}
                    />
                  )}
                  {activeOp === 'withdrawal' && (
                    <WithdrawalForm
                      accountId={accountId}
                      currentBalance={balance}
                      isMutating={isMutating}
                      onStartMutation={handleStartMutation}
                      onEndMutation={handleEndMutation}
                      onOptimistic={handleOptimistic}
                      onSuccess={handleTxSuccess}
                      onRollback={handleRollback}
                    />
                  )}
                  {activeOp === 'loan-repayment' && (
                    <LoanRepaymentForm
                      isMutating={isMutating}
                      onStartMutation={handleStartMutation}
                      onEndMutation={handleEndMutation}
                      onOptimistic={(tx) => handleOptimistic(tx)}
                      onSuccess={handleRepaymentSuccess}
                      onRollback={handleRepaymentRollback}
                    />
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right: Activity Feed Table (2 cols) */}
            <div className="lg:col-span-2">
              <Card className="h-full flex flex-col">
                <CardHeader className="py-2.5 px-4">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-800 dark:text-gold shrink-0" />
                    <CardTitle className="text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Session Activity Feed
                    </CardTitle>
                  </div>
                  <span className="text-[10px] font-mono font-semibold text-slate-600 dark:text-slate-400">
                    {txFeed.length} {txFeed.length === 1 ? 'item' : 'items'}
                  </span>
                </CardHeader>

                <div className="flex-1 overflow-y-auto max-h-[380px] divide-y divide-slate-200/70 dark:divide-slate-800">
                  {txFeed.length === 0 ? (
                    <div className="p-6 text-center text-xs font-medium text-slate-600 dark:text-slate-400">
                      No transactions in this session yet.
                    </div>
                  ) : (
                    txFeed.map((tx) => {
                      const isCredit = tx.type === 'deposit';
                      return (
                        <div key={tx.id} className="p-3 text-xs flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 dark:text-slate-100 capitalize truncate">
                                {tx.type.replace('-', ' ')}
                              </span>
                              <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono font-medium">
                                {new Date(tx.postedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </span>
                            </div>
                            {tx.serverTx?.reference && (
                              <p className="text-[10px] font-mono text-slate-600 dark:text-slate-400 truncate">
                                Ref: {tx.serverTx.reference}
                              </p>
                            )}
                            {tx.repaymentResult?.repaymentId && (
                              <p className="text-[10px] font-mono text-slate-600 dark:text-slate-400 truncate">
                                Repay ID: {tx.repaymentResult.repaymentId}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col items-end shrink-0 gap-0.5">
                            <span
                              className={cn(
                                'font-mono text-xs font-bold',
                                isCredit ? 'text-emerald-800 dark:text-emerald-400' : 'text-rose-800 dark:text-rose-400',
                              )}
                            >
                              {isCredit ? '+' : '-'}{formatAmount(tx.amount)} ETB
                            </span>
                            {tx.status === 'pending' && (
                              <span className="inline-flex items-center gap-1 text-[9px] text-amber-800 dark:text-amber-400 font-bold">
                                <Clock className="w-2.5 h-2.5 animate-spin" /> Pending
                              </span>
                            )}
                            {tx.status === 'confirmed' && (
                              <span className="inline-flex items-center gap-1 text-[9px] text-emerald-800 dark:text-emerald-400 font-bold">
                                <Check className="w-2.5 h-2.5" /> Confirmed
                              </span>
                            )}
                            {tx.status === 'failed' && (
                              <span className="inline-flex items-center gap-1 text-[9px] text-rose-800 dark:text-rose-400 font-bold">
                                <XCircle className="w-2.5 h-2.5" /> Rolled Back
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TellerDeskView;