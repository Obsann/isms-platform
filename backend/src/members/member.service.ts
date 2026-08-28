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
 * Member Management vertical — owner: **Melkamu** (Tasks 8, 10, 11).
 *
 * The only entry point other modules may use. Tenant scoping is applied by the
 * tenant-context guard (Task 3), so no method here takes or filters on a tenant id.
 *
 * ID fields (`nationalId`, `idType`) are stored as typed by staff — no live
 * verification call (DECISIONS.md D1).
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

    const existing = await repo.findOne({ where: { memberNumber: input.memberNumber } });
    if (existing) {
      throw new ConflictException(`Member number "${input.memberNumber}" already exists in this tenant`);
    }

    const member = repo.create({
      memberNumber: input.memberNumber,
      firstName: input.firstName,
      middleName: input.middleName ?? null,
      lastName: input.lastName,
      nationalId: input.nationalId ?? null,
      idType: input.nationalId ? (input.idType ?? null) : null,
      phone: input.phone ?? null,
      email: input.email ?? null,
      dateOfBirth: input.dateOfBirth ?? null,
      status: input.status ?? 'pending',
      joinedAt: input.joinedAt ?? null,
      tenantId,
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

    const tenantId = this.tenantContext.getTenantId();
    if (tenantId) {
      qb.andWhere('member.tenantId = :tenantId', { tenantId });
    }

    if (query.search) {
      const searchPattern = `%${query.search}%`;
      qb.andWhere(
        '(member.firstName ILIKE :search OR member.middleName ILIKE :search OR member.lastName ILIKE :search OR member.email ILIKE :search OR member.phone ILIKE :search OR member.memberNumber ILIKE :search OR member.nationalId ILIKE :search)',
        { search: searchPattern },
      );
    }

    const limit = query.limit ?? 10;
    const offset = query.offset ?? 0;

    qb.orderBy('member.createdAt', 'DESC');
    qb.take(limit);
    qb.skip(offset);

    const [entities, total] = await qb.getManyAndCount();
    return {
      items: entities.map((entity) => this.mapToContract(entity)),
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

    if (changes.memberNumber && changes.memberNumber !== member.memberNumber) {
      const existing = await repo.findOne({ where: { memberNumber: changes.memberNumber } });
      if (existing) {
        throw new ConflictException(`Member number "${changes.memberNumber}" already exists in this tenant`);
      }
    }

    Object.assign(member, changes);
    if (changes.nationalId === undefined) {
      // leave as-is
    } else if (!changes.nationalId) {
      member.nationalId = null;
      member.idType = null;
    } else if (changes.idType !== undefined) {
      member.idType = changes.idType;
    }

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
      idType: entity.idType,
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
