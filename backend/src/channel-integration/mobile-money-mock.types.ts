import type { Amount, MemberId } from '../types';
import type { MomoStagedDirection, MomoStagedProvider } from './mobile-money-staged-request.entity';

export interface MobileMoneyC2BStagedPayload {
  providerReference: string;
  provider: MomoStagedProvider;
  memberId: MemberId;
  accountNumber: string;
  msisdn: string;
  amount: Amount;
  currency: 'ETB';
  status: 'PENDING';
  failureReason: null;
  occurredAt: string;
}

export interface MobileMoneyB2CStagedPayload {
  providerReference: string;
  provider: MomoStagedProvider;
  memberId: MemberId;
  loanId: string | null;
  msisdn: string;
  amount: Amount;
  currency: 'ETB';
  status: 'PENDING';
  failureReason: null;
  occurredAt: string;
}

export type StagedMomoRequestView =
  | { id: string; direction: 'c2b'; label: string; payload: MobileMoneyC2BStagedPayload }
  | { id: string; direction: 'b2c'; label: string; payload: MobileMoneyB2CStagedPayload };

export function momoDirectionLabel(direction: MomoStagedDirection): string {
  return direction === 'c2b' ? 'Wallet deposit (C2B)' : 'Wallet disbursement (B2C)';
}
