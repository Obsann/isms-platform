import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { MemberSearchQueryDto } from './dto/member-search-query.dto';
import { MemberService } from './member.service';
import type { Member } from '../types';
import type { MemberSearchResult, LegacyImportPreview, LegacyImportCommitResult } from './member.types';

@Controller('members')
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  @Post('import/stage')
  stageImport(
    @Body() body: { csvContent: string; mappings?: Record<string, string> }
  ): Promise<LegacyImportPreview> {
    const csvBuffer = Buffer.from(body.csvContent, 'utf-8');
    return this.memberService.stageLegacyImport(csvBuffer, body.mappings);
  }

  @Post('import/commit/:stagingId')
  commitImport(@Param('stagingId') stagingId: string): Promise<LegacyImportCommitResult> {
    return this.memberService.commitLegacyImport(stagingId);
  }

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
