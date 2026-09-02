import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles, type AuthenticatedUser } from '../common';
import type { Member } from '../types';
import { MemberSelfServiceService } from './member-self-service.service';

/**
 * Member portal identity — separate from `GET /members/:id` so Nest never treats
 * `me` as a member id, and so members never need directory search (403).
 */
@Controller('self-service')
export class MemberSelfProfileController {
  constructor(private readonly memberSelfService: MemberSelfServiceService) {}

  /**
   * `GET /self-service/me`
   *
   * Returns the `members` row whose email matches the caller's staff login.
   * 404 when this login has no linked member in the tenant.
   */
  @Get('me')
  @Roles('member')
  getMe(@CurrentUser() user: AuthenticatedUser): Promise<Member> {
    return this.memberSelfService.findLinkedMember(user);
  }
}
