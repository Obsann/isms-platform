import { Module } from '@nestjs/common';
import { LoanService } from './loan.service';

/**
 * TODO(Task 16 — Abenezer): add the loan entities, controller, and imports of
 * `SavingsSharesModule` and `LedgerModule`. Don't branch this task until Obsan's
 * Task 13 ledger is merged into `main`.
 */
@Module({
  providers: [LoanService],
  exports: [LoanService],
})
export class LoanModule {}
