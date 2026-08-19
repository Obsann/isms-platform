import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LedgerEntryEntity } from './ledger-entry.entity';
import { LedgerService } from './ledger.service';

@Module({
  imports: [TypeOrmModule.forFeature([LedgerEntryEntity])],
  providers: [LedgerService],
  exports: [LedgerService],
})
export class LedgerModule {}
