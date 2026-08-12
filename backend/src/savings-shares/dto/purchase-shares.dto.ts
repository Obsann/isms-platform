import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Length, Matches, Min } from 'class-validator';

export class PurchaseSharesDto {
  @IsUUID()
  @IsNotEmpty()
  memberId!: string;

  @IsInt()
  @Min(1)
  shareCount!: number;

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
}
