import type { NotificationTemplate } from './channel-integration.types';

export interface ComposedMessage {
  subject: string;
  text: string;
  html: string;
}

/**
 * Compose subject/body for a notification template. Amounts stay full decimal
 * figures (never abbreviated) — same rule as the rest of the platform.
 */
export function composeNotification(
  template: NotificationTemplate,
  data: Record<string, string | number>,
): ComposedMessage {
  switch (template) {
    case 'deposit-posted':
      return composeDeposit(data);
    case 'withdrawal-posted':
      return composeWithdrawal(data);
    case 'loan-approved':
      return composeLoanApproved(data);
    case 'otp':
      return composeOtp(data);
  }
}

function composeDeposit(data: Record<string, string | number>): ComposedMessage {
  const memberName = field(data, 'memberName', 'member');
  const money = formatMoney(field(data, 'amount'), field(data, 'currency', 'ETB'));
  const balance = formatMoney(field(data, 'balanceAfter'), field(data, 'currency', 'ETB'));
  const accountNumber = field(data, 'accountNumber', 'your account');
  const reference = field(data, 'reference');

  const subject = `Deposit of ${money} posted`;
  const text = [
    `Hello ${memberName},`,
    '',
    `A deposit of ${money} has been posted to ${accountNumber}.`,
    `Your new balance is ${balance}.`,
    reference ? `Reference: ${reference}` : '',
    '',
    'If you did not expect this transaction, contact your SACCO office.',
  ]
    .filter((line, i, lines) => line !== '' || (i > 0 && lines[i - 1] !== ''))
    .join('\n');

  return { subject, text, html: toHtml(subject, text) };
}

function composeWithdrawal(data: Record<string, string | number>): ComposedMessage {
  const memberName = field(data, 'memberName', 'member');
  const money = formatMoney(field(data, 'amount'), field(data, 'currency', 'ETB'));
  const balance = formatMoney(field(data, 'balanceAfter'), field(data, 'currency', 'ETB'));
  const accountNumber = field(data, 'accountNumber', 'your account');
  const reference = field(data, 'reference');

  const subject = `Withdrawal of ${money} posted`;
  const text = [
    `Hello ${memberName},`,
    '',
    `A withdrawal of ${money} has been posted from ${accountNumber}.`,
    `Your new balance is ${balance}.`,
    reference ? `Reference: ${reference}` : '',
    '',
    'If you did not expect this transaction, contact your SACCO office.',
  ]
    .filter((line, i, lines) => line !== '' || (i > 0 && lines[i - 1] !== ''))
    .join('\n');

  return { subject, text, html: toHtml(subject, text) };
}

function composeLoanApproved(data: Record<string, string | number>): ComposedMessage {
  const memberName = field(data, 'memberName', 'member');
  const loanNumber = field(data, 'loanNumber', 'your loan');
  const money = formatMoney(field(data, 'amount'), field(data, 'currency', 'ETB'));
  const termMonths = field(data, 'termMonths');

  const subject = `Loan ${loanNumber} approved`;
  const termLine = termMonths ? `Term: ${termMonths} months.` : '';
  const text = [
    `Hello ${memberName},`,
    '',
    `Your loan application ${loanNumber} for ${money} has been approved.`,
    termLine,
    '',
    'Funds will be available after disbursement. Contact your SACCO office with any questions.',
  ]
    .filter((line) => line !== '')
    .join('\n');

  return { subject, text, html: toHtml(subject, text) };
}

function composeOtp(data: Record<string, string | number>): ComposedMessage {
  const code = field(data, 'code');
  const expirySeconds = field(data, 'expirySeconds', '300');
  const purpose = field(data, 'purpose', 'verification');

  const subject = `Your ${purpose} code`;
  const text = [
    `Your one-time ${purpose} code is ${code}.`,
    `It expires in ${expirySeconds} seconds.`,
    '',
    'Do not share this code with anyone. SACCO staff will never ask you for it.',
  ].join('\n');

  return { subject, text, html: toHtml(subject, text) };
}

export function formatMoney(amount: string, currency: string): string {
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(amount.trim());
  if (!match) {
    return currency ? `${amount} ${currency}` : amount;
  }
  const sign = match[1];
  const whole = match[2];
  const frac = match[3] ?? '';
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const figure = `${sign}${grouped}.${frac.padEnd(2, '0')}`;
  return currency ? `${figure} ${currency}` : figure;
}

function field(
  data: Record<string, string | number>,
  key: string,
  fallback = '',
): string {
  const value = data[key];
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  return String(value);
}

function toHtml(subject: string, text: string): string {
  const paragraphs = text
    .split('\n')
    .map((line) => (line === '' ? '<br />' : `<p>${escapeHtml(line)}</p>`))
    .join('');
  return `<!DOCTYPE html>
<html>
  <body>
    <h1>${escapeHtml(subject)}</h1>
    ${paragraphs}
  </body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
