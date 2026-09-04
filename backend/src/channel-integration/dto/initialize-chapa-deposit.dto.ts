import { IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';

export class InitializeChapaDepositDto {
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
  @IsOptional()
  @Length(1, 20)
  phone?: string;
}
