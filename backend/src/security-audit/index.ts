// Public surface of the Security & Audit module.
export { SecurityAuditModule } from './security-audit.module';
export { AuditLogService } from './audit-log.service';
export { AuditLogInterceptor } from './audit-log.interceptor';
export { StaffAccountService } from './staff-account.service';
export { OtpService } from './otp.service';
export { OtpChallengeEntity } from './otp-challenge.entity';
export type { IssueOtpResult, OtpPurpose } from './otp.types';
export {
  HIGH_VALUE_OTP_THRESHOLD_DEFAULT,
  OTP_PURPOSE_LABEL,
  OTP_PURPOSES,
} from './otp.types';
export type {
  AuditLogEntry,
  AuditLogEntryInput,
  AuditLogPage,
  AuditLogQuery,
  StaffAccountSummary,
  StaffCredential,
} from './security-audit.types';
