'use client';

import React, { useState } from 'react';
import { ShieldCheck, UserCheck, AlertCircle, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import type { Member } from '@/types';
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
  members: Member[];
}

export default function ApplyLoanModal({ isOpen, onClose, onSubmit, members }: ApplyLoanModalProps) {
  const [selectedMemberId, setSelectedMemberId] = useState<string>(members[0]?.id || '');
  const [requestedAmount, setRequestedAmount] = useState<number>(25000);
  const [termMonths, setTermMonths] = useState<number>(12);
  const [purpose, setPurpose] = useState<string>('Business Expansion');

  // Guarantor state
  const [guarantors, setGuarantors] = useState<GuarantorPledgeInput[]>([]);
  const [selectedGuarantorId, setSelectedGuarantorId] = useState<string>('');
  const [pledgedAmount, setPledgedAmount] = useState<number>(5000);

  if (!isOpen) return null;

  const currentMemberId = selectedMemberId || members[0]?.id || '';
  const isEligible = requestedAmount > 0;

  const handleAddGuarantor = () => {
    if (!selectedGuarantorId) return;
    if (selectedGuarantorId === currentMemberId) {
      alert('A borrower cannot act as guarantor for their own loan.');
      return;
    }
    const gMember = members.find((m) => m.id === selectedGuarantorId);
    if (!gMember) return;
    if (pledgedAmount <= 0) return;

    setGuarantors((prev) => [
      ...prev.filter((g) => g.guarantorMemberId !== selectedGuarantorId),
      {
        guarantorMemberId: gMember.id,
        guarantorName: gMember.fullName,
        pledgedAmount,
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
    if (!currentMemberId) {
      alert('Please select a member.');
      return;
    }
    if (!isEligible) {
      alert('Requested amount must be greater than zero.');
      return;
    }

    onSubmit({
      memberId: currentMemberId,
      requestedAmount,
      termMonths,
      purpose,
      guarantors,
    });
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
              <p className="text-xs text-slate-500 dark:text-slate-400">Automated eligibility evaluation & guarantor pledges</p>
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
              value={currentMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName} ({m.memberNumber})
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

          {/* Loan Summary Card */}
          <div className="p-4 rounded-xl border bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800/50 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Loan Policy & Collateral Coverage
                </span>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200">
                3x Savings Multiplier
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">Requested Loan</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{requestedAmount.toLocaleString()} ETB</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">Guarantor Pledges</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">+{guarantors.reduce((acc, g) => acc + g.pledgedAmount, 0).toLocaleString()} ETB</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-600 dark:text-slate-400">Requested Principal:</span>
              <CurrencyDisplay value={requestedAmount} currency="ETB" size="sm" />
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
                  .filter((m) => m.id !== currentMemberId)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} ({m.memberNumber})
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
