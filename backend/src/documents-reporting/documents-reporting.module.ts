import { Module } from '@nestjs/common';
import { DocumentsReportingService } from './documents-reporting.service';

/**
 * The Task 19 merge registered a `DocumentsReportingController` whose file only
 * exists on `task20-biruk-reporting`, which left `main` unable to compile. The
 * registration is removed until Task 20 lands the controller with it.
 */
@Module({
  providers: [DocumentsReportingService],
  exports: [DocumentsReportingService],
})
export class DocumentsReportingModule {}
