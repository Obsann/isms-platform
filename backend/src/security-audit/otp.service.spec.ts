/// <reference types="jest" />
import { ForbiddenException, UnprocessableEntityException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { OtpService } from './otp.service';

describe('OtpService', () => {
  const repo = {
    findOne: jest.fn(),
    create: jest.fn((row: object) => row),
    save: jest.fn(async (row: object) => row),
    update: jest.fn().mockResolvedValue({ affected: 0 }),
  };

  const tenantContext = {
    repo: jest.fn().mockReturnValue(repo),
    peekStore: jest.fn().mockReturnValue({ queryRunner: {} }),
    runInTenantContext: jest.fn(),
  };

  const config = {
    get: (key: string, fallback?: string) => {
      if (key === 'HIGH_VALUE_OTP_THRESHOLD') return '100000.00';
      if (key === 'OTP_EXPIRY_SECONDS') return '300';
      return fallback;
    },
  };

  const service = new OtpService(tenantContext as never, config as never);

  beforeEach(() => {
    jest.clearAllMocks();
    tenantContext.repo.mockReturnValue(repo);
    tenantContext.peekStore.mockReturnValue({ queryRunner: {} });
    repo.create.mockImplementation((row: object) => row);
    repo.save.mockImplementation(async (row: object) => row);
  });

  it('requires OTP at exactly 100000.00 and above', () => {
    expect(service.amountRequiresOtp('99999.99')).toBe(false);
    expect(service.amountRequiresOtp('100000.00')).toBe(true);
    expect(service.amountRequiresOtp('250000')).toBe(true);
  });

  it('skips the high-value gate below the threshold', async () => {
    await expect(
      service.requireForHighValue({
        staffId: 'staff-1',
        purpose: 'large-withdrawal',
        amount: '50000.00',
        accountId: 'acc-1',
      }),
    ).resolves.toBeUndefined();
    expect(repo.findOne).not.toHaveBeenCalled();
  });

  it('rejects a high-value movement with no code', async () => {
    await expect(
      service.requireForHighValue({
        staffId: 'staff-1',
        purpose: 'large-withdrawal',
        amount: '100000.00',
        accountId: 'acc-1',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('consumes a matching code and rejects a second use', async () => {
    const hash = await bcrypt.hash('123456', 10);
    const challenge = {
      staffId: 'staff-1',
      purpose: 'password-change',
      codeHash: hash,
      expiresAt: new Date(Date.now() + 60_000),
      consumedAt: null,
      attempts: 0,
      context: null,
    };
    repo.findOne.mockResolvedValueOnce(challenge);

    await service.verifyAndConsume({
      staffId: 'staff-1',
      purpose: 'password-change',
      code: '123456',
    });
    expect(challenge.consumedAt).toBeInstanceOf(Date);

    repo.findOne.mockResolvedValueOnce(null);
    await expect(
      service.verifyAndConsume({
        staffId: 'staff-1',
        purpose: 'password-change',
        code: '123456',
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('rejects a code bound to a different amount', async () => {
    const hash = await bcrypt.hash('654321', 10);
    repo.findOne.mockResolvedValue({
      staffId: 'staff-1',
      purpose: 'large-withdrawal',
      codeHash: hash,
      expiresAt: new Date(Date.now() + 60_000),
      consumedAt: null,
      attempts: 0,
      context: { amount: '150000.00', accountId: 'acc-1' },
    });

    await expect(
      service.verifyAndConsume({
        staffId: 'staff-1',
        purpose: 'large-withdrawal',
        code: '654321',
        context: { amount: '200000.00', accountId: 'acc-1' },
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('issues a 6-digit code', async () => {
    repo.findOne.mockResolvedValue(null);
    const { code, challenge } = await service.issue({
      tenantId: '11111111-1111-4111-8111-111111111111',
      staffId: 'staff-1',
      email: 'teller@tenant-a.dev',
      purpose: 'password-change',
    });
    expect(code).toMatch(/^\d{6}$/);
    expect(challenge.maskedEmail).toBe('t***@tenant-a.dev');
    expect(challenge.expiresInSeconds).toBe(300);
    expect(repo.save).toHaveBeenCalled();
  });
});
