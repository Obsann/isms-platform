import { Injectable, NotImplementedException } from '@nestjs/common';
import type { Member, MemberId } from '../types';
import type {
  CreateMemberInput,
  LegacyImportCommitResult,
  LegacyImportPreview,
  MemberSearchQuery,
  MemberSearchResult,
  UpdateMemberInput,
} from './member.types';

/**
 * Member Management vertical — owner: **Melkamu** (Tasks 8–11).
 *
 * The only entry point other modules may use. Tenant scoping is applied by the
 * tenant-context guard (Task 3), so no method here takes or filters on a tenant id.
 *
 * TODO(Task 9 — Melkamu): add the isolated `fayda-verification` service inside this
 * module and call it from `create`, rejecting registration when verification fails.
 */
@Injectable()
export class MemberService {
  /** `POST /api/members` */
  create(input: CreateMemberInput): Promise<Member> {
    throw new NotImplementedException('MemberService.create is not implemented (Task 8)');
  }

  /** `GET /api/members/{id}` */
  findById(memberId: MemberId): Promise<Member> {
    throw new NotImplementedException('MemberService.findById is not implemented (Task 8)');
  }

  /** `GET /api/members?search=` */
  search(query: MemberSearchQuery): Promise<MemberSearchResult> {
    throw new NotImplementedException('MemberService.search is not implemented (Task 8)');
  }

  /** `PATCH /api/members/{id}` */
  update(memberId: MemberId, changes: UpdateMemberInput): Promise<Member> {
    throw new NotImplementedException('MemberService.update is not implemented (Task 8)');
  }

  /** Validates a legacy CSV and stages it for review without writing member rows. */
  stageLegacyImport(csv: Buffer): Promise<LegacyImportPreview> {
    throw new NotImplementedException(
      'MemberService.stageLegacyImport is not implemented (Task 11)',
    );
  }

  /** Commits a previously staged import after the reconciliation screen is confirmed. */
  commitLegacyImport(stagingId: string): Promise<LegacyImportCommitResult> {
    throw new NotImplementedException(
      'MemberService.commitLegacyImport is not implemented (Task 11)',
    );
  }
}
