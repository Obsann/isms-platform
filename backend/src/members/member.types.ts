import type { Member } from '../types';
import type { CreateMemberDto } from './dto/create-member.dto';
import type { UpdateMemberDto } from './dto/update-member.dto';
import type { MemberSearchQueryDto } from './dto/member-search-query.dto';

export type CreateMemberInput = CreateMemberDto;
export type UpdateMemberInput = UpdateMemberDto;
export type MemberSearchQuery = MemberSearchQueryDto;

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
