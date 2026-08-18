import { IsInt, IsNumberString, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class ApplyLoanDto {
  @IsUUID()
  memberId!: string;

  /**
   * Amount as a decimal string — never a float. The ledger rejects a posting whose
   * debits and credits differ by any amount, so precision matters end-to-end.
   * Example: "5000.00"
   */
  @IsNumberString()
  requestedAmount!: string;

  /** Loan term in whole months. 1–360 (30 years). */
  @IsInt()
  @Min(1)
  @Max(360)
  termMonths!: number;

  @IsOptional()
  @IsString()
  purpose?: string;
}
