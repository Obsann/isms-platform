import { createHmac, timingSafeEqual } from 'node:crypto';
import { randomUUID } from 'node:crypto';
import { UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';

const UUID_RE =
  '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const TX_REF_RE = new RegExp(`^isms-(${UUID_RE})-(${UUID_RE})$`, 'i');
const AMOUNT_RE = /^(0|[1-9]\d*)(\.\d{1,2})?$/;

/**
 * Chapa hosted checkout reference. Tenant id is embedded so the public webhook
 * can open the right RLS session without a JWT.
 */
export function buildChapaTxRef(tenantId: string): string {
  return `isms-${tenantId}-${randomUUID()}`;
}

export function parseTenantIdFromTxRef(txRef: string): string | null {
  const match = TX_REF_RE.exec(txRef.trim());
  return match?.[1]?.toLowerCase() ?? null;
}

/**
 * Normalize an Ethiopian MSISDN to E.164 (`+2519…`). Returns null when the
 * digits are not a plausible local mobile number.
 */
export function normalizeEthiopianPhone(input: string | null | undefined): string | null {
  if (!input?.trim()) {
    return null;
  }
  const digits = input.replace(/\D/g, '');
  let national: string | null = null;
  if (digits.startsWith('251') && digits.length === 12) {
    national = digits.slice(3);
  } else if (digits.startsWith('0') && digits.length === 10) {
    national = digits.slice(1);
  } else if (digits.length === 9) {
    national = digits;
  }
  if (!national || !/^9[1-9]\d{7}$/.test(national)) {
    return null;
  }
  return `+251${national}`;
}

/** Chapa's initialize payload prefers `09xxxxxxxx` over E.164. */
export function toChapaPhone(e164: string): string {
  const digits = e164.replace(/\D/g, '');
  if (digits.startsWith('251') && digits.length === 12) {
    return `0${digits.slice(3)}`;
  }
  return e164;
}

/**
 * Chapa test/sandbox merchants often reject non-gmail/yahoo addresses.
 * Live mode keeps the member email as stored. Never used as an auth signal.
 */
export function mapChapaCustomerEmail(
  email: string | null | undefined,
  live: boolean,
): string {
  const trimmed = email?.trim().toLowerCase() ?? '';
  if (live) {
    return trimmed.includes('@') ? trimmed : 'member@gmail.com';
  }
  if (/@(gmail|yahoo)\.com$/i.test(trimmed)) {
    return trimmed;
  }
  const local = (trimmed.split('@')[0] || 'member').replace(/[^a-z0-9.]/gi, '') || 'member';
  return `${local.slice(0, 32)}@gmail.com`;
}

export function normalizeEtbAmount(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value <= 0) {
      throw new UnprocessableEntityException('Amount must be a positive decimal figure');
    }
    const [whole, fraction = '00'] = value.toFixed(2).split('.');
    return `${whole}.${fraction}`;
  }
  if (typeof value === 'string') {
    const cleaned = value.replace(/,/g, '').trim();
    if (!AMOUNT_RE.test(cleaned)) {
      throw new UnprocessableEntityException('Amount must be a positive decimal figure');
    }
    const [whole, fraction = ''] = cleaned.split('.');
    const normalized = `${whole}.${fraction.padEnd(2, '0')}`;
    if (normalized === '0.00') {
      throw new UnprocessableEntityException('Amount must be a positive decimal figure');
    }
    return normalized;
  }
  throw new UnprocessableEntityException('Amount must be a positive decimal figure');
}

export function readSignatureHeader(headers: Record<string, string | string[] | undefined>): string | null {
  const keys = ['x-chapa-signature', 'chapa-signature', 'x-signature'];
  for (const key of keys) {
    const raw = headers[key];
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (value?.trim()) {
      return value.trim();
    }
  }
  return null;
}

export function hmacSha256Hex(secret: string, payload: Buffer | string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

function normalizeProvidedSignature(provided: string): string {
  return provided.replace(/^sha256=/i, '').trim().toLowerCase();
}

export function signaturesMatch(expectedHex: string, provided: string): boolean {
  const expected = expectedHex.toLowerCase();
  const received = normalizeProvidedSignature(provided);
  if (!expected || !received || expected.length !== received.length) {
    return false;
  }
  return timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(received, 'utf8'));
}

/**
 * HMAC-SHA256 over the raw webhook body (preferred) and, if that fails, over
 * `JSON.stringify(parsed)` — Chapa's own samples sign the parsed object.
 */
export function assertChapaWebhookSignature(input: {
  secret: string | undefined;
  rawBody: Buffer | undefined;
  parsedBody: unknown;
  signature: string | null;
}): void {
  const secret = input.secret?.trim();
  if (!secret) {
    throw new UnauthorizedException('Webhook signature verification failed');
  }
  if (!input.signature) {
    throw new UnauthorizedException('Webhook signature verification failed');
  }

  const candidates: string[] = [];
  if (input.rawBody && input.rawBody.length > 0) {
    candidates.push(hmacSha256Hex(secret, input.rawBody));
  }
  try {
    candidates.push(hmacSha256Hex(secret, JSON.stringify(input.parsedBody ?? {})));
  } catch {
    // ignore stringify failures — raw-body candidate may still match
  }

  if (!candidates.some((expected) => signaturesMatch(expected, input.signature!))) {
    throw new UnauthorizedException('Webhook signature verification failed');
  }
}

export function extractChapaTxRef(body: Record<string, unknown>): string | null {
  const direct = body.tx_ref ?? body.trx_ref;
  if (typeof direct === 'string' && direct.trim()) {
    return direct.trim();
  }
  const data = body.data;
  if (data && typeof data === 'object') {
    const nested = (data as Record<string, unknown>).tx_ref;
    if (typeof nested === 'string' && nested.trim()) {
      return nested.trim();
    }
  }
  return null;
}

export function chapaStatusIsPaid(status: unknown): boolean {
  if (typeof status !== 'string') {
    return false;
  }
  const normalized = status.trim().toLowerCase();
  return normalized === 'success' || normalized === 'paid' || normalized === 'completed';
}

export function chapaStatusIsFailed(status: unknown): boolean {
  if (typeof status !== 'string') {
    return false;
  }
  const normalized = status.trim().toLowerCase();
  return (
    normalized === 'failed' ||
    normalized === 'cancelled' ||
    normalized === 'canceled' ||
    normalized === 'expired'
  );
}
