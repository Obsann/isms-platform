import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { TenantContextService } from '../common/tenant-context/tenant-context.service';
import { MemberEntity } from './member.entity';
import type { Member, MemberId } from '../types';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { MemberSearchQueryDto } from './dto/member-search-query.dto';
import type {
  LegacyImportCommitResult,
  LegacyImportPreview,
  MemberSearchResult,
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
  constructor(private readonly tenantContext: TenantContextService) {}

  /** `POST /api/members` */
  async create(input: CreateMemberDto): Promise<Member> {
    const repo = this.tenantContext.repo(MemberEntity);
    const tenantId = this.tenantContext.getTenantId();
    if (!tenantId) {
      throw new UnauthorizedException('No tenant context found');
    }

    // Check for membership number conflicts within the current tenant scope
    const existing = await repo.findOne({ where: { memberNumber: input.memberNumber } });
    if (existing) {
      throw new ConflictException(`Member number "${input.memberNumber}" already exists in this tenant`);
    }

    const member = repo.create({
      ...input,
      tenantId,
      status: input.status ?? 'pending',
      nationalIdVerified: false,
      nationalIdVerifiedAt: null,
    });

    const saved = await repo.save(member);
    return this.mapToContract(saved);
  }

  /** `GET /api/members/{id}` */
  async findById(memberId: MemberId): Promise<Member> {
    const repo = this.tenantContext.repo(MemberEntity);
    const member = await repo.findOne({ where: { id: memberId } });
    if (!member) {
      throw new NotFoundException(`Member with ID "${memberId}" not found`);
    }
    return this.mapToContract(member);
  }

  /** `GET /api/members?search=` */
  async search(query: MemberSearchQueryDto): Promise<MemberSearchResult> {
    const repo = this.tenantContext.repo(MemberEntity);
    const qb = repo.createQueryBuilder('member');

    if (query.search) {
      const searchPattern = `%${query.search}%`;
      qb.andWhere(
        '(member.firstName ILIKE :search OR member.middleName ILIKE :search OR member.lastName ILIKE :search OR member.email ILIKE :search OR member.phone ILIKE :search OR member.memberNumber ILIKE :search)',
        { search: searchPattern }
      );
    }

    const limit = query.limit ?? 10;
    const offset = query.offset ?? 0;

    qb.orderBy('member.createdAt', 'DESC');
    qb.take(limit);
    qb.skip(offset);

    const [entities, total] = await qb.getManyAndCount();
    return {
      items: entities.map(entity => this.mapToContract(entity)),
      total,
    };
  }

  /** `PATCH /api/members/{id}` */
  async update(memberId: MemberId, changes: UpdateMemberDto): Promise<Member> {
    const repo = this.tenantContext.repo(MemberEntity);
    const member = await repo.findOne({ where: { id: memberId } });
    if (!member) {
      throw new NotFoundException(`Member with ID "${memberId}" not found`);
    }

    // Check for membership number conflicts if it is being changed
    if (changes.memberNumber && changes.memberNumber !== member.memberNumber) {
      const existing = await repo.findOne({ where: { memberNumber: changes.memberNumber } });
      if (existing) {
        throw new ConflictException(`Member number "${changes.memberNumber}" already exists in this tenant`);
      }
    }

    // Merge non-null/undefined properties manually
    Object.assign(member, changes);

    const saved = await repo.save(member);
    return this.mapToContract(saved);
  }

  /** Validates a legacy CSV and stages it for review without writing member rows. */
  stageLegacyImport(csv: Buffer): Promise<LegacyImportPreview> {
    throw new Error('MemberService.stageLegacyImport is not implemented (Task 11)');
  }

  /** Commits a previously staged import after the reconciliation screen is confirmed. */
  commitLegacyImport(stagingId: string): Promise<LegacyImportCommitResult> {
    throw new Error('MemberService.commitLegacyImport is not implemented (Task 11)');
  }

  /** Maps a database MemberEntity to the public API Member contract. */
  private mapToContract(entity: MemberEntity): Member {
    return {
      id: entity.id,
      tenantId: entity.tenantId,
      memberNumber: entity.memberNumber,
      firstName: entity.firstName,
      middleName: entity.middleName,
      lastName: entity.lastName,
      fullName: entity.middleName
        ? `${entity.firstName} ${entity.middleName} ${entity.lastName}`
        : `${entity.firstName} ${entity.lastName}`,
      nationalId: entity.nationalId,
      nationalIdVerified: entity.nationalIdVerified,
      nationalIdVerifiedAt: entity.nationalIdVerifiedAt ? entity.nationalIdVerifiedAt.toISOString() : null,
      phone: entity.phone,
      email: entity.email,
      dateOfBirth: entity.dateOfBirth,
      status: entity.status,
      joinedAt: entity.joinedAt,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
