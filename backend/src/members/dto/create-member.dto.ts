import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
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

export class CreateMemberDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @IsNotEmpty()
  @Matches(MEMBER_NUMBER_PATTERN, { message: MEMBER_NUMBER_MESSAGE })
  memberNumber!: string;

  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @Matches(NAME_PATTERN, { message: NAME_MESSAGE })
  @Length(1, 80)
  firstName!: string;

  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'Middle name is required' })
  @Matches(NAME_PATTERN, { message: NAME_MESSAGE })
  @Length(1, 80)
  middleName!: string;

  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @Matches(NAME_PATTERN, { message: NAME_MESSAGE })
  @Length(1, 80)
  lastName!: string;

  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'ID number is required' })
  @Length(1, 32)
  @Validate(MemberIdentityConstraint)
  nationalId!: string;

  @IsEnum(['national_id', 'passport', 'other'])
  @IsNotEmpty({ message: 'ID type is required' })
  idType!: IdType;

  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  @Matches(PHONE_PATTERN, { message: PHONE_MESSAGE })
  phone!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsNotEmpty({ message: 'Email is required' })
  @Matches(MEMBER_EMAIL_PATTERN, { message: EMAIL_MESSAGE })
  @Length(1, 180)
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'Date of birth is required' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'dateOfBirth must be in YYYY-MM-DD format' })
  @Validate(IsPastDobConstraint)
  dateOfBirth!: string;

  @IsEnum(['pending', 'active', 'inactive'])
  @IsOptional()
  status?: MemberStatus;

  @Transform(emptyToUndefined)
  @ValidateIf((o: CreateMemberDto) => o.joinedAt != null)
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'joinedAt must be in YYYY-MM-DD format' })
  joinedAt?: string;
}
