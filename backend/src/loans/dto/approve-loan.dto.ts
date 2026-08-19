import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ApproveLoanDto {
  /** true = approve, false = reject. */
  @IsBoolean()
  approved!: boolean;

  /** Free-text note visible to the applicant — required on rejection, optional on approval. */
  @IsOptional()
  @IsString()
  note?: string;
}
