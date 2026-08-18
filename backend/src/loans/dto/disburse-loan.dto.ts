import { IsNumberString, IsUUID } from 'class-validator';

export class DisburseLoanDto {
  /** The savings account the disbursement is credited to. */
  @IsUUID()
  destinationAccountId!: string;

  /**
   * Amount as a decimal string — must be <= `approvedAmount`.
   * Service enforces this; validation here only catches malformed input.
   */
  @IsNumberString()
  amount!: string;
}
