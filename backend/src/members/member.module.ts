import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemberEntity } from './member.entity';
import { MemberService } from './member.service';
import { MemberController } from './member.controller';

/**
 * Member Management module configuration.
 * Exposes MemberController and registers the MemberEntity with TypeORM.
 */
@Module({
  imports: [TypeOrmModule.forFeature([MemberEntity])],
  controllers: [MemberController],
  providers: [MemberService],
  exports: [MemberService],
})
export class MemberModule {}
