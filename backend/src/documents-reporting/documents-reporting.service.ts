import { Injectable } from '@nestjs/common';
import { TenantContextService } from '../common';
import { LedgerService, fromCents, toCents } from '../ledger';
import { LoanService } from '../loans';
import { MemberService } from '../members';
import { SavingsSharesService } from '../savings-shares';
import type { ReportingSummary, Transaction, TransactionType } from '../types';
import type {
  GeneratedDocument,
  LoanAgreementRequest,
  ReceiptRequest,
  ShareCertificateRequest,
  StatementRequest,
  TrialBalance,
} from './documents-reporting.types';

const GL_LABEL: Record<string, string> = {
  CASH: 'Cash on hand',
  MEMBER_SAVINGS: 'Member savings',
  SHARE_CAPITAL: 'Share capital',
  LOANS_RECEIVABLE: 'Loans receivable',
};

const CREDIT_TYPES: ReadonlySet<TransactionType> = new Set([
  'deposit',
  'share-purchase',
  'loan-disbursement',
  'transfer',
]);

@Injectable()
export class DocumentsReportingService {
  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly members: MemberService,
    private readonly savings: SavingsSharesService,
    private readonly loans: LoanService,
    private readonly ledger: LedgerService,
  ) {}

  async getSavingsSummary(): Promise<ReportingSummary> {
    const [memberCounts, accounts, portfolio] = await Promise.all([
      this.members.countMembers(),
      this.savings.getTenantAccountSummary(),
      this.loans.getPortfolioSummary(),
    ]);
    return {
      tenantId: this.tenantContext.getTenantId() ?? '',
      asOf: new Date().toISOString(),
      memberCount: memberCounts.total,
      activeMemberCount: memberCounts.active,
      totalSavings: accounts.totalSavings,
      totalShares: accounts.totalShares,
      totalLoansOutstanding: portfolio.outstanding,
      loansInArrears: portfolio.loansInArrears,
    };
  }

  async getLoanPortfolio(): Promise<ReportingSummary> {
    const [memberCounts, accounts, portfolio] = await Promise.all([
      this.members.countMembers(),
      this.savings.getTenantAccountSummary(),
      this.loans.getPortfolioSummary(),
    ]);
    return {
      tenantId: this.tenantContext.getTenantId() ?? '',
      asOf: new Date().toISOString(),
      memberCount: memberCounts.total,
      activeMemberCount: portfolio.activeBorrowers,
      totalSavings: accounts.totalSavings,
      totalShares: accounts.totalShares,
      totalLoansOutstanding: portfolio.outstanding,
      loansInArrears: portfolio.loansInArrears,
    };
  }

  async getTrialBalance(): Promise<TrialBalance> {
    const raw = await this.ledger.getTrialBalance();
    return {
      lines: raw.lines.map((line) => ({
        account: `${line.glCode} — ${GL_LABEL[line.glCode] ?? line.glCode}`,
        debit: line.debit,
        credit: line.credit,
      })),
      totalDebits: raw.totalDebits,
      totalCredits: raw.totalCredits,
      balanced: raw.balanced,
    };
  }

  getRecentTransactions(limit = 8): Promise<Transaction[]> {
    return this.savings.getRecentTransactions(limit);
  }

  async generateMemberStatement(request: StatementRequest): Promise<GeneratedDocument> {
    const member = await this.members.findByIdOrNumber(request.memberId);
    const from = request.from || '1970-01-01';
    const to = request.to || new Date().toISOString().slice(0, 10);
    const transactions = await this.savings.getTransactionsByMember(member.id, {
      fromDate: from,
      toDate: to,
      limit: 100,
    });
    const chronological = [...transactions].reverse();
    const rows = chronological
      .map((txn) => {
        const credit = CREDIT_TYPES.has(txn.type) ? fmtAmount(txn.amount) : '0.00';
        const debit = CREDIT_TYPES.has(txn.type) ? '0.00' : fmtAmount(txn.amount);
        return `<tr>
        <td>${escapeHtml(txn.postedAt.slice(0, 10))}</td>
        <td>${escapeHtml(txn.reference ?? txn.id)}</td>
        <td>${escapeHtml(txn.narration ?? txn.type)}</td>
        <td class="amount">${debit}</td>
        <td class="amount">${credit}</td>
        <td class="amount">${fmtAmount(txn.balanceAfter)}</td>
      </tr>`;
      })
      .join('\n');

    const html = wrapHtml(
      'ISMS SACCO — MEMBER ACCOUNT STATEMENT',
      'Official ledger record',
      `
  <div class="meta">
    <div><strong>Member:</strong> ${escapeHtml(member.fullName)} (${escapeHtml(member.memberNumber)})</div>
    <div><strong>Period:</strong> ${escapeHtml(from)} to ${escapeHtml(to)}</div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Reference</th>
        <th>Description</th>
        <th class="amount">Debit (ETB)</th>
        <th class="amount">Credit (ETB)</th>
        <th class="amount">Balance after (ETB)</th>
      </tr>
    </thead>
    <tbody>
      ${rows || '<tr><td colspan="6">No postings in this period.</td></tr>'}
    </tbody>
  </table>`,
    );

    return htmlDoc(`DOC-STMT-${member.memberNumber}`, `member_statement_${member.memberNumber}.html`, html);
  }

  async generateLoanAgreement(request: LoanAgreementRequest): Promise<GeneratedDocument> {
    const loan = await this.loans.findByIdOrNumber(request.loanId);
    const member = await this.members.findById(loan.memberId);
    const principal = loan.disbursedAmount ?? loan.approvedAmount ?? loan.requestedAmount;
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Georgia, serif; padding: 32px; color: #111827; line-height: 1.6; }
    h1 { text-align: center; font-size: 22px; margin-bottom: 4px; }
    .subtitle { text-align: center; font-style: italic; color: #4b5563; font-size: 14px; margin-bottom: 24px; }
    .box { border: 1px solid #d1d5db; padding: 16px; margin-bottom: 20px; background: #f9fafb; font-size: 13px; }
    .signatures { display: flex; justify-content: space-between; margin-top: 48px; font-size: 13px; }
    .sig-line { border-top: 1px solid #111827; width: 200px; text-align: center; padding-top: 4px; }
  </style>
</head>
<body>
  <h1>SACCO LOAN AGREEMENT CONTRACT</h1>
  <div class="subtitle">Contract Reference: ${escapeHtml(loan.loanNumber)}</div>
  <div class="box">
    <p><strong>Borrower:</strong> ${escapeHtml(member.fullName)} (${escapeHtml(member.memberNumber)})</p>
    <p><strong>Loan ID:</strong> ${escapeHtml(loan.id)}</p>
    <p><strong>Status:</strong> ${escapeHtml(loan.status)}</p>
    <p><strong>Requested Amount:</strong> ETB ${fmtAmount(loan.requestedAmount)}</p>
    <p><strong>Approved Amount:</strong> ETB ${loan.approvedAmount ? fmtAmount(loan.approvedAmount) : '—'}</p>
    <p><strong>Principal (disbursed / approved / requested):</strong> ETB ${fmtAmount(principal)}</p>
    <p><strong>Repayment Term:</strong> ${loan.termMonths} months</p>
    <p><strong>Purpose:</strong> ${escapeHtml(loan.purpose ?? '—')}</p>
  </div>
  <p>
    This agreement is entered into between the SACCO Society ("Lender") and the undersigned member ("Borrower").
    Figures above are taken from the live loan record. Interest is not stored as a named rate in MVP.
  </p>
  <div class="signatures">
    <div class="sig-line">Borrower Signature</div>
    <div class="sig-line">SACCO Officer Signature</div>
  </div>
</body>
</html>`;

    return htmlDoc(`DOC-LOAN-${loan.loanNumber}`, `loan_agreement_${loan.loanNumber}.html`, html);
  }

  async generateReceipt(request: ReceiptRequest): Promise<GeneratedDocument> {
    const txn = await this.savings.getTransactionById(request.transactionId);
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: monospace; width: 320px; padding: 16px; border: 1px dashed #475569; font-size: 12px; }
    .center { text-align: center; }
    .line { border-top: 1px dashed #475569; margin: 8px 0; }
    .row { display: flex; justify-content: space-between; }
  </style>
</head>
<body>
  <div class="center">
    <strong>ISMS SACCO OFFICIAL RECEIPT</strong>
  </div>
  <div class="line"></div>
  <div class="row"><span>Txn ID:</span> <span>${escapeHtml(txn.id)}</span></div>
  <div class="row"><span>Reference:</span> <span>${escapeHtml(txn.reference ?? '—')}</span></div>
  <div class="row"><span>Date:</span> <span>${escapeHtml(txn.postedAt.slice(0, 10))}</span></div>
  <div class="row"><span>Type:</span> <span>${escapeHtml(txn.type)}</span></div>
  <div class="line"></div>
  <div class="row"><span>${escapeHtml(txn.narration ?? txn.type)}:</span> <span>ETB ${fmtAmount(txn.amount)}</span></div>
  <div class="row"><span>Balance after:</span> <span>ETB ${fmtAmount(txn.balanceAfter)}</span></div>
  <div class="line"></div>
  <div class="center">Thank you for saving with us!</div>
</body>
</html>`;

    return htmlDoc(`DOC-RCPT-${txn.id}`, `receipt_${txn.id}.html`, html);
  }

  async generateShareCertificate(request: ShareCertificateRequest): Promise<GeneratedDocument> {
    const member = await this.members.findByIdOrNumber(request.memberId);
    const accounts = await this.savings.getAccountsByMember(member.id);
    const shareAccounts = accounts.filter((account) => account.type === 'share');
    let shareCents = 0n;
    for (const account of shareAccounts) {
      shareCents += toCents(account.balance);
    }
    const totalShares = fromCents(shareCents);

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Times New Roman', serif; padding: 40px; border: 10px double #d97706; color: #111827; text-align: center; }
    h1 { font-size: 28px; color: #92400e; margin-bottom: 8px; }
    .cert-no { font-family: monospace; font-size: 14px; color: #4b5563; margin-bottom: 24px; }
  </style>
</head>
<body>
  <h1>CERTIFICATE OF SHARE CAPITAL</h1>
  <div class="cert-no">Certificate No: SHARE-CERT-${escapeHtml(member.memberNumber)}</div>
  <p>This certifies that <strong>${escapeHtml(member.fullName)}</strong> (${escapeHtml(member.memberNumber)}) is the registered holder of</p>
  <h2 style="font-size: 24px; margin: 16px 0;">ETB ${fmtAmount(totalShares)} IN SHARE CAPITAL</h2>
  <p>across ${shareAccounts.length} share account${shareAccounts.length === 1 ? '' : 's'}, subject to the Society Bylaws.</p>
</body>
</html>`;

    return htmlDoc(`DOC-CERT-${member.memberNumber}`, `share_certificate_${member.memberNumber}.html`, html);
  }
}

function htmlDoc(documentId: string, fileName: string, html: string): GeneratedDocument {
  return {
    documentId,
    fileName,
    contentType: 'text/html',
    content: Buffer.from(html, 'utf-8'),
  };
}

function wrapHtml(title: string, subtitle: string, body: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 24px; color: #1e293b; }
    .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 20px; }
    .header h1 { margin: 0; color: #0f172a; font-size: 20px; }
    .header p { margin: 4px 0 0 0; color: #64748b; font-size: 12px; }
    .meta { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 12px; background: #f8fafc; padding: 12px; border-radius: 6px; gap: 12px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
    th { background: #0f172a; color: #f8fafc; text-align: left; padding: 8px; }
    td { border-bottom: 1px solid #e2e8f0; padding: 8px; }
    .amount { text-align: right; font-family: monospace; }
    .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(subtitle)}</p>
  </div>
  ${body}
  <div class="footer">Generated by ISMS Document Engine from the live ledger</div>
</body>
</html>`;
}

function fmtAmount(amount: string): string {
  const [whole = '0', frac = '00'] = amount.split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${grouped}.${(frac + '00').slice(0, 2)}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
