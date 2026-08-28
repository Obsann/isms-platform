import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { TenantContextService } from '../common/tenant-context/tenant-context.service';
import { MemberEntity } from './member.entity';
import type { IdType, Member, MemberId, MemberStatus } from '../types';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { MemberSearchQueryDto } from './dto/member-search-query.dto';
import type {
  LegacyImportCommitResult,
  LegacyImportPreview,
  LegacyRowError,
  MemberSearchResult,
} from './member.types';

const CSV_FIELDS = [
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
] as const;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function parseCsvLine(line: string): string[] {
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
}

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
  private readonly stagingCache = new Map<string, Partial<MemberEntity>[]>();

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
  async stageLegacyImport(csv: Buffer): Promise<LegacyImportPreview> {
    const tenantId = this.tenantContext.getTenantId();
    if (!tenantId) {
      throw new UnauthorizedException('No tenant context found');
    }

    const rawContent = csv.toString('utf-8').replace(/^\uFEFF/, '');
    const lines = rawContent
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line !== '');

    if (lines.length === 0) {
      return {
        stagingId: '',
        totalRows: 0,
        validRows: 0,
        errors: [{ row: 1, field: 'file', message: 'CSV file is empty. Use a member list with a header row.' }],
        preview: [],
      };
    }

    const headers = parseCsvLine(lines[0]);
    const fieldIndices: Record<string, number> = {};
    for (const field of CSV_FIELDS) {
      const index = headers.findIndex((h) => h.toLowerCase() === field.toLowerCase());
      if (index !== -1) {
        fieldIndices[field] = index;
      }
    }

    const missingHeaders = (['memberNumber', 'firstName', 'lastName'] as const).filter(
      (field) => fieldIndices[field] === undefined,
    );
    if (missingHeaders.length > 0) {
      return {
        stagingId: '',
        totalRows: Math.max(0, lines.length - 1),
        validRows: 0,
        errors: missingHeaders.map((field) => ({
          row: 1,
          field,
          message: `Missing required column "${field}"`,
        })),
        preview: [],
      };
    }

    const errors: LegacyRowError[] = [];
    const validEntities: Partial<MemberEntity>[] = [];
    const preview: Record<string, string>[] = [];
    const seenMemberNumbers = new Set<string>();
    const repo = this.tenantContext.repo(MemberEntity);

    for (let i = 1; i < lines.length; i++) {
      const rowNum = i + 1;
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
        errors.push({ row: rowNum, field: 'memberNumber', message: 'Member number is required' });
        continue;
      }
      if (!firstName) {
        errors.push({ row: rowNum, field: 'firstName', message: 'First name is required' });
        continue;
      }
      if (!lastName) {
        errors.push({ row: rowNum, field: 'lastName', message: 'Last name is required' });
        continue;
      }

      if (seenMemberNumbers.has(memberNumber)) {
        errors.push({
          row: rowNum,
          field: 'memberNumber',
          message: `Duplicate member number "${memberNumber}" within CSV`,
        });
        continue;
      }
      seenMemberNumbers.add(memberNumber);

      const dbExisting = await repo.findOne({ where: { memberNumber } });
      if (dbExisting) {
        errors.push({
          row: rowNum,
          field: 'memberNumber',
          message: `Member number "${memberNumber}" already exists in the system`,
        });
        continue;
      }

      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push({ row: rowNum, field: 'email', message: 'Invalid email address format' });
        continue;
      }

      let idType: IdType | null = null;
      if (idTypeVal) {
        const normalized = idTypeVal.toLowerCase().replace(/[\s_-]+/g, '_');
        if (normalized === 'national_id' || normalized === 'nationalid') {
          idType = 'national_id';
        } else if (normalized === 'passport') {
          idType = 'passport';
        } else if (normalized === 'other') {
          idType = 'other';
        } else {
          errors.push({
            row: rowNum,
            field: 'idType',
            message: 'ID Type must be "national_id", "passport", or "other"',
          });
          continue;
        }
      }

      if (dateOfBirth && !ISO_DATE.test(dateOfBirth)) {
        errors.push({ row: rowNum, field: 'dateOfBirth', message: 'Invalid Date of Birth format. Use YYYY-MM-DD' });
        continue;
      }

      if (joinedAt && !ISO_DATE.test(joinedAt)) {
        errors.push({ row: rowNum, field: 'joinedAt', message: 'Invalid Joined Date format. Use YYYY-MM-DD' });
        continue;
      }

      let status: MemberStatus = 'pending';
      if (statusVal) {
        const normalizedStatus = statusVal.toLowerCase();
        if (normalizedStatus === 'pending' || normalizedStatus === 'active' || normalizedStatus === 'inactive') {
          status = normalizedStatus;
        } else {
          errors.push({
            row: rowNum,
            field: 'status',
            message: 'Status must be "pending", "active", or "inactive"',
          });
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
        dateOfBirth,
        status,
        joinedAt,
      });

      if (preview.length < 10) {
        preview.push({
          memberNumber,
          firstName,
          middleName: middleName ?? '',
          lastName,
          nationalId: nationalId ?? '',
          idType: idType ?? '',
          phone: phone ?? '',
          email: email ?? '',
          dateOfBirth: dateOfBirth ?? '',
          status,
          joinedAt: joinedAt ?? '',
        });
      }
    }

    const stagingId = validEntities.length > 0 ? randomUUID() : '';
    if (validEntities.length > 0) {
      this.stagingCache.set(stagingId, validEntities);
    }

    return {
      stagingId,
      totalRows: lines.length - 1,
      validRows: validEntities.length,
      errors,
      preview,
    };
  }

  /** Commits a previously staged import after the reconciliation screen is confirmed. */
  async commitLegacyImport(stagingId: string): Promise<LegacyImportCommitResult> {
    const validEntities = this.stagingCache.get(stagingId);
    if (!validEntities) {
      throw new NotFoundException('Staging session expired or not found. Upload the CSV again.');
    }

    const repo = this.tenantContext.repo(MemberEntity);
    const saved = await repo.save(validEntities);
    this.stagingCache.delete(stagingId);

    return {
      stagingId,
      committed: saved.length,
      skipped: 0,
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
