// Public surface of the Security & Audit module.
export { SecurityAuditModule } from './security-audit.module';
export { AuditLogService } from './audit-log.service';
export { AuditLogInterceptor } from './audit-log.interceptor';
export { StaffAccountService } from './staff-account.service';
export type {
  AuditLogEntry,
  AuditLogEntryInput,
  AuditLogPage,
  AuditLogQuery,
  StaffAccountSummary,
  StaffCredential,
} from './security-audit.types';
