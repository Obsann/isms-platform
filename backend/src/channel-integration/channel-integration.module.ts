import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MobileMoneyMockService } from './mobile-money-mock.service';
import { MobileMoneyStagedRequestEntity } from './mobile-money-staged-request.entity';
import { createSmtpTransport, NotificationService, SMTP_TRANSPORT } from './notification.service';

/**
 * Channel Integration — SMTP notifications (Task 25) + mobile-money webhook
 * contracts (Task 26, documented only).
 *
 * SMTP settings are read through ConfigService / `process.env` here only.
 * Mobile money C2B/B2C webhook contracts live in `docs/openapi/`.
 */
@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([MobileMoneyStagedRequestEntity])],
  providers: [
    {
      provide: SMTP_TRANSPORT,
      inject: [ConfigService],
      useFactory: createSmtpTransport,
    },
    NotificationService,
    MobileMoneyMockService,
  ],
  exports: [NotificationService, MobileMoneyMockService],
})
export class ChannelIntegrationModule {}
