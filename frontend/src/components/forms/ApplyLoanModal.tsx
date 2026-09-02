'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, UserCheck, AlertCircle, AlertTriangle, Plus, Trash2, CheckCircle2, Loader2 } from 'lucide-react';
import type { Member } from '@/types';
import FormFieldGroup from './FormFieldGroup';
import CurrencyDisplay from '@/components/currency/CurrencyDisplay';
import { getMemberBalance, type MemberBalanceInfo } from '@/lib/api-client';

export interface GuarantorPledgeInput {
  guarantorMemberId: string;
  guarantorName: string;
  pledgedAmount: number;
}

export interface ApplyLoanFormData {
  memberId: string;
  requestedAmount: number;
  termMonths: number;
  purpose: string;
  guarantors: GuarantorPledgeInput[];
}

interface ApplyLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ApplyLoanFormData) => Promise<void> | void;
  members: Member[];
}

const SAVINGS_MULTIPLIER = 3;

export default function ApplyLoanModal({ isOpen, onClose, onSubmit, members }: ApplyLoanModalProps) {
  const [selectedMemberId, setSelectedMemberId] = useState<string>(members[0]?.id || '');
  const [requestedAmount, setRequestedAmount] = useState<number>(25000);
  const [termMonths, setTermMonths] = useState<number>(12);
  const [purpose, setPurpose] = useState<string>('Business Expansion');

  // Borrower balance & eligibility state
  const [borrowerBalance, setBorrowerBalance] = useState<MemberBalanceInfo | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Guarantor state
  const [guarantors, setGuarantors] = useState<GuarantorPledgeInput[]>([]);
  const [selectedGuarantorId, setSelectedGuarantorId] = useState<string>('');
  const [pledgedAmount, setPledgedAmount] = useState<number>(5000);
  const [guarantorBalances, setGuarantorBalances] = useState<Record<string, number>>({});

  const currentMemberId = selectedMemberId || members[0]?.id || '';

  // Fetch borrower savings balance whenever selected member changes
  useEffect(() => {
    if (!isOpen || !currentMemberId) return;

    let isMounted = true;
    setIsLoadingBalance(true);
    setFormError(null);

    getMemberBalance(currentMemberId)
      .then((res) => {
        if (isMounted) {
          setBorrowerBalance(res);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.warn('Could not load member balance:', err);
          setBorrowerBalance(null);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingBalance(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, currentMemberId]);

  // Fetch balances for potential guarantors to show available capacity
  useEffect(() => {
    if (!isOpen || members.length === 0) return;

    let isMounted = true;
    const availableGuarantorIds = members
      .filter((m) => m.id !== currentMemberId)
      .map((m) => m.id);

    Promise.all(
      availableGuarantorIds.map((id) =>
        getMemberBalance(id)
          .then((res) => {
            const savingsTotal = res.accounts
              .filter((a) => a.type === 'savings' && a.status === 'active')
              .reduce((sum, a) => sum + parseFloat(a.availableBalance || '0'), 0);
            return { id, savingsTotal };
          })
          .catch(() => ({ id, savingsTotal: 0 }))
      )
    ).then((results) => {
      if (!isMounted) return;
      const map: Record<string, number> = {};
      results.forEach((r) => {
        map[r.id] = r.savingsTotal;
      });
      setGuarantorBalances(map);
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, currentMemberId, members]);

  if (!isOpen) return null;

  // Calculate live eligibility
  const availableSavings = borrowerBalance
    ? borrowerBalance.accounts
        .filter((a) => a.type === 'savings' && a.status === 'active')
        .reduce((sum, a) => sum + parseFloat(a.availableBalance || '0'), 0)
    : 0;

  const maxEligibleLoan = availableSavings * SAVINGS_MULTIPLIER;
  const isExceedingCeiling = borrowerBalance !== null && requestedAmount > maxEligibleLoan;
  const isEligible = requestedAmount > 0 && !isExceedingCeiling && !isLoadingBalance;

  const handleAddGuarantor = () => {
    if (!selectedGuarantorId) return;
    if (selectedGuarantorId === currentMemberId) {
      alert('A borrower cannot act as guarantor for their own loan.');
      return;
    }
    const gMember = members.find((m) => m.id === selectedGuarantorId);
    if (!gMember) return;
    if (pledgedAmount <= 0) {
      alert('Pledged amount must be greater than zero.');
      return;
    }

    const maxGuarantorCapacity = guarantorBalances[selectedGuarantorId] ?? 0;
    if (pledgedAmount > maxGuarantorCapacity && maxGuarantorCapacity > 0) {
      alert(`Pledged amount (${pledgedAmount.toLocaleString()} ETB) exceeds the guarantor's available savings (${maxGuarantorCapacity.toLocaleString()} ETB).`);
      return;
    }

    setGuarantors((prev) => [
      ...prev.filter((g) => g.guarantorMemberId !== selectedGuarantorId),
      {
        guarantorMemberId: gMember.id,
        guarantorName: gMember.fullName || (gMember as any).name || 'Unknown',
        pledgedAmount: pledgedAmount,
      },
    ]);
    setSelectedGuarantorId('');
    setPledgedAmount(5000);
  };

  const handleRemoveGuarantor = (id: string) => {
    setGuarantors((prev) => prev.filter((g) => g.guarantorMemberId !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!currentMemberId) {
      setFormError('Please select a borrower member.');
      return;
    }
    if (requestedAmount <= 0) {
      setFormError('Requested amount must be greater than zero.');
      return;
    }
    if (isExceedingCeiling) {
      setFormError(
        `Requested loan amount of ${requestedAmount.toLocaleString()} ETB exceeds the maximum eligibility ceiling of ${maxEligibleLoan.toLocaleString()} ETB (3× savings balance of ${availableSavings.toLocaleString()} ETB).`,
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        memberId: currentMemberId,
        requestedAmount,
        termMonths,
        purpose,
        guarantors,
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to submit loan application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 my-8">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">New Loan Application</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Automated eligibility evaluation & collateral management</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-semibold p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Top Error Alert Banner if submission failed */}
        {formError && (
          <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold block">Application Error</span>
              <p className="leading-relaxed">{formError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Member Selection */}
          <FormFieldGroup label="Borrower Member">
            <select
              value={currentMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName} ({m.memberNumber})
                </option>
              ))}
            </select>
          </FormFieldGroup>

          {/* Real-time Borrower Eligibility Status Card */}
          <div className="p-4 rounded-xl border bg-gradient-to-br from-slate-50 to-indigo-50/40 dark:from-slate-900/60 dark:to-indigo-950/20 border-indigo-200/80 dark:border-indigo-800/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  SACCO Policy & Eligibility Calculator
                </span>
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200">
                3× Savings Multiplier
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
              <div className="bg-white/80 dark:bg-slate-800/80 p-2 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Available Savings</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {isLoadingBalance ? (
                    <span className="inline-flex items-center gap-1 text-indigo-500"><Loader2 className="w-3 h-3 animate-spin" /> Checking</span>
                  ) : (
                    `${availableSavings.toLocaleString()} ETB`
                  )}
                </span>
              </div>
              <div className="bg-white/80 dark:bg-slate-800/80 p-2 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Multiplier Limit</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">3× Savings</span>
              </div>
              <div className="bg-white/80 dark:bg-slate-800/80 p-2 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Max Allowed Ceiling</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {isLoadingBalance ? '...' : `${maxEligibleLoan.toLocaleString()} ETB`}
                </span>
              </div>
            </div>

            {/* Ceiling Warning or Success Badge */}
            {borrowerBalance && (
              <>
                {isExceedingCeiling ? (
                  <div className="p-3 rounded-lg border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs space-y-1 animate-in fade-in">
                    <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                      <span>Requested Amount Exceeds 3× Savings Ceiling</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      Borrower has <strong>{availableSavings.toLocaleString()} ETB</strong> in active savings, making the maximum eligible loan <strong>{maxEligibleLoan.toLocaleString()} ETB</strong>. The requested amount of <strong>{requestedAmount.toLocaleString()} ETB</strong> cannot be approved.
                    </p>
                    <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                      👉 Please decrease the requested amount to ≤ {maxEligibleLoan.toLocaleString()} ETB to submit.
                    </p>
                  </div>
                ) : availableSavings > 0 ? (
                  <div className="p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="text-[11px] font-medium">
                      <strong>Eligible:</strong> Requested amount is within the maximum allowed limit of {maxEligibleLoan.toLocaleString()} ETB.
                    </span>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="text-[11px]">Borrower currently has no active savings balance. Initial deposit is required for credit eligibility.</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Amount & Term Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormFieldGroup label="Requested Amount (ETB)">
              <input
                type="number"
                value={requestedAmount}
                onChange={(e) => setRequestedAmount(Number(e.target.value))}
                min="1000"
                step="1000"
                disabled={isSubmitting}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-slate-900 dark:text-slate-100 text-sm font-medium outline-none transition-all ${
                  isExceedingCeiling
                    ? 'border-amber-400 dark:border-amber-600 bg-amber-50/30 dark:bg-amber-950/20 focus:ring-2 focus:ring-amber-500'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:ring-2 focus:ring-indigo-500'
                }`}
              />
            </FormFieldGroup>

            <FormFieldGroup label="Term (Months)">
              <input
                type="number"
                value={termMonths}
                onChange={(e) => setTermMonths(Number(e.target.value))}
                min="1"
                max="360"
                disabled={isSubmitting}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </FormFieldGroup>
          </div>

          <FormFieldGroup label="Loan Purpose">
            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              disabled={isSubmitting}
              placeholder="e.g. Working Capital, Equipment Purchase, Agricultural Inputs"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </FormFieldGroup>

          {/* Guarantors Section (Task 17 Collateral - Optional) */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-indigo-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Guarantor Pledges (Optional Collateral)
                </h4>
              </div>
              <span className="text-[11px] font-medium text-slate-500 bg-slate-200/60 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                {guarantors.length} Attached
              </span>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Guarantors are optional for standard loans. Pledging places an unwithdrawable lien on the guarantor&apos;s savings account until the loan is settled.
            </p>

            {/* List attached guarantors */}
            {guarantors.length > 0 && (
              <div className="space-y-2 pt-1">
                {guarantors.map((g) => (
                  <div key={g.guarantorMemberId} className="flex items-center justify-between bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs shadow-sm">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{g.guarantorName}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">Pledged: {g.pledgedAmount.toLocaleString()} ETB</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveGuarantor(g.guarantorMemberId)}
                        disabled={isSubmitting}
                        className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Guarantor row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200/70 dark:border-slate-800">
              <select
                value={selectedGuarantorId}
                onChange={(e) => setSelectedGuarantorId(e.target.value)}
                disabled={isSubmitting}
                className="sm:col-span-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Guarantor Member...</option>
                {members
                  .filter((m) => m.id !== currentMemberId)
                  .map((m) => {
                    const capacity = guarantorBalances[m.id];
                    const capText = capacity !== undefined ? ` — Available: ${capacity.toLocaleString()} ETB` : '';
                    return (
                      <option key={m.id} value={m.id}>
                        {m.fullName} ({m.memberNumber}){capText}
                      </option>
                    );
                  })}
              </select>

              <div className="flex gap-2">
                <input
                  type="number"
                  value={pledgedAmount}
                  onChange={(e) => setPledgedAmount(Number(e.target.value))}
                  placeholder="Pledged ETB"
                  step="1000"
                  min="500"
                  disabled={isSubmitting}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddGuarantor}
                  disabled={isSubmitting || !selectedGuarantorId}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 disabled:opacity-50 transition-colors shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isEligible || isSubmitting}
              className={`px-5 py-2.5 rounded-xl text-xs font-semibold text-white shadow-md flex items-center gap-2 transition-all ${
                isEligible && !isSubmitting
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 cursor-pointer'
                  : 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-60'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Application...</span>
                </>
              ) : (
                <span>Submit Loan Application</span>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
