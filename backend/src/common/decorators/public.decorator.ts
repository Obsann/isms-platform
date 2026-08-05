import { SetMetadata, type CustomDecorator } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isms:public';

/**
 * Exempts a route from both `JwtAuthGuard` and `TenantContextGuard`. Used only for
 * `GET /api/health` and `POST /api/auth/login` — every other route requires a valid
 * JWT and a resolved tenant context.
 */
export const Public = (): CustomDecorator<string> => SetMetadata(IS_PUBLIC_KEY, true);
