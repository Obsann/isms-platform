/// <reference types="jest" />
import { UnauthorizedException } from '@nestjs/common';
import {
  assertChapaWebhookSignature,
  buildChapaTxRef,
  hmacSha256Hex,
  mapChapaCustomerEmail,
  normalizeEthiopianPhone,
  parseTenantIdFromTxRef,
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
    it('keeps gmail in test mode and maps other domains', () => {
      expect(mapChapaCustomerEmail('abebe@gmail.com', false)).toBe('abebe@gmail.com');
      expect(mapChapaCustomerEmail('abebe@sacco.et', false)).toBe('abebe@gmail.com');
    });

    it('keeps the stored address in live mode', () => {
      expect(mapChapaCustomerEmail('abebe@sacco.et', true)).toBe('abebe@sacco.et');
    });
  });

  describe('tx_ref tenant embedding', () => {
    it('round-trips tenant id', () => {
      const tenantId = '11111111-1111-4111-8111-111111111111';
      const txRef = buildChapaTxRef(tenantId);
      expect(parseTenantIdFromTxRef(txRef)).toBe(tenantId);
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
