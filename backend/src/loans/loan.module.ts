import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SavingsSharesModule } from '../savings-shares';
import { LoanRepaymentEntity } from './entities/loan-repayment.entity';
import { LoanEntity } from './entities/loan.entity';
import { LoanController } from './loan.controller';
import { LoanService } from './loan.service';

/**
 * Task 16 (Abenezer): Loans & Credit.
 *
 * Imports:
 *  - `TypeOrmModule.forFeature` — registers `LoanEntity` and `LoanRepaymentEntity`
 *    so they are reachable via `TenantContextService.repo(...)`. Do NOT use
 *    `@InjectRepository` in `LoanService` — all access goes through
 *    `TenantContextService` to keep RLS enforced.
 *  - `SavingsSharesModule` — re-exports `SavingsSharesService`, which `LoanService`
 *    uses to check eligibility ceilings and (Task 17) to place collateral holds.
 *
 * TODO(Task 13 — Obsan): add `LedgerModule` to `imports` once it is merged to
 * `main` and add `LedgerService` as a constructor parameter in `LoanService`.
 * The ledger posting calls are already marked with `TODO(Task 13)` comments in
 * `loan.service.ts`.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([LoanEntity, LoanRepaymentEntity]),
    SavingsSharesModule,
    // TODO(Task 13): LedgerModule,
  ],
  controllers: [LoanController],
  providers: [LoanService],
  exports: [LoanService],
})
export class LoanModule {}
