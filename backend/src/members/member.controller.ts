import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from '../common';
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
  @Roles('teller', 'tenant-admin')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 2 * 1024 * 1024 } }))
  stageImport(@UploadedFile() file?: { buffer?: Buffer; originalname?: string }): Promise<LegacyImportPreview> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Please upload a non-empty .csv file of members.');
    }
    const name = (file.originalname ?? '').toLowerCase();
    if (name && !name.endsWith('.csv')) {
      throw new BadRequestException('File must be a .csv (comma-separated members), not a document or spreadsheet.');
    }
    return this.memberService.stageLegacyImport(file.buffer);
  }

  @Post('import/commit/:stagingId')
  @Roles('teller', 'tenant-admin')
  commitImport(@Param('stagingId') stagingId: string): Promise<LegacyImportCommitResult> {
    return this.memberService.commitLegacyImport(stagingId);
  }

  // ── CRUD ────────────────────────────────────────────────────────────────────

  @Post()
  @Roles('teller', 'tenant-admin')
  create(@Body() dto: CreateMemberDto): Promise<Member> {
    return this.memberService.create(dto);
  }

  @Get(':id')
  @Roles('teller', 'tenant-admin', 'loan-officer')
  findById(@Param('id') id: string): Promise<Member> {
    return this.memberService.findById(id);
  }

  @Get()
  @Roles('teller', 'tenant-admin', 'loan-officer')
  search(@Query() query: MemberSearchQueryDto): Promise<MemberSearchResult> {
    return this.memberService.search(query);
  }

  @Patch(':id')
  @Roles('teller', 'tenant-admin')
  update(@Param('id') id: string, @Body() dto: UpdateMemberDto): Promise<Member> {
    return this.memberService.update(id, dto);
  }

  @Delete(':id')
  @Roles('tenant-admin')
  @HttpCode(204)
  remove(@Param('id') id: string): Promise<void> {
    return this.memberService.remove(id);
  }
}
