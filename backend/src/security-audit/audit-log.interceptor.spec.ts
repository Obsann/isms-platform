/// <reference types="jest" />
import { type CallHandler, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { lastValueFrom, of, throwError } from 'rxjs';
import { Public, Roles, type AuthenticatedUser } from '../common';
import { AuditLogInterceptor } from './audit-log.interceptor';

class ProbeController {
  @Roles('teller', 'tenant-admin')
  createMember() {
    return { id: 'member-1' };
  }

  @Public()
  login() {
    return { accessToken: 'x' };
  }
}

function httpContext(
  handler: (...args: never[]) => unknown,
  request: {
    method: string;
    path?: string;
    route?: { path: string };
    params?: Record<string, string>;
    user?: AuthenticatedUser;
  },
): ExecutionContext {
  return {
    getHandler: () => handler,
    getClass: () => ProbeController,
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

const teller: AuthenticatedUser = {
  staffId: 'staff-1',
  tenantId: 'tenant-1',
  role: 'teller',
};

describe('AuditLogInterceptor', () => {
  const record = jest.fn().mockResolvedValue(undefined);
  const interceptor = new AuditLogInterceptor({ record } as never, new Reflector());

  beforeEach(() => {
    record.mockClear();
  });

  it('records a successful state-changing request with actor and action', async () => {
    const context = httpContext(ProbeController.prototype.createMember, {
      method: 'POST',
      path: '/members',
      route: { path: '/members' },
      params: {},
      user: teller,
    });
    const next: CallHandler = { handle: () => of({ id: 'member-1' }) };

    await lastValueFrom(interceptor.intercept(context, next));

    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({
        actorStaffId: 'staff-1',
        action: 'POST /members',
        entity: 'members',
        entityId: 'member-1',
      }),
    );
  });

  it('does not record a GET', async () => {
    const context = httpContext(ProbeController.prototype.createMember, {
      method: 'GET',
      path: '/members/member-1',
      route: { path: '/members/:id' },
      params: { id: 'member-1' },
      user: teller,
    });

    await lastValueFrom(interceptor.intercept(context, { handle: () => of({ id: 'member-1' }) }));

    expect(record).not.toHaveBeenCalled();
  });

  it('does not record a @Public() POST such as login', async () => {
    const context = httpContext(ProbeController.prototype.login, {
      method: 'POST',
      path: '/auth/login',
      route: { path: '/auth/login' },
      params: {},
    });

    await lastValueFrom(interceptor.intercept(context, { handle: () => of({ accessToken: 'x' }) }));

    expect(record).not.toHaveBeenCalled();
  });

  it('does not record when the handler throws — the write never committed', async () => {
    const context = httpContext(ProbeController.prototype.createMember, {
      method: 'POST',
      path: '/members',
      route: { path: '/members' },
      params: {},
      user: teller,
    });

    await expect(
      lastValueFrom(
        interceptor.intercept(context, { handle: () => throwError(() => new Error('rejected')) }),
      ),
    ).rejects.toThrow('rejected');

    expect(record).not.toHaveBeenCalled();
  });
});
