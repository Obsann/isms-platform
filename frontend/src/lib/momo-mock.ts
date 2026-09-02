/**
 * Client-only mobile money mock for Task 24.
 * Payloads follow docs/openapi/momo-webhooks.yaml. Nothing is posted to a gateway
 * or the ledger. Status is always pending confirmation — never a completed success.
 */

import type { Amount, Member, MemberId } from '@/types';

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

const DEMO_MEMBER_MARKERS: Record<string, string> = {
  'abebe.bikila@tenant-a.dev': 'MOCK-C2B-DEMO-ABEBE',
  'almaz.desta@tenant-b.dev': 'MOCK-C2B-DEMO-ALMAZ',
};

type DemoC2BTemplate = Omit<MobileMoneyC2BPayload, 'memberId' | 'providerReference' | 'occurredAt'>;

const DEMO_MOMO_TEMPLATES: Record<string, DemoC2BTemplate> = {
  'abebe.bikila@tenant-a.dev': {
    provider: 'telebirr',
    accountNumber: 'SAV-10001',
    msisdn: '+251911123456',
    amount: '500.00',
    currency: 'ETB',
    status: 'PENDING',
    failureReason: null,
  },
  'almaz.desta@tenant-b.dev': {
    provider: 'cbe_birr',
    accountNumber: 'SAV-20001',
    msisdn: '+251944456789',
    amount: '2500.00',
    currency: 'ETB',
    status: 'PENDING',
    failureReason: null,
  },
};

export const MOMO_PROVIDER_LABELS: Record<MomoProvider, string> = {
  telebirr: 'Telebirr',
  mpesa: 'M-PESA Ethiopia',
  cbe_birr: 'CBE Birr',
};

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

function readAllMockedMomoRequests(): MockedMomoRequest[] {
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

function writeAllMockedMomoRequests(entries: MockedMomoRequest[]): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function readMockedMomoRequests(memberId?: MemberId): MockedMomoRequest[] {
  const all = readAllMockedMomoRequests();
  if (!memberId) return all;
  return all.filter((entry) => entry.payload.memberId === memberId);
}

/**
 * Preload presentation-friendly pending C2B mocks for seeded demo members.
 */
export function seedDemoMomoMocks(member: Member): MockedMomoRequest[] {
  const email = member.email?.trim().toLowerCase() ?? '';
  const marker = DEMO_MEMBER_MARKERS[email];
  const template = DEMO_MOMO_TEMPLATES[email];
  if (!marker || !template) {
    return readMockedMomoRequests(member.id);
  }

  const all = readAllMockedMomoRequests();
  const forMember = all.filter((entry) => entry.payload.memberId === member.id);
  if (forMember.some((entry) => entry.payload.providerReference === marker)) {
    return forMember;
  }

  const demoEntry: MockedMomoRequest = {
    id: `demo-${marker}`,
    direction: 'c2b',
    label: 'Wallet deposit (C2B)',
    payload: {
      ...template,
      memberId: member.id,
      providerReference: marker,
      occurredAt: '2026-08-15T10:30:00.000Z',
    },
  };

  const withoutMarker = all.filter((entry) => entry.payload.providerReference !== marker);
  writeAllMockedMomoRequests([demoEntry, ...withoutMarker]);
  return readMockedMomoRequests(member.id);
}

export function saveMockedMomoRequest(entry: MockedMomoRequest): MockedMomoRequest[] {
  const next = [entry, ...readAllMockedMomoRequests()];
  writeAllMockedMomoRequests(next);
  return readMockedMomoRequests(entry.payload.memberId);
}
