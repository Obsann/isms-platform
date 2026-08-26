import { IsNotEmpty, IsString, Length, Matches, IsOptional } from 'class-validator';
import type { TenantStatus } from '../tenant.entity';

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 160)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 64)
  @Matches(/^[a-z0-9-_]+$/i, { message: 'code must be URL-friendly' })
  code!: string;

  @IsOptional()
  status?: TenantStatus;
}
