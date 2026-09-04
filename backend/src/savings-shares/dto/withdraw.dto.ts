import { IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';

export class WithdrawDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'amount must be a valid positive decimal string e.g. "100.00"',
  })
  amount!: string;

  @IsString()
  @IsOptional()
  @Length(1, 128)
  reference?: string;

  @IsString()
  @IsOptional()
  @Length(1, 255)
  narration?: string;

  @IsString()
  @IsOptional()
  @Matches(/^\d{6}$/, { message: 'otp must be a 6-digit code' })
  otp?: string;
}
