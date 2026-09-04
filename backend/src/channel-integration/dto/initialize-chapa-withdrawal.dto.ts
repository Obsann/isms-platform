import { IsIn, IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';

export class InitializeChapaWithdrawalDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'amount must be a valid positive decimal string e.g. "100.00"',
  })
  amount!: string;

  @IsString()
  @IsOptional()
  @Length(1, 64)
  accountId?: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 20)
  phone!: string;

  @IsString()
  @IsIn(['telebirr', 'mpesa'])
  channel!: 'telebirr' | 'mpesa';

  @IsString()
  @IsOptional()
  @Matches(/^\d{6}$/, { message: 'otp must be a 6-digit code' })
  otp?: string;
}
