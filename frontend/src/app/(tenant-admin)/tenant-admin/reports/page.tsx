'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import CurrencyDisplay from '@/components/currency/CurrencyDisplay';
import {
  getSavingsSummaryReport,
  getLoanPortfolioReport,
  getTrialBalanceReport,
  fetchDocumentHtml,
  type TrialBalance,
  type ReportingSummary,
} from '@/lib/api-client';

type ReportTab = 'savings' | 'loans' | 'trial-balance' | 'documents';
type DocType = 'statement' | 'loan-agreement' | 'receipt' | 'share-cert';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function TenantAdminReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>('savings');
  const [docId, setDocId] = useState('MEM-10001');
  const [fromDate, setFromDate] = useState('2026-01-01');
  const [toDate, setToDate] = useState(todayIso());
  const [docType, setDocType] = useState<DocType>('statement');
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);

  const [savingsSummary, setSavingsSummary] = useState<ReportingSummary | null>(null);
  const [loanPortfolio, setLoanPortfolio] = useState<ReportingSummary | null>(null);
  const [trialBalance, setTrialBalance] = useState<TrialBalance | null>(null);
  const [loadingReports, setLoadingReports] = useState(true);
  const [reportError, setReportError] = useState<string | null>(null);

  useEffect(() => {
    async function loadReports() {
      setLoadingReports(true);
      setReportError(null);
      try {
        const [sav, loan, tb] = await Promise.all([
          getSavingsSummaryReport(),
          getLoanPortfolioReport(),
          getTrialBalanceReport(),
        ]);
        setSavingsSummary(sav);
        setLoanPortfolio(loan);
        setTrialBalance(tb);
      } catch (err: unknown) {
        setReportError(err instanceof Error ? err.message : 'Failed to load reports from backend.');
      } finally {
        setLoadingReports(false);
      }
    }
    void loadReports();
  }, []);

  const idLabel = useMemo(() => {
    if (docType === 'loan-agreement') return 'Loan number or UUID';
    if (docType === 'receipt') return 'Transaction UUID';
    return 'Member number or UUID';
  }, [docType]);

  const idPlaceholder = useMemo(() => {
    if (docType === 'loan-agreement') return 'LN-2026-000001';
    if (docType === 'receipt') return 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
    return 'MEM-10001';
  }, [docType]);

  const handleGenerateDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setGeneratedHtml(null);
    setDocError(null);
    try {
      const html = await fetchDocumentHtml(docType, docId, { from: fromDate, to: toDate });
      setGeneratedHtml(html);
    } catch (err: unknown) {
      setDocError(err instanceof Error ? err.message : 'Document generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const activeBorrowers = loanPortfolio?.activeMemberCount ?? 0;
  const arrears = loanPortfolio?.loansInArrears ?? 0;
  const performing = Math.max(0, activeBorrowers - arrears);

  return (
    <div className="space-y-6 pb-8">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <span className="text-xs font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
          Tenant Admin
        </span>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
          Financial &amp; Operational Reports
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Figures are read from the ledger. A generated statement must match posted transactions.
        </p>
      </div>

      {reportError && (
        <p className="text-sm text-rose-600" role="alert">{reportError}</p>
      )}
      {loadingReports && <p className="text-sm text-slate-500">Loading reports…</p>}

      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        {[
          { id: 'savings', label: 'Savings Summary' },
          { id: 'loans', label: 'Loan Portfolio' },
          { id: 'trial-balance', label: 'Trial Balance' },
          { id: 'documents', label: 'Documents' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as ReportTab)}
            className={`px-4 py-2 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-amber-500 text-slate-900 bg-amber-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'savings' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Savings</p>
              <div className="mt-2">
                <CurrencyDisplay amount={savingsSummary?.totalSavings ?? '0.00'} currency="ETB" size="xl" colorCode="positive" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Share Capital</p>
              <div className="mt-2">
                <CurrencyDisplay amount={savingsSummary?.totalShares ?? '0.00'} currency="ETB" size="xl" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Members</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-2">
                {(savingsSummary?.memberCount ?? 0).toLocaleString()} registered
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {(savingsSummary?.activeMemberCount ?? 0).toLocaleString()} active
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'loans' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Outstanding Principal</p>
              <div className="mt-2">
                <CurrencyDisplay amount={loanPortfolio?.totalLoansOutstanding ?? '0.00'} currency="ETB" size="xl" />
              </div>
              <p className="text-xs text-slate-400 mt-1">{activeBorrowers} active borrower{activeBorrowers === 1 ? '' : 's'}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loans in Arrears</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-2">{arrears.toLocaleString()}</h3>
              <p className="text-xs text-slate-400 mt-1">Status = defaulted</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Performing Borrowers</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-2">{performing.toLocaleString()}</h3>
              <p className="text-xs text-slate-400 mt-1">Active borrowers minus defaulted</p>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'trial-balance' && trialBalance && (
        <div className="space-y-4">
          <div className={`rounded-xl px-4 py-3 text-sm font-semibold ${
            trialBalance.balanced
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            {trialBalance.balanced
              ? 'Trial balance is balanced — total debits equal total credits.'
              : 'Trial balance is unbalanced. Check ledger postings.'}
          </div>
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600 uppercase">
                    <th className="py-3 px-4">Account</th>
                    <th className="py-3 px-4 text-right">Debit (ETB)</th>
                    <th className="py-3 px-4 text-right">Credit (ETB)</th>
                  </tr>
                </thead>
                <tbody>
                  {trialBalance.lines.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-6 px-4 text-slate-500">No ledger entries yet.</td>
                    </tr>
                  ) : (
                    trialBalance.lines.map((line) => (
                      <tr key={line.account} className="border-b border-slate-100">
                        <td className="py-3 px-4 font-semibold">{line.account}</td>
                        <td className="py-3 px-4 text-right font-mono">
                          <CurrencyDisplay amount={line.debit} size="sm" />
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          <CurrencyDisplay amount={line.credit} size="sm" />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-900 text-amber-400 font-bold">
                    <td className="py-3 px-4">Totals</td>
                    <td className="py-3 px-4 text-right font-mono">
                      <CurrencyDisplay amount={trialBalance.totalDebits} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      <CurrencyDisplay amount={trialBalance.totalCredits} size="sm" />
                    </td>
                  </tr>
                </tfoot>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5">
            <Card>
              <CardHeader>
                <CardTitle>Generate from live records</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleGenerateDoc} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Document type
                    </label>
                    <select
                      value={docType}
                      onChange={(e) => {
                        const next = e.target.value as DocType;
                        setDocType(next);
                        setDocId(next === 'loan-agreement' ? '' : next === 'receipt' ? '' : 'MEM-10001');
                      }}
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl bg-white"
                    >
                      <option value="statement">Member account statement</option>
                      <option value="loan-agreement">Loan agreement</option>
                      <option value="receipt">Transaction receipt</option>
                      <option value="share-cert">Share certificate</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      {idLabel}
                    </label>
                    <input
                      type="text"
                      required
                      value={docId}
                      onChange={(e) => setDocId(e.target.value)}
                      placeholder={idPlaceholder}
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl font-mono"
                    />
                  </div>
                  {docType === 'statement' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">From</label>
                        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">To</label>
                        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg" />
                      </div>
                    </div>
                  )}
                  {docError && <p className="text-xs text-rose-600">{docError}</p>}
                  <button
                    type="submit"
                    disabled={isGenerating}
                    className="w-full py-2.5 bg-slate-900 text-amber-400 text-sm font-bold rounded-xl hover:bg-slate-800 disabled:opacity-60"
                  >
                    {isGenerating ? 'Generating…' : 'Generate document'}
                  </button>
                </form>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-7">
            <Card className="h-full min-h-[400px]">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Preview</CardTitle>
                {generatedHtml && (
                  <button
                    type="button"
                    onClick={() => {
                      const win = window.open('', '_blank');
                      if (win) {
                        win.document.write(generatedHtml);
                        win.document.close();
                        win.print();
                      }
                    }}
                    className="px-3 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg"
                  >
                    Print / Save PDF
                  </button>
                )}
              </CardHeader>
              <CardContent>
                {generatedHtml ? (
                  <iframe title="Document preview" className="w-full min-h-[420px] bg-white border border-slate-200 rounded-xl" srcDoc={generatedHtml} />
                ) : (
                  <div className="h-64 flex items-center justify-center text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
                    Generate a document to preview ledger-backed HTML.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
