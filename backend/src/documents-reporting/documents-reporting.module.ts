import { Module } from '@nestjs/common';
import { DocumentsReportingService } from './documents-reporting.service';

/**
 * Documents & Reporting vertical — owner: Biruk (Tasks 20–21).
 */
@Module({
  providers: [DocumentsReportingService],
  exports: [DocumentsReportingService],
})
export class DocumentsReportingModule {}
