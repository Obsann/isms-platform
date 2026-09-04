/// <reference types="jest" />
import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { LoanService } from './loan.service';

describe('LoanService - Business Rules & RBAC Threshold (Tasks 16–18, D-30-01, D-30-02)', () => {
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

  const mockMemberService = {
    findById: jest.fn(),
  };

  const mockNotifications = {
    enqueue: jest.fn(),
    send: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockImplementation((key, defaultVal) => {
      if (key === 'LOAN_APPROVAL_THRESHOLD') return '50000.00';
      return defaultVal;
    }),
  };

  let service: LoanService;

  beforeEach(() => {
    jest.clearAllMocks();
    const mockOtp = { requireForHighValue: jest.fn().mockResolvedValue(undefined) };

    service = new LoanService(
      mockTenantContext as never,
      mockSavingsSharesService as never,
      mockLedgerService as never,
      mockMemberService as never,
      mockNotifications as never,
      mockConfigService as never,
      mockOtp as never,
    );
  });

  describe('checkEligibility & apply (D-30-01)', () => {
    it('calculates eligibility strictly from borrower savings multiplier', async () => {
      mockSavingsSharesService.getLoanEligibilityCeiling.mockResolvedValue({
        memberId: 'member-1',
        savingsBalance: '10000.00',
        multiplier: 3,
        maxLoanAmount: '30000.00',
      });

      const eligibleResult = await service.checkEligibility({
        memberId: 'member-1',
        requestedAmount: '30000.00',
        termMonths: 12,
      });

      expect(eligibleResult.eligible).toBe(true);
      expect(eligibleResult.maxAmount).toBe('30000.00');
      expect(eligibleResult.reasons).toHaveLength(0);

      const excessResult = await service.checkEligibility({
        memberId: 'member-1',
        requestedAmount: '35000.00',
        termMonths: 12,
      });

      expect(excessResult.eligible).toBe(false);
      expect(excessResult.reasons[0]).toContain('exceeds the allowed ceiling of 30000.00');
    });

    it('rejects loan application if requested amount exceeds borrower ceiling', async () => {
      mockSavingsSharesService.getLoanEligibilityCeiling.mockResolvedValue({
        memberId: 'member-1',
        savingsBalance: '5000.00',
        multiplier: 3,
        maxLoanAmount: '15000.00',
      });

      await expect(
        service.apply({
          memberId: 'member-1',
          requestedAmount: '20000.00',
          termMonths: 12,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('decideApproval - Threshold Routing (D-30-02)', () => {
    it('allows Manager (tenant-admin) to approve high-value loan (> 50,000 ETB)', async () => {
      const loanEntity = {
        id: 'loan-high',
        loanNumber: 'LN-2026-000100',
        requestedAmount: '75000.00',
        status: 'pending',
        tenantId: '00000000-0000-0000-0000-000000000001',
        memberId: 'member-1',
        termMonths: 24,
      };
      const loanRepo = {
        findOne: jest.fn().mockResolvedValue(loanEntity),
        save: jest.fn().mockImplementation(async (val) => val),
      };
      mockTenantContext.repo.mockReturnValue(loanRepo);
      mockMemberService.findById.mockResolvedValue({
        id: 'member-1',
        email: 'borrower@sacco.dev',
        fullName: 'Abebe Bikila',
      });

      const res = await service.decideApproval({
        loanId: 'loan-high',
        approvedBy: 'staff-admin',
        approverRole: 'tenant-admin',
        approved: true,
        note: 'Manager approved high-value loan',
      });

      expect(res.status).toBe('approved');
      expect(res.approvedAmount).toBe('75000.00');
      expect(loanRepo.save).toHaveBeenCalled();
    });

    it('rejects Loan Officer trying to approve high-value loan (> 50,000 ETB) with ForbiddenException', async () => {
      const loanEntity = {
        id: 'loan-high',
        loanNumber: 'LN-2026-000100',
        requestedAmount: '75000.00',
        status: 'pending',
      };
      const loanRepo = {
        findOne: jest.fn().mockResolvedValue(loanEntity),
      };
      mockTenantContext.repo.mockReturnValue(loanRepo);

      await expect(
        service.decideApproval({
          loanId: 'loan-high',
          approvedBy: 'staff-officer',
          approverRole: 'loan-officer',
          approved: true,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows Loan Officer to approve standard loan (<= 50,000 ETB)', async () => {
      const loanEntity = {
        id: 'loan-std',
        loanNumber: 'LN-2026-000101',
        requestedAmount: '30000.00',
        status: 'pending',
        tenantId: '00000000-0000-0000-0000-000000000001',
        memberId: 'member-1',
        termMonths: 12,
      };
      const loanRepo = {
        findOne: jest.fn().mockResolvedValue(loanEntity),
        save: jest.fn().mockImplementation(async (val) => val),
      };
      mockTenantContext.repo.mockReturnValue(loanRepo);
      mockMemberService.findById.mockResolvedValue({
        id: 'member-1',
        email: 'borrower@sacco.dev',
        fullName: 'Abebe Bikila',
      });

      const res = await service.decideApproval({
        loanId: 'loan-std',
        approvedBy: 'staff-officer',
        approverRole: 'loan-officer',
        approved: true,
      });

      expect(res.status).toBe('approved');
      expect(res.approvedAmount).toBe('30000.00');
    });

    it('rejects unauthorized roles (teller, member) trying to approve a loan', async () => {
      const loanEntity = {
        id: 'loan-std',
        loanNumber: 'LN-2026-000101',
        requestedAmount: '30000.00',
        status: 'pending',
      };
      const loanRepo = {
        findOne: jest.fn().mockResolvedValue(loanEntity),
      };
      mockTenantContext.repo.mockReturnValue(loanRepo);

      await expect(
        service.decideApproval({
          loanId: 'loan-std',
          approvedBy: 'staff-teller',
          approverRole: 'teller',
          approved: true,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
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

  describe('findByMemberId', () => {
    it('returns all loans for a given memberId', async () => {
      const mockLoans = [
        {
          id: 'loan-1',
          tenantId: '00000000-0000-0000-0000-000000000001',
          memberId: 'member-123',
          loanNumber: 'LN-2026-000001',
          requestedAmount: '10000.00',
          approvedAmount: '10000.00',
          disbursedAmount: '10000.00',
          termMonths: 12,
          purpose: 'Business',
          status: 'disbursed',
          appliedBy: null,
          approvedBy: null,
          approvalNote: null,
          disbursedToAccountId: null,
          appliedAt: new Date(),
          approvedAt: new Date(),
          disbursedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      const loanRepo = {
        find: jest.fn().mockResolvedValue(mockLoans),
      };
      mockTenantContext.repo.mockReturnValue(loanRepo);

      const result = await service.findByMemberId('member-123');

      expect(loanRepo.find).toHaveBeenCalledWith({
        where: { memberId: 'member-123' },
        order: { appliedAt: 'DESC' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('loan-1');
      expect(result[0].memberId).toBe('member-123');
    });
  });
});
