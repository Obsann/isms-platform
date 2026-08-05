// Public surface of the Auth module. `JwtAuthGuard` is exported only so
// `app.module.ts` can register it as a global `APP_GUARD` — controllers, the
// service, and the strategy stay internal.
export { AuthModule } from './auth.module';
export { JwtAuthGuard } from './guards/jwt-auth.guard';
