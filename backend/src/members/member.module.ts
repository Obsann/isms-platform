import { Module } from '@nestjs/common';
import { MemberService } from './member.service';

/**
 * TODO(Task 8 — Melkamu): add `member.controller.ts` and the member entity here.
 * The controller stays out of `index.ts` — only `MemberService` and the public types
 * in `member.types.ts` are visible to other modules.
 */
@Module({
  providers: [MemberService],
  exports: [MemberService],
})
export class MemberModule {}
