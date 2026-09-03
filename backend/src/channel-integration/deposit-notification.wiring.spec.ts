/// <reference types="jest" />
import { SavingsSharesService } from '../savings-shares';

describe('deposit → notification wiring (Task 25)', () => {
  const account = {
    id: 'acc-1',
    memberId: 'member-1',
    status: 'active',
    currency: 'ETB',
    accountNumber: 'SAV-1001',
  };

  const txn = {
    id: 'txn-1',
    amount: '1500.00',
    currency: 'ETB',
    balanceAfter: '1500.00',
    reference: 'DEP-VERIFY',
  };

  const memberService = {
    findById: jest.fn(),
  };
  const ledger = {
    postDeposit: jest.fn(),
  };
  const notifications = {
    enqueue: jest.fn(),
    send: jest.fn(),
  };
  const tenantContext = {
    getTenantId: jest.fn().mockReturnValue('tenant-1'),
    repo: jest.fn(),
  };
  const configService = {
    get: jest.fn().mockReturnValue('3'),
  };

  let service: SavingsSharesService;

  beforeEach(() => {
    jest.clearAllMocks();
    tenantContext.repo.mockReturnValue({
      findOne: jest.fn().mockResolvedValue(account),
    });
    ledger.postDeposit.mockResolvedValue(txn);
    memberService.findById.mockResolvedValue({
      email: 'abebe.bikila@tenant-a.dev',
      fullName: 'Abebe Kebede Bikila',
    });
    service = new SavingsSharesService(
      tenantContext as never,
      configService as never,
      memberService as never,
      ledger as never,
      notifications as never,
      { requireForHighValue: jest.fn() } as never,
    );
  });

  it('looks up the member in-request and queues a deposit-posted email', async () => {
    const result = await service.deposit({ accountId: 'acc-1', amount: '1500.00' });

    expect(result).toEqual(txn);
    expect(memberService.findById).toHaveBeenCalledWith('member-1');
    expect(notifications.enqueue).toHaveBeenCalledWith({
      template: 'deposit-posted',
      to: 'abebe.bikila@tenant-a.dev',
      data: expect.objectContaining({
        memberName: 'Abebe Kebede Bikila',
        amount: '1500.00',
        currency: 'ETB',
        balanceAfter: '1500.00',
        accountNumber: 'SAV-1001',
        reference: 'DEP-VERIFY',
      }),
    });
  });

  it('still returns the posting if the member has no email', async () => {
    memberService.findById.mockResolvedValue({ email: null, fullName: 'No Mail' });

    await expect(service.deposit({ accountId: 'acc-1', amount: '10.00' })).resolves.toEqual(txn);
    expect(notifications.enqueue).not.toHaveBeenCalled();
  });
});
