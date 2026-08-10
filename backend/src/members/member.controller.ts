import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { MemberSearchQueryDto } from './dto/member-search-query.dto';
import { MemberService } from './member.service';
import type { Member } from '../types';
import type { MemberSearchResult } from './member.types';

@Controller('members')
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

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
