import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChannelIntegrationModule } from '../channel-integration/channel-integration.module';
import { LedgerModule } from '../ledger';
import { MemberModule } from '../members';
import { AccountEntity } from './account.entity';
import { FundsHoldEntity } from './funds-hold.entity';
import { SavingsSharesController } from './savings-shares.controller';
import { SavingsSharesService } from './savings-shares.service';
import { SavingsTransactionEntity } from './savings-transaction.entity';

/**
 * Savings & Shares vertical module (Task 12 — Jerry).
 *
 * Movements go through `LedgerModule` — this module never writes `balance` or
 * `held_amount` itself.
 */
@Module({
  imports: [
    ConfigModule,
    MemberModule,
    LedgerModule,
    forwardRef(() => ChannelIntegrationModule),
    TypeOrmModule.forFeature([AccountEntity, SavingsTransactionEntity, FundsHoldEntity]),
  ],
  controllers: [SavingsSharesController],
  providers: [SavingsSharesService],
  exports: [SavingsSharesService],
})
export class SavingsSharesModule {}

