import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { TenantContextService } from '../common/tenant-context/tenant-context.service';
import { MemberEntity } from './member.entity';
import type { Member, MemberId } from '../types';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { MemberSearchQueryDto } from './dto/member-search-query.dto';
import type {
  LegacyImportCommitResult,
  LegacyImportPreview,
  LegacyRowError,
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
  private stagingCache = new Map<string, Partial<MemberEntity>[]>();

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
  async stageLegacyImport(csv: Buffer, mappings?: Record<string, string>): Promise<LegacyImportPreview> {
    const tenantId = this.tenantContext.getTenantId();
    if (!tenantId) {
      throw new UnauthorizedException('No tenant context found');
    }

    const parseCsvLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const rawContent = csv.toString('utf-8');
    const lines = rawContent.split(/\r?\n/).map(line => line.trim()).filter(line => line !== '');
    if (lines.length === 0) {
      return {
        stagingId: '',
        totalRows: 0,
        validRows: 0,
        errors: [{ row: 1, message: 'CSV file is empty or contains only whitespace' }],
      };
    }

    const headers = parseCsvLine(lines[0]);
    const fieldIndices: Record<string, number> = {};
    const possibleFields = [
      'memberNumber',
      'firstName',
      'middleName',
      'lastName',
      'nationalId',
      'idType',
      'phone',
      'email',
      'dateOfBirth',
      'status',
      'joinedAt',
    ];

    for (const field of possibleFields) {
      const mappedHeaderName = mappings ? mappings[field] : field;
      if (mappedHeaderName) {
        const index = headers.findIndex(h => h.toLowerCase() === mappedHeaderName.toLowerCase());
        if (index !== -1) {
          fieldIndices[field] = index;
        }
      }
    }

    const errors: LegacyRowError[] = [];
    const validEntities: Partial<MemberEntity>[] = [];
    const seenMemberNumbers = new Set<string>();
    const repo = this.tenantContext.repo(MemberEntity);

    for (let i = 1; i < lines.length; i++) {
      const rowNum = i + 1; // 1-indexed row number
      const cells = parseCsvLine(lines[i]);
      if (cells.length === 0 || (cells.length === 1 && cells[0] === '')) {
        continue;
      }

      const getVal = (field: string): string => {
        const idx = fieldIndices[field];
        return idx !== undefined && idx < cells.length ? cells[idx] : '';
      };

      const memberNumber = getVal('memberNumber');
      const firstName = getVal('firstName');
      const middleName = getVal('middleName') || null;
      const lastName = getVal('lastName');
      const nationalId = getVal('nationalId') || null;
      const idTypeVal = getVal('idType') || null;
      const phone = getVal('phone') || null;
      const email = getVal('email') || null;
      const dateOfBirth = getVal('dateOfBirth') || null;
      const statusVal = getVal('status') || 'pending';
      const joinedAt = getVal('joinedAt') || null;

      if (!memberNumber) {
        errors.push({ row: rowNum, column: mappings?.memberNumber || 'memberNumber', message: 'Member number is required' });
        continue;
      }
      if (!firstName) {
        errors.push({ row: rowNum, column: mappings?.firstName || 'firstName', message: 'First name is required' });
        continue;
      }
      if (!lastName) {
        errors.push({ row: rowNum, column: mappings?.lastName || 'lastName', message: 'Last name is required' });
        continue;
      }

      if (seenMemberNumbers.has(memberNumber)) {
        errors.push({ row: rowNum, column: mappings?.memberNumber || 'memberNumber', message: `Duplicate member number "${memberNumber}" within CSV` });
        continue;
      }
      seenMemberNumbers.add(memberNumber);

      const dbExisting = await repo.findOne({ where: { memberNumber } });
      if (dbExisting) {
        errors.push({ row: rowNum, column: mappings?.memberNumber || 'memberNumber', message: `Member number "${memberNumber}" already exists in the system` });
        continue;
      }

      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push({ row: rowNum, column: mappings?.email || 'email', message: 'Invalid email address format' });
        continue;
      }

      let idType: any = null;
      if (idTypeVal) {
        const normalized = idTypeVal.toLowerCase().replace(/[\s_-]+/g, '_');
        if (normalized === 'national_id' || normalized === 'nationalid') {
          idType = 'national_id';
        } else if (normalized === 'passport') {
          idType = 'passport';
        } else if (normalized === 'other') {
          idType = 'other';
        } else {
          errors.push({ row: rowNum, column: mappings?.idType || 'idType', message: 'ID Type must be "national_id", "passport", or "other"' });
          continue;
        }
      }

      if (dateOfBirth && isNaN(Date.parse(dateOfBirth))) {
        errors.push({ row: rowNum, column: mappings?.dateOfBirth || 'dateOfBirth', message: 'Invalid Date of Birth format. Use YYYY-MM-DD' });
        continue;
      }

      if (joinedAt && isNaN(Date.parse(joinedAt))) {
        errors.push({ row: rowNum, column: mappings?.joinedAt || 'joinedAt', message: 'Invalid Joined Date format. Use YYYY-MM-DD' });
        continue;
      }

      let status: any = 'pending';
      if (statusVal) {
        const normalizedStatus = statusVal.toLowerCase();
        if (normalizedStatus === 'pending' || normalizedStatus === 'active' || normalizedStatus === 'inactive') {
          status = normalizedStatus;
        } else {
          errors.push({ row: rowNum, column: mappings?.status || 'status', message: 'Status must be "pending", "active", or "inactive"' });
          continue;
        }
      }

      validEntities.push({
        tenantId,
        memberNumber,
        firstName,
        middleName,
        lastName,
        nationalId,
        idType,
        phone,
        email,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString().split('T')[0] : null,
        status,
        joinedAt: joinedAt ? new Date(joinedAt).toISOString().split('T')[0] : null,
      });
    }

    const stagingId = randomUUID();
    if (validEntities.length > 0) {
      this.stagingCache.set(stagingId, validEntities);
    }

    return {
      stagingId,
      totalRows: lines.length - 1,
      validRows: validEntities.length,
      errors,
    };
  }

  /** Commits a previously staged import after the reconciliation screen is confirmed. */
  async commitLegacyImport(stagingId: string): Promise<LegacyImportCommitResult> {
    const validEntities = this.stagingCache.get(stagingId);
    if (!validEntities) {
      throw new NotFoundException('Staging session expired or not found');
    }

    const repo = this.tenantContext.repo(MemberEntity);
    const saved = await repo.save(validEntities);

    this.stagingCache.delete(stagingId);

    return {
      stagingId,
      importedRows: saved.length,
      skippedRows: 0,
    };
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
