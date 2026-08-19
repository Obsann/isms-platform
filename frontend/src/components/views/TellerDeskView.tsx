'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import CurrencyDisplay from '@/components/currency/CurrencyDisplay';
import StatusBadge from '@/components/badges/StatusBadge';
import FormFieldGroup from '@/components/forms/FormFieldGroup';
import { useApp } from '@/contexts/AppContext';
import { ApiRequestError } from '@/lib/api-client';
import {
  createDeposit,
  createLoanRepayment,
  createWithdrawal,
  getAccountBalance,
  getLoan,
  getMember,
} from '@/lib/api-client/teller';
import {
  addAmounts,
  amountGreaterThan,
  isValidAmountDecimal,
  subtractAmounts,
} from '@/lib/money';
import type { AccountBalance, LoanRow, Member } from '@/types';
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  CreditCard,
  Landmark,
  Receipt,
  RefreshCw,
  Search,
  User,
  Wallet,
} from 'lucide-react';

type TabType = 'deposit' | 'withdrawal' | 'loan-repayment';

type TxState = 'NORMAL' | 'PENDING' | 'SERVER-SYNCED' | 'ROLLED-BACK';

export default function TellerDeskView() {
  const { showToast } = useApp();

  // Active Tab
  const [activeTab, setActiveTab] = useState<TabType>('deposit');

  // Account Lookup State
  const [searchAccountId, setSearchAccountId] = useState('');
  const [accountBalance, setAccountBalance] = useState<AccountBalance | null>(null);
  const [accountMember, setAccountMember] = useState<Member | null>(null);
  const [isAccountLoading, setIsAccountLoading] = useState(false);
  const [accountLookupError, setAccountLookupError] = useState<string | null>(null);

  // Loan Lookup State
  const [searchLoanId, setSearchLoanId] = useState('');
  const [loanData, setLoanData] = useState<LoanRow | null>(null);
  const [isLoanLoading, setIsLoanLoading] = useState(false);
  const [loanLookupError, setLoanLookupError] = useState<string | null>(null);

  // Form Fields - Deposit / Withdrawal
  const [amountInput, setAmountInput] = useState('');
  const [referenceInput, setReferenceInput] = useState('');
  const [narrationInput, setNarrationInput] = useState('');

  // Form Fields - Loan Repayment
  const [repayAmountInput, setRepayAmountInput] = useState('');
  const [repayReferenceInput, setRepayReferenceInput] = useState('');

  // Transaction Processing State & Audit
  const [txState, setTxState] = useState<TxState>('NORMAL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txErrorMessage, setTxErrorMessage] = useState<string | null>(null);
  const [txSuccessMessage, setTxSuccessMessage] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Account Lookup Handler
  // ---------------------------------------------------------------------------
  const handleAccountLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const id = searchAccountId.trim();
    if (!id) return;

    setIsAccountLoading(true);
    setAccountLookupError(null);
    setAccountBalance(null);
    setAccountMember(null);
    setTxState('NORMAL');
    setTxErrorMessage(null);
    setTxSuccessMessage(null);

    try {
      const balance = await getAccountBalance(id);
      setAccountBalance(balance);

      // Attempt to fetch associated member details if available
      try {
        // If account contains tenant/member info
        const member = await getMember(id);
        setAccountMember(member);
      } catch {
        // Ignore member 404, balance is primary
      }
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.statusCode === 404) {
          setAccountLookupError(`Account with ID "${id}" was not found.`);
        } else if (err.statusCode === 401 || err.statusCode === 403) {
          setAccountLookupError('Unauthorized to view this account.');
        } else {
          setAccountLookupError(err.messages.join('; '));
        }
      } else {
        setAccountLookupError('Failed to fetch account balance. Please check your network connection.');
      }
    } finally {
      setIsAccountLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Loan Lookup Handler
  // ---------------------------------------------------------------------------
  const handleLoanLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const id = searchLoanId.trim();
    if (!id) return;

    setIsLoanLoading(true);
    setLoanLookupError(null);
    setLoanData(null);
    setTxState('NORMAL');
    setTxErrorMessage(null);
    setTxSuccessMessage(null);

    try {
      const loan = await getLoan(id);
      setLoanData(loan);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.statusCode === 404) {
          setLoanLookupError(`Loan with ID "${id}" was not found.`);
        } else if (err.statusCode === 401 || err.statusCode === 403) {
          setLoanLookupError('Unauthorized to view this loan.');
        } else {
          setLoanLookupError(err.messages.join('; '));
        }
      } else {
        setLoanLookupError('Failed to fetch loan information. Please check your network connection.');
      }
    } finally {
      setIsLoanLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Deposit Handler (Optimistic UI)
  // ---------------------------------------------------------------------------
  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountBalance || isSubmitting) return;

    const amountStr = amountInput.trim();
    if (!isValidAmountDecimal(amountStr)) {
      setTxErrorMessage('Please enter a valid positive deposit amount (e.g. 100.00).');
      return;
    }

    setTxErrorMessage(null);
    setTxSuccessMessage(null);

    // 1. Snapshot previous balance
    const previousSnapshot = { ...accountBalance };

    // 2. Compute optimistic balance using safe decimal arithmetic
    const optimisticTotal = addAmounts(previousSnapshot.balance, amountStr);
    const optimisticAvailable = addAmounts(previousSnapshot.availableBalance, amountStr);

    // 3. Immediately update UI to optimistic state
    setAccountBalance({
      ...previousSnapshot,
      balance: optimisticTotal,
      availableBalance: optimisticAvailable,
    });
    setTxState('PENDING');
    setIsSubmitting(true);

    try {
      // 4. Send real API request
      await createDeposit(previousSnapshot.accountId, {
        amount: amountStr,
        reference: referenceInput.trim() || undefined,
        narration: narrationInput.trim() || undefined,
      });

      // 5. On Success: Reconcile silently with authoritative server balance
      const freshBalance = await getAccountBalance(previousSnapshot.accountId);
      setAccountBalance(freshBalance);
      setTxState('SERVER-SYNCED');
      setTxSuccessMessage(`Successfully deposited ${amountStr} ETB. Server state synchronized.`);
      showToast('Deposit Successful', `Deposited ${amountStr} ETB into Account ${previousSnapshot.accountId}`);

      // Clear input form
      setAmountInput('');
      setReferenceInput('');
      setNarrationInput('');
    } catch (err) {
      // 6. On Failure: Visibly roll back to snapshot
      setAccountBalance(previousSnapshot);
      setTxState('ROLLED-BACK');

      let errMsg = 'Deposit failed on server.';
      if (err instanceof ApiRequestError) {
        errMsg = err.messages.join('; ');
      } else if (err instanceof Error) {
        errMsg = err.message;
      }
      setTxErrorMessage(`Deposit Rejected: ${errMsg}. Restored balance to ${previousSnapshot.balance} ETB.`);
      showToast('Deposit Failed', errMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Withdrawal Handler (Optimistic UI)
  // ---------------------------------------------------------------------------
  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountBalance || isSubmitting) return;

    const amountStr = amountInput.trim();
    if (!isValidAmountDecimal(amountStr)) {
      setTxErrorMessage('Please enter a valid positive withdrawal amount (e.g. 50.00).');
      return;
    }

    // Client-side check against available balance
    if (amountGreaterThan(amountStr, accountBalance.availableBalance)) {
      setTxErrorMessage(
        `Withdrawal amount (${amountStr} ETB) exceeds current available balance (${accountBalance.availableBalance} ETB).`
      );
      return;
    }

    setTxErrorMessage(null);
    setTxSuccessMessage(null);

    // 1. Snapshot previous balance
    const previousSnapshot = { ...accountBalance };

    // 2. Compute optimistic reduced balance
    const optimisticTotal = subtractAmounts(previousSnapshot.balance, amountStr);
    const optimisticAvailable = subtractAmounts(previousSnapshot.availableBalance, amountStr);

    // 3. Immediately update UI to optimistic state
    setAccountBalance({
      ...previousSnapshot,
      balance: optimisticTotal,
      availableBalance: optimisticAvailable,
    });
    setTxState('PENDING');
    setIsSubmitting(true);

    try {
      // 4. Send real API request
      await createWithdrawal(previousSnapshot.accountId, {
        amount: amountStr,
        reference: referenceInput.trim() || undefined,
        narration: narrationInput.trim() || undefined,
      });

      // 5. On Success: Reconcile with authoritative server balance
      const freshBalance = await getAccountBalance(previousSnapshot.accountId);
      setAccountBalance(freshBalance);
      setTxState('SERVER-SYNCED');
      setTxSuccessMessage(`Successfully withdrew ${amountStr} ETB. Server state synchronized.`);
      showToast('Withdrawal Successful', `Withdrew ${amountStr} ETB from Account ${previousSnapshot.accountId}`);

      // Clear input form
      setAmountInput('');
      setReferenceInput('');
      setNarrationInput('');
    } catch (err) {
      // 6. On Failure: Visibly roll back to snapshot
      setAccountBalance(previousSnapshot);
      setTxState('ROLLED-BACK');

      let errMsg = 'Withdrawal failed on server.';
      if (err instanceof ApiRequestError) {
        errMsg = err.messages.join('; ');
      } else if (err instanceof Error) {
        errMsg = err.message;
      }
      setTxErrorMessage(`Withdrawal Rejected: ${errMsg}. Restored available balance to ${previousSnapshot.availableBalance} ETB.`);
      showToast('Withdrawal Failed', errMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Loan Repayment Handler (Optimistic UI)
  // ---------------------------------------------------------------------------
  const handleLoanRepaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loanData || isSubmitting) return;

    const amountStr = repayAmountInput.trim();
    if (!isValidAmountDecimal(amountStr)) {
      setTxErrorMessage('Please enter a valid positive repayment amount (e.g. 500.00).');
      return;
    }

    // Backend rule: only 'disbursed' loans accept repayments
    if (loanData.status !== 'disbursed') {
      setTxErrorMessage(`Loan is currently in '${loanData.status}' status. Only 'disbursed' loans can accept repayments.`);
      return;
    }

    setTxErrorMessage(null);
    setTxSuccessMessage(null);

    // 1. Snapshot previous loan data
    const previousSnapshot = { ...loanData };

    // 2. Set optimistic pending state
    setTxState('PENDING');
    setIsSubmitting(true);

    try {
      // 3. Send real API request
      await createLoanRepayment(previousSnapshot.id, {
        amount: amountStr,
        reference: repayReferenceInput.trim() || undefined,
      });

      // 4. Reconcile with updated loan state from server
      const freshLoan = await getLoan(previousSnapshot.id);
      setLoanData(freshLoan);
      setTxState('SERVER-SYNCED');
      setTxSuccessMessage(
        `Successfully posted loan repayment of ${amountStr} ETB. Updated loan status: ${freshLoan.status}.`
      );
      showToast('Loan Repayment Successful', `Recorded ${amountStr} ETB repayment for Loan ${previousSnapshot.loanNumber}`);

      // Clear input form
      setRepayAmountInput('');
      setRepayReferenceInput('');
    } catch (err) {
      // 5. On Failure: Restore snapshot
      setLoanData(previousSnapshot);
      setTxState('ROLLED-BACK');

      let errMsg = 'Loan repayment failed on server.';
      if (err instanceof ApiRequestError) {
        errMsg = err.messages.join('; ');
      } else if (err instanceof Error) {
        errMsg = err.message;
      }
      setTxErrorMessage(`Repayment Rejected: ${errMsg}. Preserved loan status as '${previousSnapshot.status}'.`);
      showToast('Loan Repayment Failed', errMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 rounded-2xl text-white shadow-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs uppercase tracking-wider mb-1">
            <Landmark className="w-4 h-4" />
            <span>Teller Operations</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Teller Desk</h1>
          <p className="text-sm text-slate-300 mt-1">
            Process optimistic deposits, withdrawals, and loan repayments with instant balance sync.
          </p>
        </div>

        {/* Transaction Sync Status Badge */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {txState === 'NORMAL' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              READY
            </span>
          )}
          {txState === 'PENDING' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              PROCESSING (OPTIMISTIC)
            </span>
          )}
          {txState === 'SERVER-SYNCED' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              SERVER SYNCED
            </span>
          )}
          {txState === 'ROLLED-BACK' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              ROLLED BACK
            </span>
          )}
        </div>
      </div>

      {/* Global State Banners */}
      {txSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-sm flex items-start gap-3 shadow-sm animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Transaction Confirmed: </span>
            {txSuccessMessage}
          </div>
        </div>
      )}

      {txErrorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-sm flex items-start gap-3 shadow-sm animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Transaction Failure & Rollback: </span>
            {txErrorMessage}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Account & Loan Lookup Panels */}
        <div className="lg:col-span-5 space-y-6">
          {/* Account Search Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-amber-600" />
                <CardTitle>Account Lookup</CardTitle>
              </div>
              <CardDescription>Enter account ID to view authoritative balances.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleAccountLookup} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Account ID (e.g. uuid)"
                  value={searchAccountId}
                  onChange={(e) => setSearchAccountId(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-amber-200"
                />
                <button
                  type="submit"
                  disabled={isAccountLoading || !searchAccountId.trim()}
                  className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-sm font-semibold hover:bg-slate-800 dark:hover:bg-slate-200 disabled:opacity-50 transition-colors flex items-center gap-1.5 shrink-0"
                >
                  {isAccountLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  <span>Lookup</span>
                </button>
              </form>

              {accountLookupError && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{accountLookupError}</span>
                </div>
              )}

              {accountBalance && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-2">
                    <span className="text-xs text-slate-500 font-medium">Account ID</span>
                    <span className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {accountBalance.accountId}
                    </span>
                  </div>

                  {accountMember && (
                    <div className="flex items-center gap-2.5 py-1">
                      <User className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          {accountMember.fullName}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {accountMember.memberNumber} • {accountMember.phone ?? 'No phone'}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Total Posted Balance</span>
                      <CurrencyDisplay value={accountBalance.balance} size="md" />
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Pledged Collateral Hold</span>
                      <CurrencyDisplay
                        value={accountBalance.heldAmount}
                        size="md"
                        colorCode={accountBalance.heldAmount !== '0.00' ? 'negative' : 'neutral'}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Available for Withdrawal
                      </span>
                      <CurrencyDisplay value={accountBalance.availableBalance} size="lg" colorCode="positive" />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Loan Search Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-600" />
                <CardTitle>Loan Lookup</CardTitle>
              </div>
              <CardDescription>Enter loan ID to inspect contract state for repayment.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleLoanLookup} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Loan ID (e.g. uuid)"
                  value={searchLoanId}
                  onChange={(e) => setSearchLoanId(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-amber-200"
                />
                <button
                  type="submit"
                  disabled={isLoanLoading || !searchLoanId.trim()}
                  className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-sm font-semibold hover:bg-slate-800 dark:hover:bg-slate-200 disabled:opacity-50 transition-colors flex items-center gap-1.5 shrink-0"
                >
                  {isLoanLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  <span>Lookup</span>
                </button>
              </form>

              {loanLookupError && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{loanLookupError}</span>
                </div>
              )}

              {loanData && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-2">
                    <span className="text-xs text-slate-500 font-medium">Loan No: {loanData.loanNumber}</span>
                    <StatusBadge status={loanData.status} size="sm" />
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Member ID</span>
                      <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                        {loanData.memberId}
                      </span>
                    </div>

                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Requested Principal</span>
                      <CurrencyDisplay value={loanData.requestedAmount} size="sm" />
                    </div>

                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Disbursed Principal</span>
                      <CurrencyDisplay value={loanData.disbursedAmount ?? '0.00'} size="sm" />
                    </div>

                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Term Length</span>
                      <span>{loanData.termMonths} Months</span>
                    </div>
                  </div>

                  {loanData.status !== 'disbursed' && (
                    <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        Repayments are accepted only for disbursed loans. Current status is &apos;{loanData.status}&apos;.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Transaction Processing Desk */}
        <div className="lg:col-span-7">
          <Card className="h-full flex flex-col">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle>Posting Workstation</CardTitle>
                  <CardDescription>Select transaction type and submit details.</CardDescription>
                </div>

                {/* Tab Switcher */}
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('deposit');
                      setTxErrorMessage(null);
                      setTxSuccessMessage(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      activeTab === 'deposit'
                        ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    <span>Deposit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('withdrawal');
                      setTxErrorMessage(null);
                      setTxSuccessMessage(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      activeTab === 'withdrawal'
                        ? 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Withdrawal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('loan-repayment');
                      setTxErrorMessage(null);
                      setTxSuccessMessage(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      activeTab === 'loan-repayment'
                        ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Loan Repayment</span>
                  </button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 flex-1 flex flex-col">
              {/* TAB 1: DEPOSIT */}
              {activeTab === 'deposit' && (
                <form onSubmit={handleDepositSubmit} className="space-y-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    {!accountBalance && (
                      <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Please lookup an Account ID on the left panel before submitting a deposit.</span>
                      </div>
                    )}

                    {accountBalance && (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-500 font-medium">Target Account</p>
                          <p className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200">
                            {accountBalance.accountId}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500 font-medium">Current Available</p>
                          <CurrencyDisplay value={accountBalance.availableBalance} size="md" colorCode="positive" />
                        </div>
                      </div>
                    )}

                    <FormFieldGroup
                      label="Deposit Amount (ETB)"
                      required
                      helperText="Decimal string with max 2 decimal places (e.g. 250.00)"
                    >
                      <input
                        type="text"
                        placeholder="0.00"
                        value={amountInput}
                        onChange={(e) => setAmountInput(e.target.value)}
                        disabled={!accountBalance || isSubmitting}
                      />
                    </FormFieldGroup>

                    <FormFieldGroup
                      label="Reference / Slip Number"
                      helperText="Teller receipt or voucher reference number"
                    >
                      <input
                        type="text"
                        placeholder="e.g. DEP-20260819-001"
                        value={referenceInput}
                        onChange={(e) => setReferenceInput(e.target.value)}
                        disabled={!accountBalance || isSubmitting}
                      />
                    </FormFieldGroup>

                    <FormFieldGroup
                      label="Narration / Note"
                      helperText="Optional teller note or deposit description"
                    >
                      <input
                        type="text"
                        placeholder="e.g. Over the counter cash deposit"
                        value={narrationInput}
                        onChange={(e) => setNarrationInput(e.target.value)}
                        disabled={!accountBalance || isSubmitting}
                      />
                    </FormFieldGroup>
                  </div>

                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
                    <button
                      type="submit"
                      disabled={!accountBalance || isSubmitting || !amountInput.trim()}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Posting Optimistic Deposit...</span>
                        </>
                      ) : (
                        <>
                          <ArrowDownLeft className="w-4 h-4" />
                          <span>Confirm Deposit</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: WITHDRAWAL */}
              {activeTab === 'withdrawal' && (
                <form onSubmit={handleWithdrawSubmit} className="space-y-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    {!accountBalance && (
                      <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Please lookup an Account ID on the left panel before submitting a withdrawal.</span>
                      </div>
                    )}

                    {accountBalance && (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-500 font-medium">Source Account</p>
                          <p className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200">
                            {accountBalance.accountId}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500 font-medium">Withdrawal Ceiling</p>
                          <CurrencyDisplay value={accountBalance.availableBalance} size="md" colorCode="positive" />
                        </div>
                      </div>
                    )}

                    <FormFieldGroup
                      label="Withdrawal Amount (ETB)"
                      required
                      helperText="Must not exceed available balance after collateral holds"
                    >
                      <input
                        type="text"
                        placeholder="0.00"
                        value={amountInput}
                        onChange={(e) => setAmountInput(e.target.value)}
                        disabled={!accountBalance || isSubmitting}
                      />
                    </FormFieldGroup>

                    <FormFieldGroup
                      label="Reference / Check Number"
                      helperText="Withdrawal slip or voucher reference"
                    >
                      <input
                        type="text"
                        placeholder="e.g. WTH-20260819-002"
                        value={referenceInput}
                        onChange={(e) => setReferenceInput(e.target.value)}
                        disabled={!accountBalance || isSubmitting}
                      />
                    </FormFieldGroup>

                    <FormFieldGroup
                      label="Narration / Purpose"
                      helperText="Optional teller note"
                    >
                      <input
                        type="text"
                        placeholder="e.g. Over the counter cash withdrawal"
                        value={narrationInput}
                        onChange={(e) => setNarrationInput(e.target.value)}
                        disabled={!accountBalance || isSubmitting}
                      />
                    </FormFieldGroup>
                  </div>

                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
                    <button
                      type="submit"
                      disabled={!accountBalance || isSubmitting || !amountInput.trim()}
                      className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Posting Optimistic Withdrawal...</span>
                        </>
                      ) : (
                        <>
                          <ArrowUpRight className="w-4 h-4" />
                          <span>Confirm Withdrawal</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 3: LOAN REPAYMENT */}
              {activeTab === 'loan-repayment' && (
                <form onSubmit={handleLoanRepaySubmit} className="space-y-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    {!loanData && (
                      <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Please lookup a Loan ID on the left panel before submitting a repayment.</span>
                      </div>
                    )}

                    {loanData && (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-slate-500 font-medium">Loan Reference</p>
                            <p className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200">
                              {loanData.loanNumber} ({loanData.id})
                            </p>
                          </div>
                          <StatusBadge status={loanData.status} size="sm" />
                        </div>
                        <div className="flex justify-between text-xs border-t border-slate-200/60 dark:border-slate-800 pt-2">
                          <span className="text-slate-500">Disbursed Principal</span>
                          <CurrencyDisplay value={loanData.disbursedAmount ?? '0.00'} size="sm" />
                        </div>
                      </div>
                    )}

                    <FormFieldGroup
                      label="Repayment Amount (ETB)"
                      required
                      helperText="Amount to credit against the disbursed loan"
                    >
                      <input
                        type="text"
                        placeholder="0.00"
                        value={repayAmountInput}
                        onChange={(e) => setRepayAmountInput(e.target.value)}
                        disabled={!loanData || loanData.status !== 'disbursed' || isSubmitting}
                      />
                    </FormFieldGroup>

                    <FormFieldGroup
                      label="Repayment Reference / Slip"
                      helperText="Teller receipt or bank reference number"
                    >
                      <input
                        type="text"
                        placeholder="e.g. LRP-20260819-003"
                        value={repayReferenceInput}
                        onChange={(e) => setRepayReferenceInput(e.target.value)}
                        disabled={!loanData || loanData.status !== 'disbursed' || isSubmitting}
                      />
                    </FormFieldGroup>
                  </div>

                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
                    <button
                      type="submit"
                      disabled={
                        !loanData ||
                        loanData.status !== 'disbursed' ||
                        isSubmitting ||
                        !repayAmountInput.trim()
                      }
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Posting Loan Repayment...</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4" />
                          <span>Submit Loan Repayment</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
