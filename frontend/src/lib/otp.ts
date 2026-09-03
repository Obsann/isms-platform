import { toCents } from '@/lib/money';
import { apiClient } from '@/lib/api-client';

export const HIGH_VALUE_OTP_THRESHOLD = '100000.00';

export type OtpPurpose =
  | 'password-reset'
  | 'password-change'
  | 'large-withdrawal'
  | 'loan-disbursement';

export interface IssueOtpResult {
  expiresInSeconds: number;
  maskedEmail: string;
  purpose: OtpPurpose;
}

export function requiresHighValueOtp(amount: string): boolean {
  try {
    return toCents(amount) >= toCents(HIGH_VALUE_OTP_THRESHOLD);
  } catch {
    return false;
  }
}

export function requestOtp(body: {
  purpose: Exclude<OtpPurpose, 'password-reset'>;
  amount?: string;
  accountId?: string;
  loanId?: string;
}): Promise<IssueOtpResult> {
  return apiClient.post<IssueOtpResult>('/auth/otp/request', body);
}

export function forgotPassword(body: { tenantCode: string; email: string }): Promise<{ message: string }> {
  return apiClient.post<{ message: string }>('/auth/forgot-password', body, { skipAuth: true });
}

export function resetPassword(body: {
  tenantCode: string;
  email: string;
  otp: string;
  newPassword: string;
}): Promise<{ success: boolean; message: string }> {
  return apiClient.post<{ success: boolean; message: string }>('/auth/reset-password', body, {
    skipAuth: true,
  });
}
