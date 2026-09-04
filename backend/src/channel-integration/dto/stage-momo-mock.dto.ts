import { IsIn, IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';

export class StageMomoMockDto {
  @IsIn(['c2b', 'b2c'])
  direction!: 'c2b' | 'b2c';

  @IsIn(['telebirr', 'mpesa', 'cbe_birr'])
  provider!: 'telebirr' | 'mpesa' | 'cbe_birr';

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'amount must be a valid positive decimal string e.g. "100.00"',
  })
  amount!: string;

  @IsOptional()
  @IsString()
  @Length(1, 32)
  accountNumber?: string;

  @IsOptional()
  @IsString()
  @Length(1, 64)
  loanId?: string;
}
