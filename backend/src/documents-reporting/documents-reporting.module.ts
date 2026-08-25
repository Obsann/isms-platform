import { Module } from '@nestjs/common';
import { DocumentsReportingService } from './documents-reporting.service';
import { DocumentsReportingController } from './documents-reporting.controller';

@Module({
  controllers: [DocumentsReportingController],
  providers: [DocumentsReportingService],
  exports: [DocumentsReportingService],
})
export class DocumentsReportingModule {}
