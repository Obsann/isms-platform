// Public surface of the Tenants module. The entity stays internal — other modules
// reference a tenant by id, which every tenant-scoped row already carries.
export { TenantsModule } from './tenants.module';
export type { TenantStatus } from './tenant.entity';
