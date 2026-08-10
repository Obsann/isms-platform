import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';

/**
 * TODO(Task 25 — Liya): add the Nodemailer transport and read SMTP settings through
 * `ConfigService`.
 * TODO(Task 26 — Liya): document mobile money C2B/B2C webhook contracts in
 * `docs/openapi/`. No live gateway and no USSD this phase (DECISIONS.md D1).
 */
@Module({
  providers: [NotificationService],
  exports: [NotificationService],
})
export class ChannelIntegrationModule {}
