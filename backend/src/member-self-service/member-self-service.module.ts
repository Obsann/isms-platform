import { Module } from '@nestjs/common';
import { LoanModule } from '../loans';
import { MemberModule } from '../members';
import { SavingsSharesModule } from '../savings-shares';
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
    MemberModule,
    SavingsSharesModule,
    LoanModule,
  ],
  controllers: [MemberSelfServiceController],
  providers: [MemberSelfServiceService],
})
export class MemberSelfServiceModule {}
