import { Controller, Get, Query } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { AuditLogService } from './audit-log.service';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';
import type { AuditLogPage } from './security-audit.types';

@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly auditLog: AuditLogService) {}

  @Get()
  @Roles('tenant-admin', 'super-admin')
  query(@Query() query: AuditLogQueryDto): Promise<AuditLogPage> {
    return this.auditLog.query(query);
  }
}
