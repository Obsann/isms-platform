import apiClient from './api-client';
import type { PaginatedResult } from '@/types';

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

export interface LoanRow {
  id: string;
  tenantId: string;
  memberId: string;
  loanNumber: string;
  requestedAmount: string;
  approvedAmount: string | null;
  disbursedAmount: string | null;
  termMonths: number;
  purpose: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'disbursed' | 'repaid' | 'defaulted' | string;
  appliedBy: string | null;
  approvedBy: string | null;
  approvalNote: string | null;
  disbursedToAccountId: string | null;
  appliedAt: string;
  approvedAt: string | null;
  disbursedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApplyLoanInput {
  memberId: string;
  requestedAmount: string;
  termMonths: number;
  purpose?: string;
}

export const loanApi = {
  /** List loans with optional filters & pagination. */
  list(params?: { search?: string; status?: string; limit?: number; offset?: number }): Promise<PaginatedResult<LoanRow>> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.status && params.status !== 'all') query.set('status', params.status);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));
    const qs = query.toString();
    return apiClient.get<PaginatedResult<LoanRow>>(`/loans${qs ? `?${qs}` : ''}`);
  },

  /** Submit a new loan application. */
  apply(data: ApplyLoanInput): Promise<LoanRow> {
    return apiClient.post<LoanRow>('/loans', data);
  },

  /** Fetch a single loan by ID. */
  getById(id: string): Promise<LoanRow> {
    return apiClient.get<LoanRow>(`/loans/${id}`);
  },

  /** Check eligibility calculation for a loan. */
  checkEligibility(id: string): Promise<EligibilityDecision> {
    return apiClient.get<EligibilityDecision>(`/loans/${id}/eligibility`);
  },

  /** Approve or reject a pending loan. */
  decideApproval(id: string, approved: boolean, note?: string): Promise<LoanRow> {
    return apiClient.patch<LoanRow>(`/loans/${id}/approve`, { approved, note });
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
