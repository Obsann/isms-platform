import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import nodemailer from 'nodemailer';
import type { SentMessageInfo, Transporter } from 'nodemailer';
import type { NotificationResult, SendNotificationInput } from './channel-integration.types';
import { composeNotification } from './notification.templates';

/** Nest token for the Nodemailer transport — not part of the module's public surface. */
export const SMTP_TRANSPORT = Symbol('SMTP_TRANSPORT');

const MAX_SEND_ATTEMPTS = 3;

/**
 * Channel Integration vertical — Task 25.
 *
 * Wraps outbound email (SMTP / Nodemailer) so no other module knows the transport.
 * SMTP credentials are read from `process.env` in this module only — never in `frontend/`.
 *
 * Email stands in for the SMS/WhatsApp gateway this phase. A failed send is logged
 * and retried a bounded number of times; callers should not fail the originating
 * deposit / withdrawal / approval if delivery does not go through.
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly config: ConfigService,
    @Optional() @Inject(SMTP_TRANSPORT) private readonly transporter: Transporter | null,
  ) {
    if (!this.transporter) {
      this.logger.warn(
        'SMTP is not configured — deposit, withdrawal, loan-approval, and OTP emails will not send',
      );
    } else {
      this.logger.log('SMTP transport ready');
    }
  }

  isConfigured(): boolean {
    return Boolean(this.transporter);
  }

  /**
   * Send a transactional email. Awaits SMTP (with retries). Prefer {@link enqueue}
   * from deposit / withdrawal / approval paths so a slow mailbox does not stall
   * the HTTP response.
   */
  async send(input: SendNotificationInput): Promise<NotificationResult> {
    if (!this.transporter) {
      throw new Error('SMTP is not configured (set SMTP_HOST in backend/.env)');
    }

    const from = this.config.get<string>('SMTP_FROM')?.trim() || this.config.get<string>('SMTP_USER')?.trim();
    if (!from) {
      throw new Error('SMTP_FROM (or SMTP_USER) must be set to send notifications');
    }

    const overrideTo = this.config.get<string>('SMTP_OVERRIDE_TO')?.trim();
    const recipient = overrideTo || input.to;
    if (!recipient) {
      throw new Error('Notification recipient email is empty');
    }

    const composed = composeNotification(input.template, input.data);
    const intendedNote =
      overrideTo && overrideTo !== input.to ? `Intended recipient: ${input.to}\n\n` : '';

    const mail = {
      from,
      to: recipient,
      subject: composed.subject,
      text: `${intendedNote}${composed.text}`,
      html: intendedNote
        ? `<p>${escapeHtml(intendedNote.trim())}</p>${composed.html}`
        : composed.html,
    };

    const info = await this.sendWithRetry(mail);
    const preview = nodemailer.getTestMessageUrl(info);
    if (preview) {
      this.logger.log(`Email preview (Ethereal): ${preview}`);
    }

    const result: NotificationResult = {
      notificationId: randomUUID(),
      template: input.template,
      sentAt: new Date().toISOString(),
    };

    this.logger.log(`Sent ${input.template} notification ${result.notificationId} to ${recipient}`);
    return result;
  }

  /**
   * Fire-and-forget send so a deposit/withdrawal/approval is not blocked or
   * rolled back if SMTP is down. Failures are retried inside {@link send}, then logged.
   */
  enqueue(input: SendNotificationInput): void {
    void this.send(input).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Failed to send ${input.template}: ${message}`);
    });
  }

  private async sendWithRetry(mail: {
    from: string;
    to: string;
    subject: string;
    text: string;
    html: string;
  }): Promise<SentMessageInfo> {
    const delayMs = Number(this.config.get<string>('SMTP_RETRY_DELAY_MS', '400'));
    let lastError: unknown;

    for (let attempt = 1; attempt <= MAX_SEND_ATTEMPTS; attempt++) {
      try {
        return await this.transporter!.sendMail(mail);
      } catch (err) {
        lastError = err;
        const message = err instanceof Error ? err.message : String(err);
        this.logger.warn(`SMTP send attempt ${attempt}/${MAX_SEND_ATTEMPTS} failed: ${message}`);
        if (attempt < MAX_SEND_ATTEMPTS) {
          await wait(Number.isFinite(delayMs) ? delayMs : 400);
        }
      }
    }

    const message = lastError instanceof Error ? lastError.message : String(lastError);
    throw new Error(`SMTP send failed after ${MAX_SEND_ATTEMPTS} attempts: ${message}`);
  }
}

export function createSmtpTransport(config: ConfigService): Transporter | null {
  const host = readSmtpValue(config, 'SMTP_HOST');
  if (!host) {
    return null;
  }

  const port = Number(readSmtpValue(config, 'SMTP_PORT') || '587');
  const resolvedPort = Number.isFinite(port) ? port : 587;
  const secureFlag = readSmtpValue(config, 'SMTP_SECURE');
  const secure = secureFlag ? secureFlag === 'true' : resolvedPort === 465;
  const user = readSmtpValue(config, 'SMTP_USER');
  const pass = readSmtpValue(config, 'SMTP_PASSWORD', 'SMTP_PASS');

  return nodemailer.createTransport({
    host,
    port: resolvedPort,
    secure,
    auth: user ? { user, pass } : undefined,
  });
}

/** ConfigService, then process.env. Strips wrapping quotes from `.env` values. */
export function readSmtpValue(config: ConfigService, ...keys: string[]): string {
  for (const key of keys) {
    const raw = config.get<string>(key) ?? process.env[key] ?? '';
    const value = raw.trim().replace(/^['"]|['"]$/g, '');
    if (value) {
      return value;
    }
  }
  return '';
}

function wait(ms: number): Promise<void> {
  if (ms <= 0) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
