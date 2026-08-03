import { SetMetadata, type CustomDecorator } from '@nestjs/common';

export const ROLES_METADATA_KEY = 'isms:roles';

/** TODO(Task 22 — Obsan): replace with the union from the RBAC matrix in `docs/`. */
export type RoleName = string;

/**
 * Declares which roles may reach a route. Attaching this is safe now; the guard
 * that reads `ROLES_METADATA_KEY` and enforces it is built in Task 22, after which
 * each vertical owner applies the decorator to their own endpoints.
 */
export const Roles = (...roles: RoleName[]): CustomDecorator<string> =>
  SetMetadata(ROLES_METADATA_KEY, roles);
