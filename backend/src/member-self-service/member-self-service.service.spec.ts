/// <reference types="jest" />
import { NotFoundException } from '@nestjs/common';
import { MemberSelfServiceService } from './member-self-service.service';
import type { AuthenticatedUser } from '../common';
import type { Member } from '../types';

describe('MemberSelfServiceService.findLinkedMember', () => {
  const member: Member = {
    id: 'mem-1',
    tenantId: 'tenant-a',
    memberNumber: 'MEM-10001',
    firstName: 'Abebe',
    middleName: 'Kebede',
    lastName: 'Bikila',
    fullName: 'Abebe Kebede Bikila',
    nationalId: null,
    idType: null,
    phone: null,
    email: 'abebe.bikila@tenant-a.dev',
    dateOfBirth: null,
    status: 'active',
    joinedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  const memberUser: AuthenticatedUser = {
    staffId: 'staff-1',
    tenantId: 'tenant-a',
    role: 'member',
  };

  function makeService(opts: {
    staffEmail?: string | null;
    linked?: Member | null;
  }): MemberSelfServiceService {
    const staffAccounts = {
      findSummaryById: jest.fn().mockResolvedValue(
        opts.staffEmail === undefined
          ? null
          : { id: 'staff-1', email: opts.staffEmail, fullName: 'Abebe', role: 'member', isActive: true, tenantId: 'tenant-a' },
      ),
    };
    const memberService = {
      findByEmail: jest.fn().mockResolvedValue(opts.linked === undefined ? null : opts.linked),
    };
    return new MemberSelfServiceService(
      memberService as never,
      {} as never,
      {} as never,
      staffAccounts as never,
    );
  }

  it('returns the member whose email matches the staff login', async () => {
    const service = makeService({ staffEmail: 'abebe.bikila@tenant-a.dev', linked: member });
    await expect(service.findLinkedMember(memberUser)).resolves.toEqual(member);
  });

  it('throws 404 when the staff account has no email', async () => {
    const service = makeService({ staffEmail: '   ', linked: member });
    await expect(service.findLinkedMember(memberUser)).rejects.toThrow(NotFoundException);
  });

  it('throws 404 when no member uses the login email', async () => {
    const service = makeService({ staffEmail: 'abebe.bikila@tenant-a.dev', linked: null });
    await expect(service.findLinkedMember(memberUser)).rejects.toThrow(NotFoundException);
  });
});
