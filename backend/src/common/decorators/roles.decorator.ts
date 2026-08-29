import { SetMetadata, type CustomDecorator } from '@nestjs/common';
import type { RoleName } from '../../types';

export const ROLES_METADATA_KEY = 'isms:roles';

export type { RoleName };

/**
 * Declares which roles may reach a route. `RolesGuard` (Task 22) reads this and
 * rejects any other JWT role with 403 before the handler runs. Authenticated
 * routes without `@Roles(...)` are also denied (fail closed). See
 * `docs/rbac-matrix.md`.
 */
export const Roles = (...roles: RoleName[]): CustomDecorator<string> =>
  SetMetadata(ROLES_METADATA_KEY, roles);
