import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountEntity } from './account.entity';
import { FundsHoldEntity } from './funds-hold.entity';
import { SavingsSharesController } from './savings-shares.controller';
import { SavingsSharesService } from './savings-shares.service';
import { SavingsTransactionEntity } from './savings-transaction.entity';

/**
 * Savings & Shares vertical module (Task 12 — Jerry).
 *
 * TODO(Task 13 — Obsan): import `LedgerModule` here and post every movement through
 * the ledger service instead of writing `balance`/`held_amount` in this module.
 */
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([AccountEntity, SavingsTransactionEntity, FundsHoldEntity]),
  ],
  controllers: [SavingsSharesController],
  providers: [SavingsSharesService],
  exports: [SavingsSharesService],
})
export class SavingsSharesModule {}
