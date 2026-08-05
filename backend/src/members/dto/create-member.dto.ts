import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';
import { MemberStatus } from '../../types';

export class CreateMemberDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 32)
  memberNumber!: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 80)
  firstName!: string;

  @IsString()
  @IsOptional()
  @Length(1, 80)
  middleName?: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 80)
  lastName!: string;

  @IsString()
  @IsOptional()
  @Length(1, 32)
  nationalId?: string;

  @IsString()
  @IsOptional()
  @Length(1, 20)
  phone?: string;

  @IsEmail()
  @IsOptional()
  @Length(1, 180)
  email?: string;

  @IsString()
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'dateOfBirth must be in YYYY-MM-DD format' })
  dateOfBirth?: string;

  @IsEnum(['pending', 'active', 'inactive'])
  @IsOptional()
  status?: MemberStatus;

  @IsString()
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'joinedAt must be in YYYY-MM-DD format' })
  joinedAt?: string;
}
