import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, Matches } from 'class-validator';
import type { AccountType } from '../../types';

export class CreateAccountDto {
  @IsUUID()
  @IsNotEmpty()
  memberId!: string;

  @IsEnum(['savings', 'share'])
  @IsNotEmpty()
  type!: AccountType;

  @IsString()
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'openedAt must be in YYYY-MM-DD format' })
  openedAt?: string;
}
