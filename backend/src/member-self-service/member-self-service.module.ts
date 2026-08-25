import { Module } from '@nestjs/common';
import { MemberModule } from '../members';
import { SavingsSharesModule } from '../savings-shares';
import { MemberSelfServiceController } from './member-self-service.controller';
import { MemberSelfServiceService } from './member-self-service.service';

/**
 * Member Self-Service module — owner: **Liya** (Task 23).
 *
 * Aggregates member-facing read views from `MemberModule` and `SavingsSharesModule`.
 * Both upstream modules already export their services, so no entity registration is
 * needed here — this module does not own any database tables.
 *
 * Loan dependency: `LoanModule` is deliberately NOT imported yet because
 * `LoanService.findByMemberId()` has not been implemented (Task 18, Abenezer).
 * When that method lands, add `LoanModule` to the `imports` array and wire the
 * service injection in `MemberSelfServiceService`.
 */
@Module({
  imports: [
    MemberModule,
    SavingsSharesModule,
  ],
  controllers: [MemberSelfServiceController],
  providers: [MemberSelfServiceService],
})
export class MemberSelfServiceModule {}
