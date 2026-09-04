import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChannelIntegrationModule } from '../channel-integration';
import { SecurityAuditModule } from '../security-audit';
import { TenantsModule } from '../tenants';
import { MemberEntity } from './member.entity';
import { MemberService } from './member.service';
import { MemberController } from './member.controller';

/**
 * Member Management module configuration.
 * Exposes MemberController and registers the MemberEntity with TypeORM.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([MemberEntity]),
    TenantsModule,
    SecurityAuditModule,
    forwardRef(() => ChannelIntegrationModule),
  ],
  controllers: [MemberController],
  providers: [MemberService],
  exports: [MemberService],
})
export class MemberModule {}
