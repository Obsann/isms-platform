import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DocumentsReportingService } from './documents-reporting.service';

describe('DocumentsReportingService', () => {
  let service: DocumentsReportingService;
  let mockDataSource: any;

  beforeEach(async () => {
    mockDataSource = {
      query: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsReportingService,
        {
          provide: getDataSourceToken(),
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<DocumentsReportingService>(DocumentsReportingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate member statement', async () => {
    const doc = await service.generateMemberStatement({ memberId: 'M-101', from: '2024-01-01', to: '2024-06-01' });
    expect(doc.documentId).toContain('DOC-STMT-M-101');
    expect(doc.contentType).toBe('text/html');
    expect(doc.content.toString()).toContain('ISMS SACCO — MEMBER ACCOUNT STATEMENT');
  });

  it('should generate loan agreement', async () => {
    const doc = await service.generateLoanAgreement({ loanId: 'LN-500' });
    expect(doc.documentId).toContain('DOC-LOAN-LN-500');
    expect(doc.content.toString()).toContain('SACCO LOAN AGREEMENT CONTRACT');
  });

  it('should generate receipt', async () => {
    const doc = await service.generateReceipt({ transactionId: 'TXN-789' });
    expect(doc.documentId).toBe('DOC-RCPT-TXN-789');
    expect(doc.content.toString()).toContain('ISMS SACCO OFFICIAL RECEIPT');
  });

  it('should generate share certificate', async () => {
    const doc = await service.generateShareCertificate({ memberId: 'M-101' });
    expect(doc.documentId).toBe('DOC-CERT-M-101');
    expect(doc.content.toString()).toContain('CERTIFICATE OF SHARE CAPITAL');
  });

  it('should return savings summary', async () => {
    const summary = await service.getSavingsSummary();
    expect(summary.totalSavings).toBe('14200000.00');
  });

  it('should return loan portfolio summary', async () => {
    const portfolio = await service.getLoanPortfolio();
    expect(portfolio.totalLoansOutstanding).toBe('8320000.00');
  });

  it('should calculate trial balance and verify total debits equals total credits', async () => {
    const trialBalance = await service.getTrialBalance();
    expect(trialBalance.lines).toBeDefined();
    expect(trialBalance.lines.length).toBeGreaterThan(0);
    expect(trialBalance.totalDebits).toBe(trialBalance.totalCredits);
    expect(trialBalance.balanced).toBe(true);
  });
});
