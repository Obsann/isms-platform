/**
 * Shared contract placeholders.
 *
 * TODO(Task 5 — Obsan + Melkamu, live session): replace the aliases below with the
 * agreed field-level interfaces and mirror them in `frontend/src/types`. The module
 * stubs reference these names already, so Task 5 is a single-file change instead of
 * a rename across six verticals.
 */

export type TenantId = string;
export type StaffId = string;
export type MemberId = string;
export type AccountId = string;
export type LoanId = string;
export type TransactionId = string;

/**
 * Money crosses module and process boundaries as a decimal string, never a float:
 * binary floating point can't represent cents exactly, and the ledger rejects a
 * posting whose debits and credits differ by any amount at all.
 */
export type Amount = string;

export type Member = Record<string, unknown>;
export type Account = Record<string, unknown>;
export type Loan = Record<string, unknown>;
export type Transaction = Record<string, unknown>;
export type AuthUser = Record<string, unknown>;
export type ReportingSummary = Record<string, unknown>;
