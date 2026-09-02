/// <reference types="jest" />
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { AuthenticatedUser } from '../common';
import { ChapaPaymentEntity } from './chapa-payment.entity';
import { hmacSha256Hex } from './chapa.helpers';
import { ChapaService } from './chapa.service';

describe('ChapaService', () => {
  const memberUser: AuthenticatedUser = {
    staffId: 'staff-member-1',
    tenantId: '11111111-1111-4111-8111-111111111111',
    role: 'member',
  };

  const linkedMember = {
    id: 'member-1',
    firstName: 'Abebe',
    lastName: 'Bikila',
    email: 'abebe@gmail.com',
    phone: '+251911234567',
  };

  const ownAccount = {
    id: 'acc-own',
    memberId: 'member-1',
    type: 'savings' as const,
    status: 'active' as const,
    accountNumber: 'SAV-1',
  };

  const otherAccount = {
    id: 'acc-other',
    memberId: 'member-2',
    type: 'savings' as const,
    status: 'active' as const,
    accountNumber: 'SAV-2',
  };

  const paymentRepo = {
    create: jest.fn((row: object) => row),
    save: jest.fn(async (row: object) => row),
    findOne: jest.fn(),
  };

  const tenantContext = {
    getTenantId: jest.fn().mockReturnValue(memberUser.tenantId),
    repo: jest.fn().mockReturnValue(paymentRepo),
    runInTenantContext: jest.fn(),
  };

  const memberService = {
    findByEmail: jest.fn(),
  };

  const staffAccounts = {
    findSummaryById: jest.fn(),
  };

  const savings = {
    getAccountById: jest.fn(),
    getAccountsByMember: jest.fn(),
    deposit: jest.fn(),
  };

  const env: Record<string, string | undefined> = {};
  const config = {
    get: (key: string, fallback?: string) => env[key] ?? fallback,
  };

  let service: ChapaService;

  beforeEach(() => {
    jest.clearAllMocks();
    for (const key of Object.keys(env)) {
      delete env[key];
    }
    env.FRONTEND_URL = 'http://localhost:3000';
    tenantContext.getTenantId.mockReturnValue(memberUser.tenantId);
    tenantContext.repo.mockReturnValue(paymentRepo);
    paymentRepo.create.mockImplementation((row: object) => row);
    paymentRepo.save.mockImplementation(async (row: object) => row);
    staffAccounts.findSummaryById.mockResolvedValue({ email: 'abebe@gmail.com' });
    memberService.findByEmail.mockResolvedValue(linkedMember);
    savings.getAccountById.mockResolvedValue(ownAccount);
    savings.getAccountsByMember.mockResolvedValue([ownAccount]);
    service = new ChapaService(
      config as never,
      tenantContext as never,
      memberService as never,
      staffAccounts as never,
      savings as never,
    );
  });

  it('returns a mock checkout URL when CHAPA_SECRET_KEY is missing', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');
    const result = await service.initializeDeposit(memberUser, { amount: '1500.00' });

    expect(result.mode).toBe('mock');
    expect(result.status).toBe('pending');
    expect(result.checkoutUrl).toContain('/member/mobile-money?tx_ref=');
    expect(result.txRef.startsWith(`isms-${memberUser.tenantId}-`)).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('refuses initialize when the account belongs to another member', async () => {
    savings.getAccountById.mockResolvedValue(otherAccount);

    await expect(
      service.initializeDeposit(memberUser, { accountId: 'acc-other', amount: '100.00' }),
    ).rejects.toThrow(ForbiddenException);
    expect(savings.deposit).not.toHaveBeenCalled();
  });

  it('rejects a webhook with a bad HMAC signature', async () => {
    env.CHAPA_WEBHOOK_SECRET = 'whsec-test';
    const rawBody = Buffer.from('{"tx_ref":"isms-x","status":"success"}');

    await expect(
      service.handleWebhook({
        rawBody,
        signature: 'not-a-real-signature',
        body: JSON.parse(rawBody.toString()),
      }),
    ).rejects.toThrow(UnauthorizedException);
    expect(tenantContext.runInTenantContext).not.toHaveBeenCalled();
    expect(savings.deposit).not.toHaveBeenCalled();
  });

  it('does not post the ledger from a valid signature until Chapa verify succeeds', async () => {
    env.CHAPA_WEBHOOK_SECRET = 'whsec-test';
    env.CHAPA_SECRET_KEY = 'CHASECK_TEST-live';
    const rawBody = Buffer.from(
      JSON.stringify({ tx_ref: `isms-${memberUser.tenantId}-22222222-2222-4222-8222-222222222222` }),
    );
    paymentRepo.findOne.mockResolvedValue({
      txRef: `isms-${memberUser.tenantId}-22222222-2222-4222-8222-222222222222`,
      memberId: 'member-1',
      accountId: 'acc-own',
      amount: '1500.00',
      status: 'pending',
      mockConfirmed: false,
    } as ChapaPaymentEntity);
    tenantContext.runInTenantContext.mockImplementation(async (_id: string, work: () => Promise<void>) =>
      work(),
    );
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'success', data: { status: 'pending', amount: '1500.00' } }),
    } as Response);

    await service.handleWebhook({
      rawBody,
      signature: hmacSha256Hex('whsec-test', rawBody),
      body: JSON.parse(rawBody.toString()),
    });

    expect(savings.deposit).not.toHaveBeenCalled();
    (global.fetch as jest.Mock).mockRestore();
  });
});
