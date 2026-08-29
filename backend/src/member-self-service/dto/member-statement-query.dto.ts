import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Query parameters accepted by `GET /members/:id/statement`.
 *
 * All fields are optional. When omitted the service returns the full history
 * (capped at 100 rows by `SavingsSharesService.getTransactionsByMember`).
 */
export class MemberStatementQueryDto {
  /**
   * Start of the date range (inclusive), ISO-8601 date: `YYYY-MM-DD`.
   * Maps to `TransactionHistoryFilter.fromDate`.
   */
  @IsDateString()
  @IsOptional()
  from?: string;

  /**
   * End of the date range (inclusive), ISO-8601 date: `YYYY-MM-DD`.
   * Maps to `TransactionHistoryFilter.toDate`.
   */
  @IsDateString()
  @IsOptional()
  to?: string;

  /** Maximum number of rows to return (1–100). Defaults to the service's own cap. */
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  /** Zero-based row offset for pagination. */
  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  offset?: number;
}
