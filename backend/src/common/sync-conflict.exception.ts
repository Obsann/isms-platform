import { ConflictException } from '@nestjs/common';

/**
 * Raised when an idempotency key (`reference`) was already used for a different
 * payload. The teller device should surface this as a reviewable exception, not
 * silently resolve it (Task 15).
 */
export class SyncConflictException extends ConflictException {
  constructor(message = 'This payment reference was already used for a different transaction. Review required on the teller device.') {
    super({
      statusCode: 409,
      message,
      error: 'SyncConflict',
    });
  }
}
