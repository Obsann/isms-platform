import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemberModule } from '../members';
import { SavingsSharesModule } from '../savings-shares/savings-shares.module';
import { SecurityAuditModule } from '../security-audit';
import { ChapaPaymentEntity } from './chapa-payment.entity';
import { ChapaController, ChapaWebhookController } from './chapa.controller';
import { ChapaService } from './chapa.service';
import { MobileMoneyMockService } from './mobile-money-mock.service';
import { MobileMoneyStagedRequestEntity } from './mobile-money-staged-request.entity';
import { createSmtpTransport, NotificationService, SMTP_TRANSPORT } from './notification.service';

/**
 * Channel Integration — SMTP notifications (Task 25), Chapa C2B deposits
 * (opt-in live gateway; mock checkout when `CHAPA_SECRET_KEY` is unset), and
 * staged mobile-money webhook shapes for dev/docs (Task 24/26).
 *
 * Keys are read through ConfigService / `process.env` here only.
 */
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([ChapaPaymentEntity, MobileMoneyStagedRequestEntity]),
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
    MobileMoneyMockService,
  ],
  exports: [NotificationService, ChapaService, MobileMoneyMockService],
})
export class ChannelIntegrationModule {}
