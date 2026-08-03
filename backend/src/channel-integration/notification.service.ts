import { Injectable, NotImplementedException } from '@nestjs/common';
import type { NotificationResult, SendNotificationInput } from './channel-integration.types';

/**
 * Channel Integration vertical — owner: **Liya** (Tasks 25–26).
 *
 * Wraps outbound email (SMTP) so no other module knows the transport. SMTP
 * credentials are read from `process.env` in this module only — never in `frontend/`.
 */
@Injectable()
export class NotificationService {
  send(input: SendNotificationInput): Promise<NotificationResult> {
    throw new NotImplementedException('NotificationService.send is not implemented (Task 25)');
  }
}
