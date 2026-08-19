import { IsNumberString, IsOptional, IsString } from 'class-validator';

export class RepayLoanDto {
  /** Amount as a decimal string. */
  @IsNumberString()
  amount!: string;

  /** Teller-supplied reference — also the idempotency key for offline sync (Task 15). */
  @IsOptional()
  @IsString()
  reference?: string;
}
