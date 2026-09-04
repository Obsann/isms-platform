/// <reference types="jest" />
import { UnauthorizedException } from '@nestjs/common';
import {
  assertChapaWebhookSignature,
  buildChapaPayoutRef,
  buildChapaTxRef,
  etbGreaterThan,
  extractChapaTxRef,
  hmacSha256Hex,
  mapChapaCustomerEmail,
  normalizeEthiopianPhone,
  parseTenantIdFromTxRef,
  stringifyChapaError,
  toChapaPhone,
} from './chapa.helpers';

describe('chapa helpers', () => {
  describe('normalizeEthiopianPhone', () => {
    it('accepts +251, 251, 0, and 9-digit local forms', () => {
      expect(normalizeEthiopianPhone('+251911234567')).toBe('+251911234567');
      expect(normalizeEthiopianPhone('251911234567')).toBe('+251911234567');
      expect(normalizeEthiopianPhone('0911234567')).toBe('+251911234567');
      expect(normalizeEthiopianPhone('911234567')).toBe('+251911234567');
    });

    it('accepts Chapa sandbox test numbers including 0900 and 0700', () => {
      expect(normalizeEthiopianPhone('0900123456')).toBe('+251900123456');
      expect(normalizeEthiopianPhone('0700123456')).toBe('+251700123456');
    });

    it('rejects incomplete numbers', () => {
      expect(normalizeEthiopianPhone('91123')).toBeNull();
      expect(normalizeEthiopianPhone('')).toBeNull();
    });
  });

  describe('toChapaPhone', () => {
    it('converts E.164 to local 09 form', () => {
      expect(toChapaPhone('+251911234567')).toBe('0911234567');
    });
  });

  describe('mapChapaCustomerEmail', () => {
    it('maps demo domains in sandbox and keeps gmail', () => {
      expect(mapChapaCustomerEmail('abebe@gmail.com', true)).toBe('abebe@gmail.com');
      expect(mapChapaCustomerEmail('abebe.bikila@tenant-a.dev', true)).toBe(
        'abebe.bikila@gmail.com',
      );
    });

    it('keeps the stored address for production keys', () => {
      expect(mapChapaCustomerEmail('abebe@sacco.et', false)).toBe('abebe@sacco.et');
    });
  });

  describe('tx_ref tenant embedding', () => {
    it('round-trips tenant id in a Chapa-safe 45-char ref', () => {
      const tenantId = '11111111-1111-4111-8111-111111111111';
      const txRef = buildChapaTxRef(tenantId);
      expect(txRef).toHaveLength(45);
      expect(txRef).toMatch(/^isms-[0-9a-f]{40}$/);
      expect(parseTenantIdFromTxRef(txRef)).toBe(tenantId);
    });

    it('reconstructs UUID hyphens from a compact 32-hex tenant segment', () => {
      expect(
        parseTenantIdFromTxRef('isms-11111111111141118111111111111111a1b2c3d4'),
      ).toBe('11111111-1111-4111-8111-111111111111');
    });

    it('still parses the previous hyphenated 50-char refs', () => {
      expect(
        parseTenantIdFromTxRef('isms-11111111111141118111111111111111-a1b2c3d4e5f6'),
      ).toBe('11111111-1111-4111-8111-111111111111');
    });

    it('round-trips tenant id in a Chapa transfer reference of at most 36 chars', () => {
      const tenantId = '11111111-1111-4111-8111-111111111111';
      const txRef = buildChapaPayoutRef(tenantId);
      expect(txRef.length).toBeLessThanOrEqual(36);
      expect(parseTenantIdFromTxRef(txRef)).toBe(tenantId);
    });

    it('rejects hyphenated UUID refs that exceed Chapa 50-char limit', () => {
      expect(
        parseTenantIdFromTxRef(
          'isms-11111111-1111-4111-8111-111111111111-22222222-2222-4222-8222-222222222222',
        ),
      ).toBeNull();
    });
  });

  describe('extractChapaTxRef', () => {
    it('prefers an ISMS reference on transfer webhooks', () => {
      expect(
        extractChapaTxRef({
          reference: 'isms-11111111111141118111111111111111a1b2c3d4',
          tx_ref: 'chapa-internal-id',
        }),
      ).toBe('isms-11111111111141118111111111111111a1b2c3d4');
    });
  });

  describe('etbGreaterThan', () => {
    it('compares two-decimal ETB strings', () => {
      expect(etbGreaterThan('100.00', '50.00')).toBe(true);
      expect(etbGreaterThan('50.00', '100.00')).toBe(false);
      expect(etbGreaterThan('50.00', '50.00')).toBe(false);
    });
  });

  describe('stringifyChapaError', () => {
    it('surfaces nested Chapa validation messages such as tx_ref length', () => {
      expect(
        stringifyChapaError({
          message: { tx_ref: ['The tx ref must not exceed 50 characters.'] },
        }),
      ).toBe('{"tx_ref":["The tx ref must not exceed 50 characters."]}');
    });
  });

  describe('assertChapaWebhookSignature', () => {
    const secret = 'whsec-test';
    const raw = Buffer.from('{"tx_ref":"isms-a","status":"success"}');

    it('accepts a matching HMAC over the raw body', () => {
      expect(() =>
        assertChapaWebhookSignature({
          secret,
          rawBody: raw,
          parsedBody: JSON.parse(raw.toString()),
          signature: hmacSha256Hex(secret, raw),
        }),
      ).not.toThrow();
    });

    it('rejects a bad signature', () => {
      expect(() =>
        assertChapaWebhookSignature({
          secret,
          rawBody: raw,
          parsedBody: JSON.parse(raw.toString()),
          signature: 'deadbeef',
        }),
      ).toThrow(UnauthorizedException);
    });

    it('rejects a missing secret', () => {
      expect(() =>
        assertChapaWebhookSignature({
          secret: '',
          rawBody: raw,
          parsedBody: {},
          signature: hmacSha256Hex(secret, raw),
        }),
      ).toThrow(UnauthorizedException);
    });
  });
});
