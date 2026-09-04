/// <reference types="jest" />
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { createSmtpTransport, NotificationService, readSmtpValue } from './notification.service';
import { composeNotification, formatMoney } from './notification.templates';

describe('formatMoney', () => {
  it('renders full unabbreviated figures', () => {
    expect(formatMoney('45230.00', 'ETB')).toBe('45,230.00 ETB');
    expect(formatMoney('100.5', 'ETB')).toBe('100.50 ETB');
    expect(formatMoney('0.00', 'ETB')).toBe('0.00 ETB');
  });
});

describe('composeNotification', () => {
  it('composes a deposit receipt with the posted amount and balance', () => {
    const message = composeNotification('deposit-posted', {
      memberName: 'Abebe Kebede Bikila',
      amount: '1500.00',
      currency: 'ETB',
      balanceAfter: '45230.00',
      accountNumber: 'SAV-1001',
      reference: 'DEP-1',
    });
    expect(message.subject).toBe('Deposit of 1,500.00 ETB posted');
    expect(message.text).toContain('Abebe Kebede Bikila');
    expect(message.text).toContain('1,500.00 ETB');
    expect(message.text).toContain('45,230.00 ETB');
    expect(message.text).not.toMatch(/1\.5K|45\.2K/i);
  });

  it('composes a withdrawal receipt', () => {
    const message = composeNotification('withdrawal-posted', {
      memberName: 'Tigist',
      amount: '200.00',
      currency: 'ETB',
      balanceAfter: '800.00',
      accountNumber: 'SAV-1002',
    });
    expect(message.subject).toContain('Withdrawal');
    expect(message.text).toContain('200.00 ETB');
  });

  it('composes a loan-approval notice', () => {
    const message = composeNotification('loan-approved', {
      memberName: 'Abebe',
      loanNumber: 'LN-2026-100',
      amount: '10000.00',
      currency: 'ETB',
      termMonths: 12,
    });
    expect(message.subject).toBe('Loan LN-2026-100 approved');
    expect(message.text).toContain('10,000.00 ETB');
    expect(message.text).toContain('12 months');
  });

  it('composes a member welcome email with login details', () => {
    const message = composeNotification('member-welcome', {
      memberName: 'Abebe Kebede Bikila',
      email: 'abebe.bikila@tenant-a.dev',
      password: 'Isms-abc123xy9!',
      tenantCode: 'tenant-a',
      saccoName: 'Tsehay Sacco',
      loginUrl: 'http://localhost:3000/login',
    });
    expect(message.subject).toContain('Tsehay Sacco');
    expect(message.text).toContain('abebe.bikila@tenant-a.dev');
    expect(message.text).toContain('Isms-abc123xy9!');
    expect(message.text).toContain('tenant-a');
    expect(message.text).toContain('http://localhost:3000/login');
  });

  it('composes an OTP email', () => {
    const message = composeNotification('otp', {
      code: '482910',
      expirySeconds: 300,
      purpose: 'login',
    });
    expect(message.subject).toContain('login');
    expect(message.text).toContain('482910');
    expect(message.text).toContain('300 seconds');
  });
});

describe('readSmtpValue', () => {
  it('strips wrapping quotes and falls back across aliases', () => {
    const config = {
      get: (key: string) => {
        const values: Record<string, string> = {
          SMTP_HOST: '"smtp.gmail.com"',
          SMTP_PASSWORD: '',
        };
        return values[key];
      },
    } as unknown as ConfigService;

    expect(readSmtpValue(config, 'SMTP_HOST')).toBe('smtp.gmail.com');
    expect(readSmtpValue(config, 'SMTP_PASSWORD', 'SMTP_PASS')).toBe('');
  });
});

describe('NotificationService.send', () => {
  const sendMail = jest.fn();
  const transporter = { sendMail } as unknown as Transporter;

  const config = {
    get: (key: string, fallback?: string) => {
      const values: Record<string, string> = {
        SMTP_FROM: 'isms@test.local',
        SMTP_RETRY_DELAY_MS: '0',
      };
      return values[key] ?? fallback;
    },
  } as unknown as ConfigService;

  beforeEach(() => {
    sendMail.mockReset();
    sendMail.mockResolvedValue({ messageId: 'smtp-1' });
  });

  it('sends through Nodemailer and returns a notification id', async () => {
    const service = new NotificationService(config, transporter);
    const result = await service.send({
      template: 'deposit-posted',
      to: 'member@example.com',
      data: {
        memberName: 'Abebe',
        amount: '100.00',
        currency: 'ETB',
        balanceAfter: '100.00',
        accountNumber: 'SAV-1',
      },
    });

    expect(result.template).toBe('deposit-posted');
    expect(result.notificationId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(sendMail.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        from: 'isms@test.local',
        to: 'member@example.com',
        subject: 'Deposit of 100.00 ETB posted',
      }),
    );
  });

  it('retries a failed SMTP send and succeeds on a later attempt', async () => {
    sendMail.mockRejectedValueOnce(new Error('timeout')).mockResolvedValueOnce({ messageId: 'ok' });
    const service = new NotificationService(config, transporter);

    await expect(
      service.send({
        template: 'otp',
        to: 'member@example.com',
        data: { code: '123456', expirySeconds: 60, purpose: 'verification' },
      }),
    ).resolves.toEqual(expect.objectContaining({ template: 'otp' }));

    expect(sendMail).toHaveBeenCalledTimes(2);
  });

  it('gives up after three failed attempts', async () => {
    sendMail.mockRejectedValue(new Error('connection refused'));
    const service = new NotificationService(config, transporter);

    await expect(
      service.send({
        template: 'withdrawal-posted',
        to: 'member@example.com',
        data: { amount: '10.00', currency: 'ETB', balanceAfter: '0.00' },
      }),
    ).rejects.toThrow(/SMTP send failed after 3 attempts/);

    expect(sendMail).toHaveBeenCalledTimes(3);
  });

  it('throws when SMTP is not configured', async () => {
    const service = new NotificationService(config, null);
    await expect(
      service.send({
        template: 'loan-approved',
        to: 'member@example.com',
        data: { loanNumber: 'LN-1', amount: '1.00', currency: 'ETB' },
      }),
    ).rejects.toThrow(/SMTP is not configured/);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('enqueue swallows send failures so callers are not rejected', async () => {
    sendMail.mockRejectedValue(new Error('down'));
    const service = new NotificationService(config, transporter);
    expect(() =>
      service.enqueue({
        template: 'otp',
        to: 'member@example.com',
        data: { code: '000000', expirySeconds: 30 },
      }),
    ).not.toThrow();
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setImmediate(resolve));
  });

  it('routes every message to SMTP_OVERRIDE_TO when set', async () => {
    const overrideConfig = {
      get: (key: string, fallback?: string) => {
        const values: Record<string, string> = {
          SMTP_FROM: 'isms@test.local',
          SMTP_OVERRIDE_TO: 'inbox@example.com',
          SMTP_RETRY_DELAY_MS: '0',
        };
        return values[key] ?? fallback;
      },
    } as unknown as ConfigService;
    const service = new NotificationService(overrideConfig, transporter);

    await service.send({
      template: 'deposit-posted',
      to: 'member@sacco.example',
      data: { amount: '50.00', currency: 'ETB', balanceAfter: '50.00' },
    });

    expect(sendMail.mock.calls[0][0].to).toBe('inbox@example.com');
    expect(sendMail.mock.calls[0][0].text).toContain('Intended recipient: member@sacco.example');
  });
});

describe('createSmtpTransport', () => {
  it('defaults secure to true when port is 465', () => {
    const spy = jest.spyOn(nodemailer, 'createTransport');
    const config = {
      get: (key: string, fallback?: string) => {
        const values: Record<string, string> = {
          SMTP_HOST: 'smtp.gmail.com',
          SMTP_PORT: '465',
        };
        return values[key] ?? fallback;
      },
    } as unknown as ConfigService;

    createSmtpTransport(config);
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
      }),
    );
    spy.mockRestore();
  });

  it('defaults secure to false when port is 587', () => {
    const spy = jest.spyOn(nodemailer, 'createTransport');
    const config = {
      get: (key: string, fallback?: string) => {
        const values: Record<string, string> = {
          SMTP_HOST: 'smtp.gmail.com',
          SMTP_PORT: '587',
        };
        return values[key] ?? fallback;
      },
    } as unknown as ConfigService;

    createSmtpTransport(config);
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
      }),
    );
    spy.mockRestore();
  });

  it('respects explicit SMTP_SECURE override', () => {
    const spy = jest.spyOn(nodemailer, 'createTransport');
    const config = {
      get: (key: string, fallback?: string) => {
        const values: Record<string, string> = {
          SMTP_HOST: 'smtp.gmail.com',
          SMTP_PORT: '465',
          SMTP_SECURE: 'false',
        };
        return values[key] ?? fallback;
      },
    } as unknown as ConfigService;

    createSmtpTransport(config);
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp.gmail.com',
        port: 465,
        secure: false,
      }),
    );
    spy.mockRestore();
  });
});
