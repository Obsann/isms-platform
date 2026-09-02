import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';

/** Compact UUID (32 hex) + up to 12 hex nonce. Chapa rejects tx_ref over 50 chars. */
const COMPACT_UUID_RE = '[0-9a-f]{32}';
const TX_REF_RE = new RegExp(`^isms-(${COMPACT_UUID_RE})-([0-9a-f]{1,12})$`, 'i');
const AMOUNT_RE = /^(0|[1-9]\d*)(\.\d{1,2})?$/;

function compactUuid(uuid: string): string {
  return uuid.replace(/-/g, '').toLowerCase();
}

/** Reconstruct a UUID from 32 hex using the 8-4-4-4-12 grouping. */
function expandCompactUuid(hex: string): string {
  const h = hex.toLowerCase();
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

/**
 * Chapa hosted checkout reference (≤50 chars). Tenant id is a compact UUID so
 * the public webhook can open the right RLS session without a JWT.
 * Format: `isms-{32hex}-{12hex}` (50 chars).
 */
export function buildChapaTxRef(tenantId: string): string {
  const compactTenant = compactUuid(tenantId);
  const nonce = randomBytes(6).toString('hex');
  return `isms-${compactTenant}-${nonce}`;
}

export function parseTenantIdFromTxRef(txRef: string): string | null {
  const match = TX_REF_RE.exec(txRef.trim());
  return match?.[1] ? expandCompactUuid(match[1]) : null;
}

/**
 * Normalize an Ethiopian MSISDN to E.164 (`+2519…` or `+2517…`).
 * Accepts Chapa sandbox test numbers (`0900123456`, `0700123456`).
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
  if (!national || !/^[97]\d{8}$/.test(national)) {
    return null;
  }
  return `+251${national}`;
}

/** Chapa's initialize payload prefers `09xxxxxxxx` / `07xxxxxxxx`. */
export function toChapaPhone(e164: string): string {
  const digits = e164.replace(/\D/g, '');
  if (digits.startsWith('251') && digits.length === 12) {
    return `0${digits.slice(3)}`;
  }
  if (/^[97]\d{8}$/.test(digits)) {
    return `0${digits}`;
  }
  return e164;
}

export function readChapaSecret(raw: string | undefined): string {
  return raw?.trim() ?? '';
}

export function isPlaceholderChapaKey(secret: string): boolean {
  if (!secret) return true;
  const lower = secret.toLowerCase();
  if (lower.includes('xxx') || lower.includes('your-chapa')) return true;
  return secret.length < 20;
}

/** Real test or live secret — not empty and not an example placeholder. */
export function isChapaConfigured(raw: string | undefined): boolean {
  const secret = readChapaSecret(raw);
  return Boolean(secret && !isPlaceholderChapaKey(secret));
}

export function isChapaTestKey(raw: string | undefined): boolean {
  const secret = readChapaSecret(raw);
  return Boolean(secret && /^CHASECK_TEST[-_]/i.test(secret) && !isPlaceholderChapaKey(secret));
}

export function clipChapaName(value: string, fallback: string): string {
  const cleaned = value.replace(/[^\p{L}\s'-]/gu, ' ').replace(/\s+/g, ' ').trim();
  return (cleaned || fallback).slice(0, 50) || fallback;
}

/**
 * Chapa sandbox often rejects demo domains (`@tenant-a.dev`). Production keys
 * keep the stored address. Never used as an auth signal.
 */
export function mapChapaCustomerEmail(
  email: string | null | undefined,
  sandbox: boolean,
): string {
  const trimmed = email?.trim().toLowerCase() ?? '';
  if (!trimmed.includes('@')) {
    return 'member@gmail.com';
  }
  if (!sandbox) {
    return trimmed;
  }
  if (/@(gmail|yahoo)\.com$/i.test(trimmed)) {
    return trimmed;
  }
  const local = (trimmed.split('@')[0] || 'member').replace(/[^a-z0-9.]/gi, '') || 'member';
  return `${local.slice(0, 32)}@gmail.com`;
}

export function stringifyChapaError(json: unknown, fallback = 'Could not start Chapa checkout'): string {
  if (typeof json === 'string' && json.trim() && json.trim() !== '[object Object]') {
    return json.trim();
  }
  if (!json || typeof json !== 'object') {
    return fallback;
  }
  const message = (json as { message?: unknown }).message;
  if (typeof message === 'string' && message.trim()) {
    return message.trim();
  }
  if (message && typeof message === 'object') {
    try {
      const serialized = JSON.stringify(message);
      if (serialized && serialized !== '{}') {
        return serialized.length > 400 ? `${serialized.slice(0, 400)}…` : serialized;
      }
    } catch {
      /* ignore */
    }
  }
  return fallback;
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
