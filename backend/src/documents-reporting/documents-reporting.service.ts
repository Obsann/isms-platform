import { Injectable, NotImplementedException } from '@nestjs/common';
import type { ReportingSummary } from '../types';
import type {
  GeneratedDocument,
  LoanAgreementRequest,
  ReceiptRequest,
  ShareCertificateRequest,
  StatementRequest,
  TrialBalance,
} from './documents-reporting.types';

/**
 * Document & Reporting vertical — owner: **Biruk** (Tasks 19–21).
 *
 * Read-only: every figure comes from the ledger through the ledger service, so a
 * generated statement can't disagree with the books. This module owns templates and
 * aggregation, never business logic or writes.
 */
@Injectable()
export class DocumentsReportingService {
  /** `GET /api/members/{id}/statement` */
  generateMemberStatement(request: StatementRequest): Promise<GeneratedDocument> {
    throw new NotImplementedException(
      'DocumentsReportingService.generateMemberStatement is not implemented (Task 20)',
    );
  }

  generateLoanAgreement(request: LoanAgreementRequest): Promise<GeneratedDocument> {
    throw new NotImplementedException(
      'DocumentsReportingService.generateLoanAgreement is not implemented (Task 20)',
    );
  }

  generateReceipt(request: ReceiptRequest): Promise<GeneratedDocument> {
    throw new NotImplementedException(
      'DocumentsReportingService.generateReceipt is not implemented (Task 20)',
    );
  }

  generateShareCertificate(request: ShareCertificateRequest): Promise<GeneratedDocument> {
    throw new NotImplementedException(
      'DocumentsReportingService.generateShareCertificate is not implemented (Task 20)',
    );
  }

  getSavingsSummary(): Promise<ReportingSummary> {
    throw new NotImplementedException(
      'DocumentsReportingService.getSavingsSummary is not implemented (Task 20)',
    );
  }

  getLoanPortfolio(): Promise<ReportingSummary> {
    throw new NotImplementedException(
      'DocumentsReportingService.getLoanPortfolio is not implemented (Task 20)',
    );
  }

  /** Sums to zero across the tenant when the ledger is intact. */
  getTrialBalance(): Promise<TrialBalance> {
    throw new NotImplementedException(
      'DocumentsReportingService.getTrialBalance is not implemented (Task 20)',
    );
  }
}
