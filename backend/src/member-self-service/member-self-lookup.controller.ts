import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles, type AuthenticatedUser } from '../common';
import { MemberSelfServiceService } from './member-self-service.service';
import type { Member } from '../types';

/**
 * Member portal lookup — avoids `GET /members?search=` which is staff-only (Task 22).
 */
@Controller('member-self')
export class MemberSelfLookupController {
  constructor(private readonly memberSelfService: MemberSelfServiceService) {}

  @Get('me')
  @Roles('member')
  findLinkedMember(@CurrentUser() user: AuthenticatedUser): Promise<Member> {
    return this.memberSelfService.findLinkedMemberForSession(user);
  }
}
