import { Test, TestingModule } from '@nestjs/testing';
import { TenantContextService } from '../common';
import { LedgerService } from '../ledger';
import { LoanService } from '../loans';
import { MemberService } from '../members';
import { SavingsSharesService } from '../savings-shares';
import { DocumentsReportingService } from './documents-reporting.service';

const member = {
  id: '11111111-1111-1111-1111-111111111111',
  memberNumber: 'MEM-10001',
  fullName: 'Abebe Kebede Bikila',
};

const txn = {
  id: '22222222-2222-2222-2222-222222222222',
  tenantId: 'tenant-a',
  accountId: 'acc-1',
  type: 'deposit' as const,
  amount: '1500.00',
  currency: 'ETB',
  balanceAfter: '46730.00',
  reference: 'DEP-1',
  narration: 'Cash counter deposit',
  postedByStaffId: null,
  postedAt: '2026-09-01T10:00:00.000Z',
};

describe('DocumentsReportingService', () => {
  let service: DocumentsReportingService;

  const members = {
    countMembers: jest.fn().mockResolvedValue({ total: 3, active: 3 }),
    findByIdOrNumber: jest.fn().mockResolvedValue(member),
    findById: jest.fn().mockResolvedValue(member),
  };
  const savings = {
    getTenantAccountSummary: jest.fn().mockResolvedValue({
      totalSavings: '45230.00',
      totalShares: '5000.00',
      savingsAccountCount: 3,
      shareAccountCount: 1,
    }),
    getTransactionsByMember: jest.fn().mockResolvedValue([txn]),
    getTransactionById: jest.fn().mockResolvedValue(txn),
    getAccountsByMember: jest.fn().mockResolvedValue([
      { type: 'share', balance: '5000.00' },
    ]),
    getRecentTransactions: jest.fn().mockResolvedValue([txn]),
  };
  const loans = {
    getPortfolioSummary: jest.fn().mockResolvedValue({
      outstanding: '10000.00',
      activeBorrowers: 1,
      loansInArrears: 0,
    }),
    findByIdOrNumber: jest.fn().mockResolvedValue({
      id: 'loan-1',
      memberId: member.id,
      loanNumber: 'LN-2026-000001',
      requestedAmount: '10000.00',
      approvedAmount: '10000.00',
      disbursedAmount: '10000.00',
      termMonths: 12,
      purpose: 'Working capital',
      status: 'disbursed',
    }),
  };
  const ledger = {
    getTrialBalance: jest.fn().mockResolvedValue({
      lines: [
        { glCode: 'CASH', debit: '1500.00', credit: '0.00' },
        { glCode: 'MEMBER_SAVINGS', debit: '0.00', credit: '1500.00' },
      ],
      totalDebits: '1500.00',
      totalCredits: '1500.00',
      balanced: true,
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsReportingService,
        { provide: TenantContextService, useValue: { getTenantId: () => 'tenant-a' } },
        { provide: MemberService, useValue: members },
        { provide: SavingsSharesService, useValue: savings },
        { provide: LoanService, useValue: loans },
        { provide: LedgerService, useValue: ledger },
      ],
    }).compile();

    service = module.get(DocumentsReportingService);
  });

  it('builds savings summary from live verticals', async () => {
    const summary = await service.getSavingsSummary();
    expect(summary.totalSavings).toBe('45230.00');
    expect(summary.memberCount).toBe(3);
    expect(summary.totalLoansOutstanding).toBe('10000.00');
  });

  it('maps trial balance GL codes and stays balanced', async () => {
    const trial = await service.getTrialBalance();
    expect(trial.balanced).toBe(true);
    expect(trial.totalDebits).toBe(trial.totalCredits);
    expect(trial.lines[0].account).toContain('CASH');
  });

  it('renders a statement from real transactions', async () => {
    const doc = await service.generateMemberStatement({
      memberId: 'MEM-10001',
      from: '2026-01-01',
      to: '2026-12-31',
    });
    const html = doc.content.toString();
    expect(html).toContain('Abebe Kebede Bikila');
    expect(html).toContain('1,500.00');
    expect(html).toContain('Cash counter deposit');
    expect(html).not.toContain('TXN-INIT-001');
  });

  it('renders a loan agreement from the loan record', async () => {
    const doc = await service.generateLoanAgreement({ loanId: 'LN-2026-000001' });
    expect(doc.content.toString()).toContain('LN-2026-000001');
    expect(doc.content.toString()).toContain('10,000.00');
  });

  it('renders a receipt from a savings transaction', async () => {
    const doc = await service.generateReceipt({ transactionId: txn.id });
    expect(doc.content.toString()).toContain(txn.id);
    expect(doc.content.toString()).toContain('1,500.00');
  });

  it('renders a share certificate from share account balances', async () => {
    const doc = await service.generateShareCertificate({ memberId: 'MEM-10001' });
    expect(doc.content.toString()).toContain('5,000.00');
    expect(doc.content.toString()).toContain('MEM-10001');
  });
});
