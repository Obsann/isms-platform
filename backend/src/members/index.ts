// Public surface of the Member Management module. Anything not re-exported here —
// controllers, repositories, internal helpers — is off limits to other modules.
export { MemberModule } from './member.module';
export { MemberService } from './member.service';
export type {
  CreateMemberInput,
  LegacyImportCommitResult,
  LegacyImportPreview,
  LegacyRowError,
  MemberSearchQuery,
  MemberSearchResult,
  UpdateMemberInput,
} from './member.types';
