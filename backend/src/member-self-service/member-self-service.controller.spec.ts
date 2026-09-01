/// <reference types="jest" />
import { ForbiddenException } from '@nestjs/common';
import { MemberSelfServiceController } from './member-self-service.controller';
import { MemberSelfServiceService } from './member-self-service.service';
import type { AuthenticatedUser } from '../common';
import type { MemberBalanceView, MemberLoansView, MemberStatementView } from './member-self-service.types';

describe('MemberSelfServiceController - Ownership Security', () => {
  let controller: MemberSelfServiceController;
  let service: jest.Mocked<MemberSelfServiceService>;

  const mockBalance: MemberBalanceView = {
    memberId: 'MEM-1001',
    memberNumber: 'MEM-10001',
    fullName: 'Abebe Bikila',
    accounts: [],
    asOf: new Date().toISOString(),
  };

  const mockStatement: MemberStatementView = {
    memberId: 'MEM-1001',
    memberNumber: 'MEM-10001',
    fullName: 'Abebe Bikila',
    transactions: [],
    asOf: new Date().toISOString(),
  };

  const mockLoans: MemberLoansView = {
    memberId: 'MEM-1001',
    memberNumber: 'MEM-10001',
    fullName: 'Abebe Bikila',
    status: 'available',
    loans: [],
  };

  beforeEach(() => {
    service = {
      getBalance: jest.fn().mockResolvedValue(mockBalance),
      getStatement: jest.fn().mockResolvedValue(mockStatement),
      getLoans: jest.fn().mockResolvedValue(mockLoans),
      assertCallerOwnsMember: jest.fn().mockImplementation(async (user: AuthenticatedUser, id: string) => {
        if (user.role === 'member' && id !== 'MEM-1001') {
          throw new ForbiddenException('Members can only access their own record');
        }
      }),
    } as unknown as jest.Mocked<MemberSelfServiceService>;

    controller = new MemberSelfServiceController(service);
  });

  describe('member accessing their own record', () => {
    const memberUser: AuthenticatedUser = {
      staffId: 'MEM-1001',
      tenantId: 'tenant-a',
      role: 'member',
    };

    it('allows getBalance when requested ID matches authenticated member ID', async () => {
      const res = await controller.getBalance('MEM-1001', memberUser);
      expect(res).toBe(mockBalance);
      expect(service.getBalance).toHaveBeenCalledWith('MEM-1001');
    });

    it('allows getStatement when requested ID matches authenticated member ID', async () => {
      const res = await controller.getStatement('MEM-1001', {}, memberUser);
      expect(res).toBe(mockStatement);
      expect(service.getStatement).toHaveBeenCalledWith('MEM-1001', {});
    });

    it('allows getLoans when requested ID matches authenticated member ID', async () => {
      const res = await controller.getLoans('MEM-1001', memberUser);
      expect(res).toBe(mockLoans);
      expect(service.getLoans).toHaveBeenCalledWith('MEM-1001');
    });
  });

  describe('member accessing another member record', () => {
    const memberUser: AuthenticatedUser = {
      staffId: 'MEM-1001',
      tenantId: 'tenant-a',
      role: 'member',
    };

    it('throws 403 ForbiddenException on getBalance when requested ID belongs to another member', async () => {
      await expect(controller.getBalance('MEM-9999', memberUser)).rejects.toThrow(ForbiddenException);
      expect(service.getBalance).not.toHaveBeenCalled();
    });

    it('throws 403 ForbiddenException on getStatement when requested ID belongs to another member', async () => {
      await expect(controller.getStatement('MEM-9999', {}, memberUser)).rejects.toThrow(ForbiddenException);
      expect(service.getStatement).not.toHaveBeenCalled();
    });

    it('throws 403 ForbiddenException on getLoans when requested ID belongs to another member', async () => {
      await expect(controller.getLoans('MEM-9999', memberUser)).rejects.toThrow(ForbiddenException);
      expect(service.getLoans).not.toHaveBeenCalled();
    });
  });

  describe('staff/admin access (teller, tenant-admin, loan-officer)', () => {
    const roles: AuthenticatedUser['role'][] = ['teller', 'tenant-admin', 'loan-officer'];

    roles.forEach((role) => {
      it(`allows ${role} to access any member record for getBalance`, async () => {
        const staffUser: AuthenticatedUser = {
          staffId: 'STAFF-1',
          tenantId: 'tenant-a',
          role,
        };

        const res = await controller.getBalance('MEM-9999', staffUser);
        expect(res).toBe(mockBalance);
        expect(service.getBalance).toHaveBeenCalledWith('MEM-9999');
      });

      it(`allows ${role} to access any member record for getStatement`, async () => {
        const staffUser: AuthenticatedUser = {
          staffId: 'STAFF-1',
          tenantId: 'tenant-a',
          role,
        };

        const res = await controller.getStatement('MEM-9999', {}, staffUser);
        expect(res).toBe(mockStatement);
        expect(service.getStatement).toHaveBeenCalledWith('MEM-9999', {});
      });

      it(`allows ${role} to access any member record for getLoans`, async () => {
        const staffUser: AuthenticatedUser = {
          staffId: 'STAFF-1',
          tenantId: 'tenant-a',
          role,
        };

        const res = await controller.getLoans('MEM-9999', staffUser);
        expect(res).toBe(mockLoans);
        expect(service.getLoans).toHaveBeenCalledWith('MEM-9999');
      });
    });
  });
});
