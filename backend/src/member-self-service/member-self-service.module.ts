import { Module } from '@nestjs/common';
import { ChannelIntegrationModule } from '../channel-integration';
import { LoanModule } from '../loans';
import { MemberModule } from '../members';
import { SavingsSharesModule } from '../savings-shares';
import { SecurityAuditModule } from '../security-audit';
import { MemberSelfLookupController } from './member-self-lookup.controller';
import { MemberSelfMomoController } from './member-self-momo.controller';
import { MemberSelfServiceController } from './member-self-service.controller';
import { MemberSelfServiceService } from './member-self-service.service';

/**
 * Member Self-Service module — owner: **Liya** (Task 23).
 *
 * Aggregates member-facing read views from `MemberModule`, `SavingsSharesModule`,
 * and `LoanModule`.
 */
@Module({
  imports: [
    ChannelIntegrationModule,
    MemberModule,
    SavingsSharesModule,
    LoanModule,
    SecurityAuditModule,
  ],
  controllers: [MemberSelfLookupController, MemberSelfMomoController, MemberSelfServiceController],
  providers: [MemberSelfServiceService],
})
export class MemberSelfServiceModule {}
