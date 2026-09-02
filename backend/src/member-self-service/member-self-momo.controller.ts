import { Body, Controller, Get, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles, type AuthenticatedUser } from '../common';
import { MobileMoneyMockService } from '../channel-integration/mobile-money-mock.service';
import { StageMomoMockDto } from '../channel-integration/dto/stage-momo-mock.dto';
import type { StagedMomoRequestView } from '../channel-integration/mobile-money-mock.types';
import { MemberSelfServiceService } from './member-self-service.service';

/**
 * Member portal mobile-money mock — persisted in DB, always PENDING (Task 24 / D1).
 */
@Controller('member-self/momo')
export class MemberSelfMomoController {
  constructor(
    private readonly memberSelfService: MemberSelfServiceService,
    private readonly mobileMoneyMock: MobileMoneyMockService,
  ) {}

  @Get('pending')
  @Roles('member')
  async listPending(@CurrentUser() user: AuthenticatedUser): Promise<StagedMomoRequestView[]> {
    const member = await this.memberSelfService.findLinkedMemberForSession(user);
    return this.mobileMoneyMock.listPendingForMember(member.id);
  }

  @Post('stage')
  @Roles('member')
  async stage(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: StageMomoMockDto,
  ): Promise<StagedMomoRequestView> {
    const member = await this.memberSelfService.findLinkedMemberForSession(user);
    const staged = await this.mobileMoneyMock.stageForMember(member, dto);
    return staged;
  }
}
