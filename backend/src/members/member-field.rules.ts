import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  type ValidationArguments,
} from 'class-validator';

/**
 * Member registration field rules (Task 10). Names may repeat; member number,
 * national ID / passport / other ID, phone, and email must be unique per tenant.
 */

export const MEMBER_NUMBER_PATTERN = /^MEM-\d{5}$/;
export const NAME_PATTERN = /^[A-Za-z]+$/;
export const NATIONAL_ID_PATTERN = /^FIN \d{4} \d{4} \d{4}$/;
export const PASSPORT_PATTERN = /^(EP|E)\d{6}$/;
export const OTHER_ID_PATTERN = /^[A-Za-z0-9]{4,32}$/;
export const PHONE_PATTERN = /^\+2519[1-9]{8}$/;
export const MEMBER_EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@(gmail|yahoo)\.com$/i;

export const MEMBER_NUMBER_MESSAGE =
  'Member number must be MEM- followed by exactly 5 digits, e.g. MEM-90000';
export const NAME_MESSAGE = 'Names may contain letters only — no numbers, spaces, or symbols';
export const NATIONAL_ID_MESSAGE =
  'National ID must be FIN followed by 12 digits in groups of 4, e.g. FIN 1234 5678 9012';
export const PASSPORT_MESSAGE =
  'Ethiopian passport must be EP or E followed by 6 digits, e.g. EP123456';
export const OTHER_ID_MESSAGE = 'Other ID may contain letters and numbers only (4–32 characters)';
export const PHONE_MESSAGE =
  'Phone must be +2519 followed by 8 digits from 1–9 (no zeros), e.g. +251911234567';
export const EMAIL_MESSAGE = 'Email must end with @gmail.com or @yahoo.com';
export const DOB_MESSAGE = 'Member must be at least 18 years old';
export const MIN_MEMBER_AGE_YEARS = 18;

export function todayIsoDate(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function yesterdayIsoDate(now = new Date()): string {
  const prior = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  return todayIsoDate(prior);
}

export function maxAdultDobIsoDate(now = new Date()): string {
  const adult = new Date(now.getFullYear() - MIN_MEMBER_AGE_YEARS, now.getMonth(), now.getDate());
  return todayIsoDate(adult);
}

export function isDobBeforeToday(iso: string, now = new Date()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return false;
  }
  return iso < todayIsoDate(now);
}

export function isDobAtLeast18(iso: string, now = new Date()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return false;
  }
  return iso <= maxAdultDobIsoDate(now);
}

export function identityError(
  idType: string | undefined,
  nationalId: string | undefined,
): string | null {
  const value = nationalId?.trim() ?? '';
  if (!value) {
    return 'ID number is required';
  }
  if (!idType) {
    return 'Select an ID type when an ID number is provided';
  }
  if (idType === 'national_id' && !NATIONAL_ID_PATTERN.test(value)) {
    return NATIONAL_ID_MESSAGE;
  }
  if (idType === 'passport' && !PASSPORT_PATTERN.test(value)) {
    return PASSPORT_MESSAGE;
  }
  if (idType === 'other' && !OTHER_ID_PATTERN.test(value)) {
    return OTHER_ID_MESSAGE;
  }
  return null;
}

export function normalizeMemberNumber(value: string): string {
  return value.trim().toUpperCase();
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.startsWith('251') && digits.length === 12) {
    return `+${digits}`;
  }
  if (digits.startsWith('9') && digits.length === 9) {
    return `+251${digits}`;
  }
  if (digits.length === 8) {
    return `+2519${digits}`;
  }
  return value.trim();
}

export function normalizeNationalId(idType: string | undefined, value: string): string {
  const trimmed = value.trim().toUpperCase();
  if (idType === 'national_id') {
    const digits = trimmed.replace(/\D/g, '').slice(0, 12);
    if (digits.length !== 12) {
      return trimmed.replace(/-/g, ' ').replace(/^FIN\s*/, 'FIN ').trim();
    }
    return `FIN ${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)}`;
  }
  if (idType === 'passport') {
    return trimmed.replace(/[\s-]/g, '');
  }
  return trimmed.replace(/[^A-Z0-9]/g, '');
}

@ValidatorConstraint({ name: 'isAdultDob', async: false })
export class IsPastDobConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'string' || value === '') {
      return false;
    }
    return isDobAtLeast18(value);
  }

  defaultMessage(): string {
    return DOB_MESSAGE;
  }
}

@ValidatorConstraint({ name: 'memberIdentity', async: false })
export class MemberIdentityConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments): boolean {
    const obj = args.object as { idType?: string; nationalId?: string };
    return identityError(obj.idType, obj.nationalId) === null;
  }

  defaultMessage(args: ValidationArguments): string {
    const obj = args.object as { idType?: string; nationalId?: string };
    return identityError(obj.idType, obj.nationalId) ?? 'Invalid identity document';
  }
}
