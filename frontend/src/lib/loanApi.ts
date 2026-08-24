import apiClient from './api-client';
import type { Loan, LoanStatus } from '@/types';

export interface EligibilityDecision {
  eligible: boolean;
  maxAmount: string;
  reasons: string[];
}

export interface GuarantorPledge {
  pledgeId: string;
  loanId: string;
  guarantorMemberId: string;
  pledgedAmount: string;
  holdId: string;
  status?: string;
}

export interface LoanRepaymentRow {
  id: string;
  tenantId: string;
  loanId: string;
  amount: string;
  reference: string | null;
  paidAt: string;
}

export interface ApplyLoanInput {
  memberId: string;
  requestedAmount: string;
  termMonths: number;
  purpose?: string;
}

export const loanApi = {
  /** Submit a new loan application. */
  apply(data: ApplyLoanInput): Promise<Loan> {
    return apiClient.post<Loan>('/loans', data);
  },

  /** Fetch a single loan by ID. */
  getById(id: string): Promise<Loan> {
    return apiClient.get<Loan>(`/loans/${id}`);
  },

  /** Check eligibility calculation for a loan. */
  checkEligibility(id: string): Promise<EligibilityDecision> {
    return apiClient.get<EligibilityDecision>(`/loans/${id}/eligibility`);
  },

  /** Approve or reject a pending loan. */
  decideApproval(id: string, approved: boolean, note?: string): Promise<Loan> {
    return apiClient.patch<Loan>(`/loans/${id}/approve`, { approved, note });
  },

  /** Disburse an approved loan to a member's savings account. */
  disburse(id: string, destinationAccountId: string, amount: string): Promise<LoanRepaymentRow> {
    return apiClient.post<LoanRepaymentRow>(`/loans/${id}/disburse`, { destinationAccountId, amount });
  },

  /** Record a repayment against a disbursed loan. */
  recordRepayment(id: string, amount: string, reference?: string): Promise<LoanRepaymentRow> {
    return apiClient.post<LoanRepaymentRow>(`/loans/${id}/repayments`, { amount, reference });
  },

  /** Record a guarantor pledge against a loan. */
  recordGuarantorPledge(
    id: string,
    guarantorMemberId: string,
    guarantorAccountId: string,
    pledgedAmount: string,
  ): Promise<GuarantorPledge> {
    return apiClient.post<GuarantorPledge>(`/loans/${id}/guarantors`, {
      guarantorMemberId,
      guarantorAccountId,
      pledgedAmount,
    });
  },

  /** Fetch all guarantor pledges recorded for a loan. */
  getGuarantors(id: string): Promise<GuarantorPledge[]> {
    return apiClient.get<GuarantorPledge[]>(`/loans/${id}/guarantors`);
  },

  /** Manually release a guarantor hold. */
  releaseGuarantorPledge(pledgeId: string): Promise<GuarantorPledge> {
    return apiClient.post<GuarantorPledge>(`/loans/guarantors/${pledgeId}/release`, {});
  },
};
