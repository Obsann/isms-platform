import { IsIn, IsOptional, IsString, Matches } from 'class-validator';
import { OTP_PURPOSES, type OtpPurpose } from '../../security-audit';

export class RequestOtpDto {
  @IsString()
  @IsIn(OTP_PURPOSES)
  purpose!: OtpPurpose;

  @IsString()
  @IsOptional()
  @Matches(/^\d+(\.\d{1,2})?$/, { message: 'amount must be a decimal string' })
  amount?: string;

  @IsString()
  @IsOptional()
  accountId?: string;

  @IsString()
  @IsOptional()
  loanId?: string;
}
