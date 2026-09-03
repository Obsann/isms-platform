import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import type { OtpContext, OtpPurpose } from './otp.types';

/**
 * One-time email codes for password reset / change and high-value cash movements.
 * `tenant_id` is nullable so platform super-admin challenges work under the same
 * `IS NOT DISTINCT FROM` RLS rule as `audit_logs`.
 */
@Entity('otp_challenges')
@Index('idx_otp_challenges_tenant_id', ['tenantId'])
@Index('idx_otp_challenges_staff_purpose', ['staffId', 'purpose'])
export class OtpChallengeEntity extends BaseEntity {
  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId!: string | null;

  @Column({ name: 'staff_id', type: 'uuid' })
  staffId!: string;

  @Column({ type: 'varchar', length: 180 })
  email!: string;

  @Column({ type: 'varchar', length: 32 })
  purpose!: OtpPurpose;

  @Column({ name: 'code_hash', type: 'varchar', length: 255 })
  codeHash!: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ name: 'consumed_at', type: 'timestamptz', nullable: true })
  consumedAt!: Date | null;

  @Column({ type: 'int', default: 0 })
  attempts!: number;

  @Column({ type: 'jsonb', nullable: true })
  context!: OtpContext | null;
}
