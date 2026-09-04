import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { In, Not, QueryFailedError, type Repository } from 'typeorm';
import { MobileMoneyStagedRequestEntity } from '../channel-integration/mobile-money-staged-request.entity';
import { TenantContextService } from '../common/tenant-context/tenant-context.service';
import { LedgerEntryEntity } from '../ledger/ledger-entry.entity';
import { LoanGuarantorEntity } from '../loans/entities/loan-guarantor.entity';
import { LoanRepaymentEntity } from '../loans/entities/loan-repayment.entity';
import { LoanEntity } from '../loans/entities/loan.entity';
import { AccountEntity } from '../savings-shares/account.entity';
import { FundsHoldEntity } from '../savings-shares/funds-hold.entity';
import { SavingsTransactionEntity } from '../savings-shares/savings-transaction.entity';
import {
  normalizeEmail,
  normalizeMemberNumber,
  normalizeNationalId,
  normalizePhone,
} from './member-field.rules';
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
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

    const nationalId = normalizeNationalId(input.idType, input.nationalId);
    const phone = normalizePhone(input.phone);
    const email = normalizeEmail(input.email);
    const memberNumber = input.memberNumber
      ? normalizeMemberNumber(input.memberNumber)
      : await this.allocateNextMemberNumber(repo);

    await this.assertUniqueFields(repo, { memberNumber, nationalId, phone, email });

    const member = repo.create({
      memberNumber,
      firstName: input.firstName,
      middleName: input.middleName,
      lastName: input.lastName,
      nationalId,
      idType: input.idType,
      phone,
      email,
      dateOfBirth: input.dateOfBirth,
      status: input.status ?? 'active',
      joinedAt: input.joinedAt ?? null,
      tenantId,
    });

    try {
      const saved = await repo.save(member);
      return this.mapToContract(saved);
    } catch (err) {
      // Concurrent create may race on auto-number; retry once with a fresh allocation.
      if (!input.memberNumber && this.isUniqueMemberNumberViolation(err)) {
        member.memberNumber = await this.allocateNextMemberNumber(repo);
        try {
          const saved = await repo.save(member);
          return this.mapToContract(saved);
        } catch (retryErr) {
          this.rethrowUniqueViolation(retryErr);
          throw retryErr;
        }
      }
      this.rethrowUniqueViolation(err);
      throw err;
    }
  }

  /**
   * Next unique `MEM-#####` in the current tenant (RLS). Starts at `MEM-10001`
   * when the tenant has no numeric member numbers yet.
   */
  private async allocateNextMemberNumber(repo: Repository<MemberEntity>): Promise<string> {
    const rows = await repo
      .createQueryBuilder('member')
      .select('member.memberNumber', 'memberNumber')
      .where(`member.member_number ~ '^MEM-[0-9]+$'`)
      .getRawMany<{ memberNumber: string }>();

    let maxSuffix = 10000;
    for (const row of rows) {
      const match = /^MEM-(\d+)$/i.exec(row.memberNumber);
      if (!match) continue;
      const value = Number.parseInt(match[1], 10);
      if (Number.isFinite(value) && value > maxSuffix) {
        maxSuffix = value;
      }
    }

    const next = maxSuffix + 1;
    const suffix = next <= 99999 ? String(next).padStart(5, '0') : String(next);
    return `MEM-${suffix}`;
  }

  private isUniqueMemberNumberViolation(err: unknown): boolean {
    if (!(err instanceof QueryFailedError)) {
      return false;
    }
    const driver = err as QueryFailedError & { driverError?: { code?: string; constraint?: string } };
    return (
      driver.driverError?.code === '23505' &&
      (driver.driverError.constraint ?? '').includes('member_number')
    );
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

  /**
   * Exact email match in the current tenant (RLS). Used by member self-service
   * to link a `staff_accounts` login to a `members` row without listing the directory.
   */
  async findByEmail(email: string): Promise<Member | null> {
    const normalized = normalizeEmail(email);
    if (!normalized) {
      return null;
    }
    const repo = this.tenantContext.repo(MemberEntity);
    const member = await repo.findOne({ where: { email: normalized } });
    return member ? this.mapToContract(member) : null;
  }

  /** UUID or human member number (e.g. MEM-10001). */
  async findByIdOrNumber(idOrNumber: string): Promise<Member> {
    const trimmed = idOrNumber.trim();
    if (UUID_RE.test(trimmed)) {
      return this.findById(trimmed);
    }
    const repo = this.tenantContext.repo(MemberEntity);
    const member = await repo.findOne({
      where: { memberNumber: normalizeMemberNumber(trimmed) },
    });
    if (!member) {
      throw new NotFoundException(`Member "${trimmed}" not found`);
    }
    return this.mapToContract(member);
  }

  async countMembers(): Promise<{ total: number; active: number }> {
    const repo = this.tenantContext.repo(MemberEntity);
    const total = await repo.count();
    const active = await repo.count({ where: { status: 'active' } });
    return { total, active };
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

    const nextMemberNumber = changes.memberNumber
      ? normalizeMemberNumber(changes.memberNumber)
      : member.memberNumber;
    const nextNationalId =
      changes.nationalId === undefined
        ? member.nationalId
        : changes.nationalId
          ? normalizeNationalId(changes.idType ?? member.idType ?? undefined, changes.nationalId)
          : null;
    const nextPhone =
      changes.phone === undefined ? member.phone : changes.phone ? normalizePhone(changes.phone) : null;
    const nextEmail =
      changes.email === undefined ? member.email : changes.email ? normalizeEmail(changes.email) : null;

    await this.assertUniqueFields(
      repo,
      {
        memberNumber: nextMemberNumber,
        nationalId: nextNationalId,
        phone: nextPhone,
        email: nextEmail,
      },
      memberId,
    );

    Object.assign(member, changes);
    member.memberNumber = nextMemberNumber;
    member.phone = nextPhone;
    member.email = nextEmail;
    if (changes.nationalId === undefined) {
      // leave as-is
    } else if (!changes.nationalId) {
      member.nationalId = null;
      member.idType = null;
    } else {
      member.nationalId = nextNationalId;
      if (changes.idType !== undefined) {
        member.idType = changes.idType;
      }
    }

    try {
      const saved = await repo.save(member);
      return this.mapToContract(saved);
    } catch (err) {
      this.rethrowUniqueViolation(err);
      throw err;
    }
  }

  /** `DELETE /api/members/{id}` — tenant-admin hard delete; cascades related tenant rows. */
  async remove(memberId: MemberId): Promise<void> {
    const repo = this.tenantContext.repo(MemberEntity);
    const member = await repo.findOne({ where: { id: memberId } });
    if (!member) {
      throw new NotFoundException(`Member with ID "${memberId}" not found`);
    }

    await this.cascadeDeleteMemberRecords(memberId);
    await repo.remove(member);
  }

  /**
   * Removes dependent rows that block `members` FK constraints. Tenant-admin only
   * (route RBAC); tellers use status changes instead.
   */
  private async cascadeDeleteMemberRecords(memberId: MemberId): Promise<void> {
    const manager = this.tenantContext.getManager();

    const accounts = await manager.getRepository(AccountEntity).find({
      where: { memberId },
      select: { id: true },
    });
    const accountIds = accounts.map((account) => account.id);

    await manager.getRepository(LoanGuarantorEntity).delete({ guarantorMemberId: memberId });
    if (accountIds.length > 0) {
      await manager.getRepository(LoanGuarantorEntity).delete({ pledgedAccountId: In(accountIds) });
    }

    const loans = await manager.getRepository(LoanEntity).find({
      where: { memberId },
      select: { id: true },
    });
    const loanIds = loans.map((loan) => loan.id);

    if (loanIds.length > 0) {
      await manager.getRepository(LoanRepaymentEntity).delete({ loanId: In(loanIds) });
      await manager.getRepository(LoanGuarantorEntity).delete({ loanId: In(loanIds) });
      await manager.getRepository(LoanEntity).delete({ id: In(loanIds) });
    }

    if (accountIds.length > 0) {
      await manager.getRepository(LedgerEntryEntity).delete({ accountId: In(accountIds) });
      await manager.getRepository(SavingsTransactionEntity).delete({ accountId: In(accountIds) });
      await manager.getRepository(FundsHoldEntity).delete({ accountId: In(accountIds) });
      await manager.getRepository(AccountEntity).delete({ id: In(accountIds) });
    }

    await manager.getRepository(MobileMoneyStagedRequestEntity).delete({ memberId });
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
    const seenNationalIds = new Set<string>();
    const seenPhones = new Set<string>();
    const seenEmails = new Set<string>();
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
          message: `Member number "${memberNumber}" is already registered in this SACCO`,
        });
        continue;
      }

      if (nationalId) {
        if (seenNationalIds.has(nationalId)) {
          errors.push({
            row: rowNum,
            field: 'nationalId',
            message: `ID number "${nationalId}" is duplicated in this CSV`,
          });
          continue;
        }
        seenNationalIds.add(nationalId);
        const idExisting = await repo.findOne({ where: { nationalId } });
        if (idExisting) {
          errors.push({
            row: rowNum,
            field: 'nationalId',
            message: `ID number "${nationalId}" is already registered in this SACCO`,
          });
          continue;
        }
      }

      if (phone) {
        if (seenPhones.has(phone)) {
          errors.push({
            row: rowNum,
            field: 'phone',
            message: `Phone "${phone}" is duplicated in this CSV`,
          });
          continue;
        }
        seenPhones.add(phone);
        const phoneExisting = await repo.findOne({ where: { phone } });
        if (phoneExisting) {
          errors.push({
            row: rowNum,
            field: 'phone',
            message: `Phone "${phone}" is already registered in this SACCO`,
          });
          continue;
        }
      }

      if (email) {
        const emailKey = email.toLowerCase();
        if (seenEmails.has(emailKey)) {
          errors.push({
            row: rowNum,
            field: 'email',
            message: `Email "${email}" is duplicated in this CSV`,
          });
          continue;
        }
        seenEmails.add(emailKey);
        const emailExisting = await repo.findOne({ where: { email: emailKey } });
        if (emailExisting) {
          errors.push({
            row: rowNum,
            field: 'email',
            message: `Email "${email}" is already registered in this SACCO`,
          });
          continue;
        }
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

  private async assertUniqueFields(
    repo: { findOne: (opts: { where: object }) => Promise<MemberEntity | null> },
    fields: {
      memberNumber?: string;
      nationalId?: string | null;
      phone?: string | null;
      email?: string | null;
    },
    excludeId?: string,
  ): Promise<void> {
    if (fields.memberNumber) {
      const found = await repo.findOne({
        where: excludeId
          ? { memberNumber: fields.memberNumber, id: Not(excludeId) }
          : { memberNumber: fields.memberNumber },
      });
      if (found) {
        throw new ConflictException(
          `Member number "${fields.memberNumber}" is already registered in this SACCO`,
        );
      }
    }

    if (fields.nationalId) {
      const found = await repo.findOne({
        where: excludeId
          ? { nationalId: fields.nationalId, id: Not(excludeId) }
          : { nationalId: fields.nationalId },
      });
      if (found) {
        throw new ConflictException(
          'This ID number is already registered in this SACCO. Names may match; ID, phone, and email must be unique.',
        );
      }
    }

    if (fields.phone) {
      const found = await repo.findOne({
        where: excludeId ? { phone: fields.phone, id: Not(excludeId) } : { phone: fields.phone },
      });
      if (found) {
        throw new ConflictException('This phone number is already registered in this SACCO');
      }
    }

    if (fields.email) {
      const found = await repo.findOne({
        where: excludeId ? { email: fields.email, id: Not(excludeId) } : { email: fields.email },
      });
      if (found) {
        throw new ConflictException('This email is already registered in this SACCO');
      }
    }
  }

  private rethrowUniqueViolation(err: unknown): never | void {
    if (!(err instanceof QueryFailedError)) {
      return;
    }
    const driver = err as QueryFailedError & { driverError?: { code?: string; constraint?: string } };
    if (driver.driverError?.code !== '23505') {
      return;
    }
    const constraint = driver.driverError.constraint ?? '';
    if (constraint.includes('member_number')) {
      throw new ConflictException('Member number is already registered in this SACCO');
    }
    if (constraint.includes('national_id')) {
      throw new ConflictException('This ID number is already registered in this SACCO');
    }
    if (constraint.includes('phone')) {
      throw new ConflictException('This phone number is already registered in this SACCO');
    }
    if (constraint.includes('email')) {
      throw new ConflictException('This email is already registered in this SACCO');
    }
    throw new ConflictException('A member with these details is already registered in this SACCO');
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
