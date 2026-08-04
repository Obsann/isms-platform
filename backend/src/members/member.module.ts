import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemberEntity } from './member.entity';
import { MemberService } from './member.service';

/**
 * TODO(Task 8 — Melkamu): add `member.controller.ts` and inject the repository.
 * The controller and entity stay out of `index.ts` — only `MemberService` and the
 * public types in `member.types.ts` are visible to other modules.
 */
@Module({
  imports: [TypeOrmModule.forFeature([MemberEntity])],
  providers: [MemberService],
  exports: [MemberService],
})
export class MemberModule {}
