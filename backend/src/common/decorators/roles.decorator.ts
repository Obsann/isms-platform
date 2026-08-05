import { SetMetadata, type CustomDecorator } from '@nestjs/common';
import type { RoleName } from '../../types';

export const ROLES_METADATA_KEY = 'isms:roles';

// Was `string` until Task 5 defined the union. Task 22 extends it as the RBAC matrix
// is written. Re-exported for existing importers.
export type { RoleName };

/**
 * Declares which roles may reach a route. Attaching this is safe now; the guard
 * that reads `ROLES_METADATA_KEY` and enforces it is built in Task 22, after which
 * each vertical owner applies the decorator to their own endpoints.
 */
export const Roles = (...roles: RoleName[]): CustomDecorator<string> =>
  SetMetadata(ROLES_METADATA_KEY, roles);
