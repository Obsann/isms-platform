import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  Length,
  Matches,
  Validate,
  ValidateIf,
} from 'class-validator';
import { IdType, MemberStatus } from '../../types';
import {
  EMAIL_MESSAGE,
  MEMBER_EMAIL_PATTERN,
  MEMBER_NUMBER_MESSAGE,
  MEMBER_NUMBER_PATTERN,
  NAME_MESSAGE,
  NAME_PATTERN,
  PHONE_MESSAGE,
  PHONE_PATTERN,
  IsPastDobConstraint,
  MemberIdentityConstraint,
} from '../member-field.rules';

const emptyToUndefined = ({ value }: { value: unknown }) =>
  value === '' || value === null ? undefined : value;

export class UpdateMemberDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && value.trim() !== '' ? value.trim().toUpperCase() : undefined,
  )
  @IsOptional()
  @Matches(MEMBER_NUMBER_PATTERN, { message: MEMBER_NUMBER_MESSAGE })
  memberNumber?: string;

  @Transform(emptyToUndefined)
  @IsString()
  @IsOptional()
  @Matches(NAME_PATTERN, { message: NAME_MESSAGE })
  @Length(1, 80)
  firstName?: string;

  @Transform(emptyToUndefined)
  @IsString()
  @IsOptional()
  @Matches(NAME_PATTERN, { message: NAME_MESSAGE })
  @Length(1, 80)
  middleName?: string;

  @Transform(emptyToUndefined)
  @IsString()
  @IsOptional()
  @Matches(NAME_PATTERN, { message: NAME_MESSAGE })
  @Length(1, 80)
  lastName?: string;

  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  @Length(1, 32)
  @Validate(MemberIdentityConstraint)
  nationalId?: string;

  @Transform(emptyToUndefined)
  @ValidateIf((o: UpdateMemberDto) => o.nationalId != null)
  @IsEnum(['national_id', 'passport', 'other'])
  @IsOptional()
  idType?: IdType;

  @Transform(emptyToUndefined)
  @IsString()
  @IsOptional()
  @Matches(PHONE_PATTERN, { message: PHONE_MESSAGE })
  phone?: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && value.trim() !== '' ? value.trim().toLowerCase() : undefined,
  )
  @IsOptional()
  @Matches(MEMBER_EMAIL_PATTERN, { message: EMAIL_MESSAGE })
  @Length(1, 180)
  email?: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined,
  )
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'dateOfBirth must be in YYYY-MM-DD format' })
  @Validate(IsPastDobConstraint)
  dateOfBirth?: string;

  @IsEnum(['pending', 'active', 'inactive'])
  @IsOptional()
  status?: MemberStatus;

  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'joinedAt must be in YYYY-MM-DD format' })
  joinedAt?: string;
}
