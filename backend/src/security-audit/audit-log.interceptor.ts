import {
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { from, mergeMap, type Observable } from 'rxjs';
import { IS_PUBLIC_KEY, type AuthenticatedUser } from '../common';
import { AuditLogService } from './audit-log.service';
import type { AuditLogEntryInput } from './security-audit.types';

const STATE_CHANGING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Route path segments that name a namespace rather than a resource. `main.ts`
 * sets a global `API_PREFIX` (default `api`), and Task 19's tenant routes sit
 * under `platform/`, so both appear ahead of the real entity in `route.path`.
 */
const NON_ENTITY_SEGMENTS = new Set(['api', 'platform']);

/**
 * Appends an audit row for every successful state-changing request, inside the
 * same transaction `TenantContextGuard` opened. Registered *after*
 * `TenantContextInterceptor` in `AppModule` so this runs as the inner interceptor
 * and the write still commits with the business change.
 *
 * Failures are not logged — a thrown handler rolls the whole transaction back,
 * audit row included. `@Public()` and GET/HEAD are skipped.
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    private readonly auditLog: AuditLogService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    if (isPublic || !STATE_CHANGING.has(request.method) || !request.user) {
      return next.handle();
    }

    return next.handle().pipe(
      mergeMap((data: unknown) =>
        from(this.auditLog.record(toEntry(request, data)).then(() => data)),
      ),
    );
  }
}

function toEntry(
  request: Request & { user?: AuthenticatedUser },
  data: unknown,
): AuditLogEntryInput {
  const params = request.params ?? {};
  const responseId = isRecord(data) && typeof data.id === 'string' ? data.id : undefined;
  const entityId =
    firstString(params.id, params.stagingId, params.pledgeId, params.memberId) ??
    responseId ??
    'n/a';

  const path = (request.route?.path as string | undefined) ?? request.path;
  const entity =
    path
      .split('/')
      .filter((segment) => segment && !segment.startsWith(':'))
      .find((segment) => !NON_ENTITY_SEGMENTS.has(segment)) ?? 'unknown';

  return {
    actorStaffId: request.user!.staffId,
    action: `${request.method} ${path}`,
    entity,
    entityId,
    after: responseId ? { id: responseId } : undefined,
  };
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
