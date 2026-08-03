import type { Amount, MemberId } from '../types';

/** Email templates standing in for the SMS/WhatsApp gateway this phase. */
export type NotificationTemplate = 'deposit-posted' | 'withdrawal-posted' | 'loan-approved' | 'otp';

export interface SendNotificationInput {
  template: NotificationTemplate;
  /** Recipient email address. */
  to: string;
  /** Template variables; amounts stay decimal strings so they render unabbreviated. */
  data: Record<string, string | number>;
}

export interface NotificationResult {
  notificationId: string;
  template: NotificationTemplate;
  sentAt: string;
}

/**
 * Mobile money C2B (member deposit) callback shape.
 *
 * TODO(Task 26 — Liya): this phase documents the contract in `docs/openapi/` and the
 * member portal mocks it. Nothing here talks to a live gateway, and a mocked flow is
 * always shown as "pending confirmation", never as a completed deposit.
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
