import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LedgerModule } from '../ledger';
import { SavingsSharesModule } from '../savings-shares';
import { LoanGuarantorEntity } from './entities/loan-guarantor.entity';
import { LoanRepaymentEntity } from './entities/loan-repayment.entity';
import { LoanEntity } from './entities/loan.entity';
import { LoanController } from './loan.controller';
import { LoanService } from './loan.service';

/**
 * Task 16 & 17 (Abenezer): Loans & Credit with Guarantor & Collateral logic.
 *
 * Imports:
 *  - `TypeOrmModule.forFeature` — registers `LoanEntity`, `LoanRepaymentEntity`, and `LoanGuarantorEntity`
 *    so they are reachable via `TenantContextService.repo(...)`.
 *  - `SavingsSharesModule` — re-exports `SavingsSharesService` for savings ceiling checks.
 *  - `LedgerModule` — re-exports `LedgerService` for hold management (`holdFunds` / `releaseHold`).
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([LoanEntity, LoanRepaymentEntity, LoanGuarantorEntity]),
    SavingsSharesModule,
    LedgerModule,
  ],
  controllers: [LoanController],
  providers: [LoanService],
  exports: [LoanService],
})
export class LoanModule {}

