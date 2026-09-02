/**
 * Mobile money mock types for Task 24 (member portal).
 * Payloads follow docs/openapi/momo-webhooks.yaml. Persisted rows stay PENDING.
 */

import type { Amount, MemberId } from '@/types';

export type MomoProvider = 'telebirr' | 'mpesa' | 'cbe_birr';

export interface MobileMoneyC2BPayload {
  providerReference: string;
  provider: MomoProvider;
  memberId: MemberId;
  accountNumber: string;
  msisdn: string;
  amount: Amount;
  currency: 'ETB';
  status: 'PENDING';
  failureReason: null;
  occurredAt: string;
}

export interface MobileMoneyB2CPayload {
  providerReference: string;
  provider: MomoProvider;
  memberId: MemberId;
  loanId: string | null;
  msisdn: string;
  amount: Amount;
  currency: 'ETB';
  status: 'PENDING';
  failureReason: null;
  occurredAt: string;
}

export type MockedMomoRequest =
  | { id: string; direction: 'c2b'; label: string; payload: MobileMoneyC2BPayload }
  | { id: string; direction: 'b2c'; label: string; payload: MobileMoneyB2CPayload };

export const MOMO_PROVIDER_LABELS: Record<MomoProvider, string> = {
  telebirr: 'Telebirr',
  mpesa: 'M-PESA Ethiopia',
  cbe_birr: 'CBE Birr',
};

export interface StageMomoMockInput {
  direction: 'c2b' | 'b2c';
  provider: MomoProvider;
  amount: Amount;
  accountNumber?: string;
  loanId?: string;
}
