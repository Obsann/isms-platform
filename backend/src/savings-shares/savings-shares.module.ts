import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountEntity } from './account.entity';
import { SavingsSharesService } from './savings-shares.service';

/**
 * TODO(Task 12 — Jerry): add the transaction entity and controller. `accounts` already
 * exists from schema v1.
 * TODO(Task 13 — Obsan): import `LedgerModule` here and post every movement through
 * the ledger service instead of writing `balance`/`held_amount` in this module.
 */
@Module({
  imports: [TypeOrmModule.forFeature([AccountEntity])],
  providers: [SavingsSharesService],
  exports: [SavingsSharesService],
})
export class SavingsSharesModule {}
