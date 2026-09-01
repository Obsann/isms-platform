import { Body, Controller, Delete, Get, HttpCode, NotFoundException, Param, Patch, Post, Query } from '@nestjs/common';
import { Roles } from '../common';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import type { TenantStatus } from './tenant.entity';

/**
 * Platform-level tenant management. These routes run outside per-tenant RLS and
 * must be treated as platform actions by the UI.
 *
 * Guarded by `@Roles('super-admin')` — only super-admin JWTs may reach these
 * endpoints. `JwtAuthGuard` + `RolesGuard` are registered globally in AppModule.
 */
@Controller('platform/tenants')
@Roles('super-admin')
export class TenantsController {
  constructor(private readonly tenants: TenantsService) {}

  @Get()
  @Roles('super-admin')
  async list(@Query('status') status?: TenantStatus) {
    return this.tenants.list(status);
  }

  @Post()
  @Roles('super-admin')
  async create(@Body() body: CreateTenantDto) {
    return this.tenants.create(body as any);
  }

  @Get(':id')
  @Roles('super-admin')
  async get(@Param('id') id: string) {
    const t = await this.tenants.get(id);
    if (!t) throw new NotFoundException();
    return t;
  }

  @Patch(':id')
  @Roles('super-admin')
  async update(@Param('id') id: string, @Body() body: UpdateTenantDto) {
    const t = await this.tenants.update(id, body as any);
    if (!t) throw new NotFoundException();
    return t;
  }

  @Delete(':id')
  @Roles('super-admin')
  @HttpCode(204)
  async remove(@Param('id') id: string) {
    await this.tenants.remove(id);
  }
}
