import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';

/**
 * TODO(Task 25 — Liya): add the Nodemailer transport and read SMTP settings through
 * `ConfigService`.
 * TODO(Task 26 — Liya): document the mobile money webhook and USSD session contracts
 * in `docs/openapi/`. No live gateway integration this phase.
 */
@Module({
  providers: [NotificationService],
  exports: [NotificationService],
})
export class ChannelIntegrationModule {}
