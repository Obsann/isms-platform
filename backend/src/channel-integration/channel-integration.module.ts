import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createSmtpTransport, NotificationService, SMTP_TRANSPORT } from './notification.service';

/**
 * Channel Integration — SMTP notifications (Task 25) + mobile-money webhook
 * contracts (Task 26, documented only).
 *
 * SMTP settings are read through ConfigService / `process.env` here only.
 * TODO(Task 26): document mobile money C2B/B2C webhook contracts in `docs/openapi/`.
 */
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: SMTP_TRANSPORT,
      inject: [ConfigService],
      useFactory: createSmtpTransport,
    },
    NotificationService,
  ],
  exports: [NotificationService],
})
export class ChannelIntegrationModule {}
