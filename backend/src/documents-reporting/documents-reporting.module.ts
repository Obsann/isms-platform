import { Module } from '@nestjs/common';
import { LedgerModule } from '../ledger';
import { LoanModule } from '../loans';
import { MemberModule } from '../members';
import { SavingsSharesModule } from '../savings-shares';
import { DocumentsReportingController } from './documents-reporting.controller';
import { DocumentsReportingService } from './documents-reporting.service';

/**
 * Document & Reporting engine (Task 20). Reads members, savings, loans, and the
 * ledger through each vertical's exported service — never another module's internals.
 */
@Module({
  imports: [MemberModule, SavingsSharesModule, LoanModule, LedgerModule],
  controllers: [DocumentsReportingController],
  providers: [DocumentsReportingService],
  exports: [DocumentsReportingService],
})
export class DocumentsReportingModule {}
