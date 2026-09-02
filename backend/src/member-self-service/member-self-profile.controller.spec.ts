/// <reference types="jest" />
import { NotFoundException } from '@nestjs/common';
import { MemberSelfProfileController } from './member-self-profile.controller';
import { MemberSelfServiceService } from './member-self-service.service';
import type { AuthenticatedUser } from '../common';
import type { Member } from '../types';

describe('MemberSelfProfileController', () => {
  let controller: MemberSelfProfileController;
  let service: jest.Mocked<Pick<MemberSelfServiceService, 'findLinkedMember'>>;

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

  beforeEach(() => {
    service = {
      findLinkedMember: jest.fn().mockResolvedValue(member),
    };
    controller = new MemberSelfProfileController(service as unknown as MemberSelfServiceService);
  });

  it('returns the linked member for the caller', async () => {
    await expect(controller.getMe(memberUser)).resolves.toBe(member);
    expect(service.findLinkedMember).toHaveBeenCalledWith(memberUser);
  });

  it('propagates 404 when no member shares the login email', async () => {
    service.findLinkedMember.mockRejectedValue(new NotFoundException('No member record for this login'));
    await expect(controller.getMe(memberUser)).rejects.toThrow(NotFoundException);
  });
});
