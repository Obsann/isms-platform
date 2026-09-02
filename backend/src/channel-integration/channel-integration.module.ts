import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemberModule } from '../members';
import { SavingsSharesModule } from '../savings-shares/savings-shares.module';
import { SecurityAuditModule } from '../security-audit';
import { ChapaPaymentEntity } from './chapa-payment.entity';
import { ChapaController, ChapaWebhookController } from './chapa.controller';
import { ChapaService } from './chapa.service';
import { createSmtpTransport, NotificationService, SMTP_TRANSPORT } from './notification.service';

/**
 * Channel Integration — SMTP notifications (Task 25) + Chapa C2B deposits
 * (opt-in live gateway; mock checkout when `CHAPA_SECRET_KEY` is unset).
 *
 * Keys are read through ConfigService / `process.env` here only.
 * Generic Telebirr/M-PESA/CBE Birr webhook contracts remain in `docs/openapi/`.
 */
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([ChapaPaymentEntity]),
    MemberModule,
    SecurityAuditModule,
    forwardRef(() => SavingsSharesModule),
  ],
  controllers: [ChapaController, ChapaWebhookController],
  providers: [
    {
      provide: SMTP_TRANSPORT,
      inject: [ConfigService],
      useFactory: createSmtpTransport,
    },
    NotificationService,
    ChapaService,
  ],
  exports: [NotificationService, ChapaService],
})
export class ChannelIntegrationModule {}
