import type { Amount, LoanId, MemberId, TransactionId } from '../types';

export interface StatementRequest {
  memberId: MemberId;
  /** ISO dates, inclusive. */
  from: string;
  to: string;
}

export interface GeneratedDocument {
  documentId: string;
  fileName: string;
  contentType: string;
  content: Buffer;
}

export interface ReceiptRequest {
  transactionId: TransactionId;
}

export interface ShareCertificateRequest {
  memberId: MemberId;
}

export interface LoanAgreementRequest {
  loanId: LoanId;
}

export interface TrialBalanceLine {
  account: string;
  debit: Amount;
  credit: Amount;
}

/**
 * Read straight off the ledger. `balanced` must be true for a tenant whose ledger is
 * intact — a false value is a data-integrity finding, not a display quirk.
 */
export interface TrialBalance {
  lines: TrialBalanceLine[];
  totalDebits: Amount;
  totalCredits: Amount;
  balanced: boolean;
}
