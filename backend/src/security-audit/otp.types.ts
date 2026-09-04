export const OTP_PURPOSES = [
  'password-reset',
  'password-change',
  'large-withdrawal',
  'loan-disbursement',
] as const;

export type OtpPurpose = (typeof OTP_PURPOSES)[number];

export const HIGH_VALUE_OTP_THRESHOLD_DEFAULT = '100000.00';
export const OTP_EXPIRY_SECONDS_DEFAULT = 300;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_SECONDS = 30;
export const OTP_CODE_LENGTH = 6;

export interface OtpContext {
  amount?: string;
  accountId?: string;
  loanId?: string;
}

export interface IssueOtpInput {
  tenantId: string | null;
  staffId: string;
  email: string;
  purpose: OtpPurpose;
  context?: OtpContext;
}

export interface IssueOtpResult {
  expiresInSeconds: number;
  maskedEmail: string;
  purpose: OtpPurpose;
}

export interface VerifyOtpInput {
  staffId: string;
  purpose: OtpPurpose;
  code: string;
  context?: OtpContext;
}

export const OTP_PURPOSE_LABEL: Record<OtpPurpose, string> = {
  'password-reset': 'password reset',
  'password-change': 'password change',
  'large-withdrawal': 'large withdrawal',
  'loan-disbursement': 'loan disbursement',
};
