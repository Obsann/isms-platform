import {
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import { catchError, finalize, from, mergeMap, type Observable } from 'rxjs';
import { TenantContextService } from './tenant-context.service';

/**
 * Closes out the transaction `TenantContextGuard` opened: commits on a successful
 * response, rolls back on any thrown error, and always releases the connection back
 * to the pool. Guards run before the handler and can't wrap what happens after it —
 * that's the whole reason this is a separate interceptor rather than logic inside
 * the guard itself.
 *
 * Runs as a no-op for public routes (`@Public()`), which never open a tenant
 * context in the first place.
 */
@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  constructor(private readonly tenantContext: TenantContextService) {}

  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const store = this.tenantContext.peekStore();
    if (!store) {
      return next.handle();
    }

    return next.handle().pipe(
      mergeMap((data: unknown) =>
        from(
          (async (): Promise<unknown> => {
            await store.queryRunner.commitTransaction();
            return data;
          })(),
        ),
      ),
      catchError((error: unknown) =>
        from(
          (async (): Promise<never> => {
            if (store.queryRunner.isTransactionActive) {
              await store.queryRunner.rollbackTransaction();
            }
            throw error;
          })(),
        ),
      ),
      finalize(() => {
        void store.queryRunner.release();
      }),
    );
  }
}
