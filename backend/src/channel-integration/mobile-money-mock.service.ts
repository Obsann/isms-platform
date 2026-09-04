import { BadRequestException, Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { TenantContextService } from '../common/tenant-context/tenant-context.service';
import type { Member } from '../types';
import { StageMomoMockDto } from './dto/stage-momo-mock.dto';
import {
  MobileMoneyStagedRequestEntity,
  type MomoStagedDirection,
} from './mobile-money-staged-request.entity';
import {
  momoDirectionLabel,
  type StagedMomoRequestView,
} from './mobile-money-mock.types';

function formatAmount(raw: string): string {
  const trimmed = raw.trim();
  const [whole, fraction = ''] = trimmed.split('.');
  return `${whole}.${fraction.padEnd(2, '0').slice(0, 2)}`;
}

function newProviderReference(direction: MomoStagedDirection): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = randomBytes(3).toString('hex').toUpperCase();
  const prefix = direction === 'c2b' ? 'MOCK-C2B' : 'MOCK-B2C';
  return `${prefix}-${stamp}-${rand}`;
}

@Injectable()
export class MobileMoneyMockService {
  constructor(private readonly tenantContext: TenantContextService) {}

  async listPendingForMember(memberId: string): Promise<StagedMomoRequestView[]> {
    const repo = this.tenantContext.repo(MobileMoneyStagedRequestEntity);
    const rows = await repo.find({
      where: { memberId, status: 'PENDING' },
      order: { occurredAt: 'DESC' },
    });
    return rows.map((row) => this.mapToView(row));
  }

  async stageForMember(member: Member, dto: StageMomoMockDto): Promise<StagedMomoRequestView> {
    const msisdn = member.phone?.trim() ?? '';
    if (!msisdn) {
      throw new BadRequestException('Your member record has no phone number for a mock wallet request.');
    }

    if (dto.direction === 'c2b' && !dto.accountNumber?.trim()) {
      throw new BadRequestException('accountNumber is required for C2B mock deposits.');
    }

    const repo = this.tenantContext.repo(MobileMoneyStagedRequestEntity);
    const tenantId = this.tenantContext.getTenantId();
    if (!tenantId) {
      throw new BadRequestException('No tenant context found');
    }

    const entity = repo.create({
      tenantId,
      memberId: member.id,
      direction: dto.direction,
      provider: dto.provider,
      providerReference: newProviderReference(dto.direction),
      accountNumber: dto.direction === 'c2b' ? dto.accountNumber!.trim() : null,
      loanId: dto.direction === 'b2c' ? dto.loanId?.trim() ?? null : null,
      msisdn,
      amount: formatAmount(dto.amount),
      currency: 'ETB',
      status: 'PENDING',
      failureReason: null,
      occurredAt: new Date(),
    });

    const saved = await repo.save(entity);
    return this.mapToView(saved);
  }

  private mapToView(row: MobileMoneyStagedRequestEntity): StagedMomoRequestView {
    const label = momoDirectionLabel(row.direction);
    const occurredAt = row.occurredAt.toISOString();
    const amount = formatAmount(row.amount);

    if (row.direction === 'c2b') {
      return {
        id: row.id,
        direction: 'c2b',
        label,
        payload: {
          providerReference: row.providerReference,
          provider: row.provider,
          memberId: row.memberId,
          accountNumber: row.accountNumber ?? '',
          msisdn: row.msisdn,
          amount,
          currency: 'ETB',
          status: 'PENDING',
          failureReason: null,
          occurredAt,
        },
      };
    }

    return {
      id: row.id,
      direction: 'b2c',
      label,
      payload: {
        providerReference: row.providerReference,
        provider: row.provider,
        memberId: row.memberId,
        loanId: row.loanId,
        msisdn: row.msisdn,
        amount,
        currency: 'ETB',
        status: 'PENDING',
        failureReason: null,
        occurredAt,
      },
    };
  }
}
