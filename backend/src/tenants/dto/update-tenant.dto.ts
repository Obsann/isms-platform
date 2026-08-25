import { IsOptional, IsString, Length } from 'class-validator';
import type { TenantStatus } from '../tenant.entity';

export class UpdateTenantDto {
  @IsOptional()
  @IsString()
  @Length(2, 160)
  name?: string;

  @IsOptional()
  status?: TenantStatus;
}
