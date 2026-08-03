import type { Member } from '../types';

/**
 * Public input/output types for the Member Management vertical.
 *
 * TODO(Task 8 — Melkamu): turn the placeholder inputs into validated DTO classes
 * (`dto/create-member.dto.ts`, `dto/update-member.dto.ts`) using class-validator.
 */
export type CreateMemberInput = Record<string, unknown>;
export type UpdateMemberInput = Record<string, unknown>;

export interface MemberSearchQuery {
  search?: string;
  limit?: number;
  offset?: number;
}

export interface MemberSearchResult {
  items: Member[];
  total: number;
}

/** Contract for the isolated Fayda verification service (Task 9). */
export interface VerificationResult {
  verified: boolean;
  nationalId: string;
  /** Shown to the teller when verification fails — never a raw provider error. */
  reason?: string;
}

export interface LegacyRowError {
  row: number;
  column?: string;
  message: string;
}

/** Per-row validation, so a bad CSV reports the bad rows instead of failing wholesale. */
export interface LegacyImportPreview {
  stagingId: string;
  totalRows: number;
  validRows: number;
  errors: LegacyRowError[];
}

export interface LegacyImportCommitResult {
  stagingId: string;
  importedRows: number;
  skippedRows: number;
}
