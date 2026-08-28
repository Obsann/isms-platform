'use client';

import React, { useState } from 'react';
import { ShieldCheck, UserCheck, AlertCircle, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import FormFieldGroup from './FormFieldGroup';
import CurrencyDisplay from '@/components/currency/CurrencyDisplay';

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
  onSubmit: (data: ApplyLoanFormData) => void;
}

export default function ApplyLoanModal({ isOpen, onClose, onSubmit }: ApplyLoanModalProps) {
  const { members } = useApp();
  const [selectedMemberId, setSelectedMemberId] = useState<string>(members[0]?.id || '');
  const [requestedAmount, setRequestedAmount] = useState<number>(25000);
  const [termMonths, setTermMonths] = useState<number>(12);
  const [purpose, setPurpose] = useState<string>('Business Expansion');

  // Guarantor state
  const [guarantors, setGuarantors] = useState<GuarantorPledgeInput[]>([]);
  const [selectedGuarantorId, setSelectedGuarantorId] = useState<string>('');
  const [pledgedAmount, setPledgedAmount] = useState<number>(5000);

  if (!isOpen) return null;

  const selectedMember = members.find((m) => m.id === selectedMemberId);
  const savingsMultiplier = 3;
  const memberSavings = selectedMember?.savingsBalance || 0;
  const baseCeiling = memberSavings * savingsMultiplier;
  const totalPledged = guarantors.reduce((acc, g) => acc + g.pledgedAmount, 0);
  const totalEligibilityCeiling = baseCeiling + totalPledged;

  const isEligible = requestedAmount > 0 && requestedAmount <= totalEligibilityCeiling;

  const handleAddGuarantor = () => {
    if (!selectedGuarantorId) return;
    if (selectedGuarantorId === selectedMemberId) {
      alert('A borrower cannot act as guarantor for their own loan.');
      return;
    }
    const gMember = members.find((m) => m.id === selectedGuarantorId);
    if (!gMember) return;
    if (pledgedAmount <= 0) return;
    if (pledgedAmount > gMember.savingsBalance) {
      alert(`Pledged amount exceeds guarantor's total savings balance of ${gMember.savingsBalance} ETB.`);
      return;
    }

    setGuarantors((prev) => [
      ...prev.filter((g) => g.guarantorMemberId !== selectedGuarantorId),
      {
        guarantorMemberId: gMember.id,
        guarantorName: gMember.fullName || gMember.name || 'Unknown',
        pledgedAmount: pledgedAmount,
      },
    ]);
    setSelectedGuarantorId('');
    setPledgedAmount(5000);
  };

  const handleRemoveGuarantor = (id: string) => {
    setGuarantors((prev) => prev.filter((g) => g.guarantorMemberId !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) return;
    if (!isEligible) {
      alert(`Requested amount exceeds total eligibility ceiling of ${totalEligibilityCeiling} ETB.`);
      return;
    }

    onSubmit({
      memberId: selectedMemberId,
      requestedAmount,
      termMonths,
      purpose,
      guarantors,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-6 animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">New Loan Application</h2>
              <p className="text-xs text-slate-500">Automated eligibility evaluation & guarantor pledges</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-semibold p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Member Selection */}
          <FormFieldGroup label="Borrower Member">
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName} ({m.faydaId}) — Savings: {m.savingsBalance.toLocaleString()} ETB
                </option>
              ))}
            </select>
          </FormFieldGroup>

          {/* Amount & Term Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormFieldGroup label="Requested Amount (ETB)">
              <input
                type="number"
                value={requestedAmount}
                onChange={(e) => setRequestedAmount(Number(e.target.value))}
                min="1000"
                step="1000"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </FormFieldGroup>

            <FormFieldGroup label="Term (Months)">
              <input
                type="number"
                value={termMonths}
                onChange={(e) => setTermMonths(Number(e.target.value))}
                min="1"
                max="360"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </FormFieldGroup>
          </div>

          <FormFieldGroup label="Loan Purpose">
            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Working Capital, Equipment Purchase, Agricultural Inputs"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </FormFieldGroup>

          {/* Eligibility Card Preview */}
          <div className={`p-4 rounded-xl border ${isEligible ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50' : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/50'} space-y-2`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isEligible ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                )}
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Automated Savings Multiplier Check (3x)
                </span>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${isEligible ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200' : 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200'}`}>
                {isEligible ? 'Eligible' : 'Exceeds Ceiling'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
              <div>
                <span className="text-slate-500 block">Member Savings</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{memberSavings.toLocaleString()} ETB</span>
              </div>
              <div>
                <span className="text-slate-500 block">3x Base Ceiling</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{baseCeiling.toLocaleString()} ETB</span>
              </div>
              <div>
                <span className="text-slate-500 block">+ Guarantor Pledges</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">+{totalPledged.toLocaleString()} ETB</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-600 dark:text-slate-400">Total Eligibility Ceiling:</span>
              <CurrencyDisplay value={totalEligibilityCeiling} currency="ETB" size="sm" />
            </div>
          </div>

          {/* Guarantors Section (Task 17 UI) */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-indigo-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Guarantor Pledges (Task 17 Collateral)
                </h4>
              </div>
              <span className="text-xs text-slate-500">{guarantors.length} Guarantor(s) Attached</span>
            </div>

            {/* List attached guarantors */}
            {guarantors.length > 0 && (
              <div className="space-y-2">
                {guarantors.map((g) => (
                  <div key={g.guarantorMemberId} className="flex items-center justify-between bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                    <span className="font-medium text-slate-800 dark:text-slate-200">{g.guarantorName}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">Pledged: {g.pledgedAmount.toLocaleString()} ETB</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveGuarantor(g.guarantorMemberId)}
                        className="text-rose-500 hover:text-rose-700 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Guarantor row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <select
                value={selectedGuarantorId}
                onChange={(e) => setSelectedGuarantorId(e.target.value)}
                className="sm:col-span-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none"
              >
                <option value="">Select Guarantor Member...</option>
                {members
                  .filter((m) => m.id !== selectedMemberId)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} (Avail Savings: {m.savingsBalance.toLocaleString()} ETB)
                    </option>
                  ))}
              </select>

              <div className="flex gap-2">
                <input
                  type="number"
                  value={pledgedAmount}
                  onChange={(e) => setPledgedAmount(Number(e.target.value))}
                  placeholder="Pledged ETB"
                  step="1000"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddGuarantor}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0"
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
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isEligible}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Loan Application
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
