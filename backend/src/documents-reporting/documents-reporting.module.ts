import { Module } from '@nestjs/common';
import { DocumentsReportingService } from './documents-reporting.service';

/**
 * TODO(Task 19–21 — Biruk): add the reporting controller and tenant provisioning.
 * The Super Admin console operates outside per-tenant RLS scoping, so those routes
 * are explicitly platform-level and must be flagged as such in the UI.
 */
@Module({
  providers: [DocumentsReportingService],
  exports: [DocumentsReportingService],
})
export class DocumentsReportingModule {}
