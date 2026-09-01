/// <reference types="jest" />
import { ForbiddenException, UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Public } from '../decorators/public.decorator';
import { Roles } from '../decorators/roles.decorator';
import type { AuthenticatedUser } from '../types/authenticated-user';
import type { RoleName } from '../../types';
import { RolesGuard } from './roles.guard';

/**
 * Capability probes matching `docs/rbac-matrix.md`. The guard never invokes these
 * methods — if it throws, business logic did not run.
 */
class ProbeController {
  @Roles('teller', 'tenant-admin')
  registerMember() {
    throw new Error('handler must not run');
  }

  @Roles('teller', 'tenant-admin')
  postDeposit() {
    throw new Error('handler must not run');
  }

  @Roles('teller', 'loan-officer', 'tenant-admin')
  submitLoan() {
    throw new Error('handler must not run');
  }

  @Roles('loan-officer', 'tenant-admin')
  approveLoan() {
    throw new Error('handler must not run');
  }

  @Roles('tenant-admin', 'super-admin')
  viewAuditLog() {
    throw new Error('handler must not run');
  }

  @Public()
  health() {
    return { ok: true };
  }

  undecorated() {
    throw new Error('handler must not run');
  }
}

const ALL_ROLES: RoleName[] = ['super-admin', 'tenant-admin', 'teller', 'loan-officer', 'member'];

function actor(role: RoleName): AuthenticatedUser {
  return { staffId: 'staff-1', tenantId: 'tenant-1', role };
}

function context(handler: (...args: never[]) => unknown, user?: AuthenticatedUser): ExecutionContext {
  return {
    getHandler: () => handler,
    getClass: () => ProbeController,
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector());

  const matrix: Array<{
    capability: string;
    handler: () => unknown;
    allowed: RoleName[];
  }> = [
    {
      capability: 'Register / update member',
      handler: ProbeController.prototype.registerMember,
      allowed: ['teller', 'tenant-admin'],
    },
    {
      capability: 'Post deposit / withdrawal',
      handler: ProbeController.prototype.postDeposit,
      allowed: ['teller', 'tenant-admin'],
    },
    {
      capability: 'Submit loan application',
      handler: ProbeController.prototype.submitLoan,
      allowed: ['teller', 'loan-officer', 'tenant-admin'],
    },
    {
      capability: 'Approve loan',
      handler: ProbeController.prototype.approveLoan,
      allowed: ['loan-officer', 'tenant-admin'],
    },
    {
      capability: 'View audit log',
      handler: ProbeController.prototype.viewAuditLog,
      allowed: ['tenant-admin', 'super-admin'],
    },
  ];

  it.each(matrix)('$capability: listed roles pass, others are rejected', ({ handler, allowed }) => {
    for (const role of allowed) {
      expect(guard.canActivate(context(handler, actor(role)))).toBe(true);
    }
    for (const role of ALL_ROLES.filter((name) => !allowed.includes(name))) {
      expect(() => guard.canActivate(context(handler, actor(role)))).toThrow(ForbiddenException);
    }
  });

  it('rejects an unauthorized role with 403 before the handler body can run', () => {
    expect(() =>
      guard.canActivate(context(ProbeController.prototype.approveLoan, actor('teller'))),
    ).toThrow(ForbiddenException);
    expect(() => ProbeController.prototype.approveLoan()).toThrow('handler must not run');
  });

  it('skips @Public() routes regardless of role', () => {
    expect(guard.canActivate(context(ProbeController.prototype.health))).toBe(true);
  });

  it('rejects authenticated routes that forgot @Roles (fail closed)', () => {
    expect(() =>
      guard.canActivate(context(ProbeController.prototype.undecorated, actor('teller'))),
    ).toThrow(ForbiddenException);
  });

  it('rejects a missing user as unauthorized, not as a role failure', () => {
    expect(() =>
      guard.canActivate(context(ProbeController.prototype.postDeposit)),
    ).toThrow(UnauthorizedException);
  });
});
