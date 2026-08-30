/**
 * Client-only mobile money mock for Task 24.
 * Payloads follow docs/openapi/momo-webhooks.yaml. Nothing is posted to a gateway
 * or the ledger. Status is always pending confirmation — never a completed success.
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

const STORAGE_KEY = 'isms_momo_pending_mocks';

function newRef(prefix: string): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${stamp}-${rand}`;
}

export function buildC2BPayload(input: {
  provider: MomoProvider;
  memberId: MemberId;
  accountNumber: string;
  msisdn: string;
  amount: Amount;
}): MobileMoneyC2BPayload {
  return {
    providerReference: newRef('MOCK-C2B'),
    provider: input.provider,
    memberId: input.memberId,
    accountNumber: input.accountNumber,
    msisdn: input.msisdn,
    amount: input.amount,
    currency: 'ETB',
    status: 'PENDING',
    failureReason: null,
    occurredAt: new Date().toISOString(),
  };
}

export function buildB2CPayload(input: {
  provider: MomoProvider;
  memberId: MemberId;
  loanId: string | null;
  msisdn: string;
  amount: Amount;
}): MobileMoneyB2CPayload {
  return {
    providerReference: newRef('MOCK-B2C'),
    provider: input.provider,
    memberId: input.memberId,
    loanId: input.loanId,
    msisdn: input.msisdn,
    amount: input.amount,
    currency: 'ETB',
    status: 'PENDING',
    failureReason: null,
    occurredAt: new Date().toISOString(),
  };
}

export function readMockedMomoRequests(): MockedMomoRequest[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MockedMomoRequest[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveMockedMomoRequest(entry: MockedMomoRequest): MockedMomoRequest[] {
  const next = [entry, ...readMockedMomoRequests()];
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
