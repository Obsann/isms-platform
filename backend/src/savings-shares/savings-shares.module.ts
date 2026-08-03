import { Module } from '@nestjs/common';
import { SavingsSharesService } from './savings-shares.service';

/**
 * TODO(Task 12 — Jerry): add the account/transaction entities and controller.
 * TODO(Task 13 — Obsan): import `LedgerModule` here and post every movement through
 * the ledger service instead of writing balances in this module.
 */
@Module({
  providers: [SavingsSharesService],
  exports: [SavingsSharesService],
})
export class SavingsSharesModule {}
