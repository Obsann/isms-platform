/// <reference types="jest" />
import { BadRequestException, ConflictException } from '@nestjs/common';
import { LoanService } from './loan.service';

describe('LoanService - Guarantor & Collateral Logic (Task 17)', () => {
  const mockTenantContext = {
    getTenantId: jest.fn().mockReturnValue('00000000-0000-0000-0000-000000000001'),
    repo: jest.fn(),
  };

  const mockSavingsSharesService = {
    getLoanEligibilityCeiling: jest.fn(),
  };

  const mockLedgerService = {
    holdFunds: jest.fn(),
    releaseHold: jest.fn(),
  };

  let service: LoanService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new LoanService(
      mockTenantContext as never,
      mockSavingsSharesService as never,
      mockLedgerService as never,
    );
  });

  describe('recordGuarantorPledge', () => {
    it('throws BadRequestException if borrower tries to guarantee their own loan', async () => {
      const loanRepo = {
        findOne: jest.fn().mockResolvedValue({
          id: 'loan-1',
          memberId: 'member-borrower',
          status: 'pending',
          loanNumber: 'LN-2026-100',
        }),
      };
      mockTenantContext.repo.mockReturnValue(loanRepo);

      await expect(
        service.recordGuarantorPledge({
          loanId: 'loan-1',
          guarantorMemberId: 'member-borrower',
          guarantorAccountId: 'account-1',
          pledgedAmount: '5000.00',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('places a hold on the guarantor savings account and creates pledge record', async () => {
      const loanRepo = {
        findOne: jest.fn().mockResolvedValue({
          id: 'loan-1',
          tenantId: '00000000-0000-0000-0000-000000000001',
          memberId: 'member-borrower',
          status: 'pending',
          loanNumber: 'LN-2026-100',
        }),
      };
      const guarantorRepo = {
        create: jest.fn().mockImplementation((val) => ({ id: 'pledge-1', ...val })),
        save: jest.fn().mockImplementation(async (val) => val),
      };

      mockTenantContext.repo.mockImplementation((entity) => {
        if (entity.name === 'LoanEntity') return loanRepo;
        if (entity.name === 'LoanGuarantorEntity') return guarantorRepo;
        return null;
      });

      mockLedgerService.holdFunds.mockResolvedValue({
        holdId: 'hold-123',
        accountId: 'guarantor-account-1',
        amount: '5000.00',
        releasedAt: null,
      });

      const res = await service.recordGuarantorPledge({
        loanId: 'loan-1',
        guarantorMemberId: 'member-guarantor',
        guarantorAccountId: 'guarantor-account-1',
        pledgedAmount: '5000.00',
      });

      expect(mockLedgerService.holdFunds).toHaveBeenCalledWith({
        accountId: 'guarantor-account-1',
        amount: '5000.00',
        reason: 'Guarantor pledge for loan LN-2026-100',
      });
      expect(res.pledgeId).toBe('pledge-1');
      expect(res.holdId).toBe('hold-123');
      expect(res.pledgedAmount).toBe('5000.00');
    });
  });

  describe('releaseGuarantorPledge', () => {
    it('releases hold via LedgerService and updates pledge status', async () => {
      const pledgeRecord = {
        id: 'pledge-1',
        loanId: 'loan-1',
        guarantorMemberId: 'guarantor-1',
        holdId: 'hold-123',
        status: 'active',
        pledgedAmount: '5000.00',
      };
      const guarantorRepo = {
        findOne: jest.fn().mockResolvedValue(pledgeRecord),
        save: jest.fn().mockImplementation(async (val) => val),
      };
      mockTenantContext.repo.mockReturnValue(guarantorRepo);
      mockLedgerService.releaseHold.mockResolvedValue({
        holdId: 'hold-123',
        releasedAt: new Date().toISOString(),
      });

      const res = await service.releaseGuarantorPledge('pledge-1');

      expect(mockLedgerService.releaseHold).toHaveBeenCalledWith('hold-123');
      expect(pledgeRecord.status).toBe('released');
      expect(res.pledgeId).toBe('pledge-1');
    });

    it('throws ConflictException if pledge is already released', async () => {
      const pledgeRecord = {
        id: 'pledge-1',
        status: 'released',
      };
      const guarantorRepo = {
        findOne: jest.fn().mockResolvedValue(pledgeRecord),
      };
      mockTenantContext.repo.mockReturnValue(guarantorRepo);

      await expect(service.releaseGuarantorPledge('pledge-1')).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
