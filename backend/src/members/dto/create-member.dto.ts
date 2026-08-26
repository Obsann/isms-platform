import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Length, Matches, ValidateIf } from 'class-validator';
import { IdType, MemberStatus } from '../../types';

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

  /** Required when `nationalId` is provided. */
  @ValidateIf((o: CreateMemberDto) => o.nationalId != null && o.nationalId !== '')
  @IsEnum(['national_id', 'passport', 'other'])
  idType?: IdType;

  @IsString()
  @IsOptional()
  @Length(1, 20)
  phone?: string;

  @IsEmail()
  @IsOptional()
  @Length(1, 180)
  email?: string;

  @ValidateIf((o: CreateMemberDto) => o.dateOfBirth != null && o.dateOfBirth !== '')
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'dateOfBirth must be in YYYY-MM-DD format' })
  dateOfBirth?: string;

  @IsEnum(['pending', 'active', 'inactive'])
  @IsOptional()
  status?: MemberStatus;

  @ValidateIf((o: CreateMemberDto) => o.joinedAt != null && o.joinedAt !== '')
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'joinedAt must be in YYYY-MM-DD format' })
  joinedAt?: string;
}
