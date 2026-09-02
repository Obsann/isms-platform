import type { Amount, MemberId } from '../types';

/** Email templates standing in for the SMS/WhatsApp gateway this phase. */
export type NotificationTemplate = 'deposit-posted' | 'withdrawal-posted' | 'loan-approved' | 'otp';

export interface SendNotificationInput {
  template: NotificationTemplate;
  /** Recipient email address. */
  to: string;
  /**
   * Template variables; amounts stay decimal strings so they render unabbreviated.
   *
   * Expected keys by template:
   * - `deposit-posted` / `withdrawal-posted`: memberName, amount, currency,
   *   balanceAfter, accountNumber, reference?
   * - `loan-approved`: memberName, loanNumber, amount, currency, termMonths?
   * - `otp`: code, expirySeconds, purpose?
   */
  data: Record<string, string | number>;
}

export interface NotificationResult {
  notificationId: string;
  template: NotificationTemplate;
  sentAt: string;
}

/**
 * Generic mobile money C2B (member deposit) callback shape.
 *
 * Documented in `docs/openapi/` for Telebirr / M-PESA / CBE Birr.
 * Live member deposits go through Chapa (`ChapaService`) and still post
 * savings via `SavingsSharesService.deposit`.
 */
export interface MobileMoneyC2BWebhook {
  providerReference: string;
  memberId: MemberId;
  amount: Amount;
  occurredAt: string;
}

/** Mobile money B2C (disbursement) callback shape. Same caveat as C2B above. */
export interface MobileMoneyB2CWebhook {
  providerReference: string;
  memberId: MemberId;
  amount: Amount;
  status: 'accepted' | 'rejected';
  occurredAt: string;
}
