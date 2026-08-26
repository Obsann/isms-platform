import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { MemberSearchQueryDto } from './dto/member-search-query.dto';
import { MemberService } from './member.service';
import type { Member } from '../types';
import type { MemberSearchResult, LegacyImportPreview, LegacyImportCommitResult } from './member.types';

@Controller('members')
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  // ── Legacy Import (Task 11) ─────────────────────────────────────────────────
  // IMPORTANT: these routes must be declared BEFORE @Get(':id') to avoid
  // NestJS treating "import" as an :id path parameter.

  @Post('import/stage')
  @UseInterceptors(FileInterceptor('file'))
  stageImport(@UploadedFile() file: any): Promise<LegacyImportPreview> {
    return this.memberService.stageLegacyImport(file);
  }

  @Post('import/commit/:stagingId')
  commitImport(@Param('stagingId') stagingId: string): Promise<LegacyImportCommitResult> {
    return this.memberService.commitLegacyImport(stagingId);
  }

  // ── CRUD ────────────────────────────────────────────────────────────────────

  @Post()
  create(@Body() dto: CreateMemberDto): Promise<Member> {
    return this.memberService.create(dto);
  }

  @Get(':id')
  findById(@Param('id') id: string): Promise<Member> {
    return this.memberService.findById(id);
  }

  @Get()
  search(@Query() query: MemberSearchQueryDto): Promise<MemberSearchResult> {
    return this.memberService.search(query);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMemberDto): Promise<Member> {
    return this.memberService.update(id, dto);
  }
}
