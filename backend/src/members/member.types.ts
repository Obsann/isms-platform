import type { CreateMemberDto } from './dto/create-member.dto';
import type { UpdateMemberDto } from './dto/update-member.dto';
import type { MemberSearchQueryDto } from './dto/member-search-query.dto';
import type { Member } from '../types';

export type CreateMemberInput = CreateMemberDto;
export type UpdateMemberInput = UpdateMemberDto;
export type MemberSearchQuery = MemberSearchQueryDto;

export interface MemberSearchResult {
  items: Member[];
  total: number;
}

export interface LegacyRowError {
  row: number;
  field: string;
  message: string;
}

/** Per-row validation, so a bad CSV reports the bad rows instead of failing wholesale. */
export interface LegacyImportPreview {
  stagingId: string;
  totalRows: number;
  validRows: number;
  errors: LegacyRowError[];
  preview: Record<string, string>[];
}

export interface LegacyImportCommitResult {
  stagingId: string;
  committed: number;
  skipped: number;
}
