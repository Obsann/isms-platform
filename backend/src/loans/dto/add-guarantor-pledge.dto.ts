import { IsNumberString, IsUUID } from 'class-validator';

export class AddGuarantorPledgeDto {
  @IsUUID()
  guarantorMemberId!: string;

  @IsUUID()
  guarantorAccountId!: string;

  /** Pledged amount as a positive decimal string (e.g., "5000.00"). */
  @IsNumberString()
  pledgedAmount!: string;
}
