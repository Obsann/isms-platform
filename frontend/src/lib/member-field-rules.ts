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
  'Enter 8 digits from 1–9 after +2519. Zeros are not allowed.';
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
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  return iso < todayIsoDate(now);
}

export function isDobAtLeast18(iso: string, now = new Date()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  return iso <= maxAdultDobIsoDate(now);
}

export function lettersOnly(value: string): string {
  return value.replace(/[^A-Za-z]/g, '');
}

export function digitsOnly(value: string, max: number): string {
  return value.replace(/\D/g, '').slice(0, max);
}

export function nonZeroDigitsOnly(value: string, max: number): string {
  return value.replace(/[^1-9]/g, '').slice(0, max);
}

export function formatFinDisplay(digits: string): string {
  const d = digits.replace(/\D/g, '').slice(0, 12);
  const a = d.slice(0, 4);
  const b = d.slice(4, 8);
  const c = d.slice(8, 12);
  return ['FIN', a, b, c].filter(Boolean).join(' ');
}

export function parseFinDigits(nationalId: string | null | undefined): string {
  if (!nationalId) return '';
  return nationalId.replace(/\D/g, '').slice(0, 12);
}

export function parsePhoneLocal(phone: string | null | undefined): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('2519') && digits.length >= 12) {
    return digits.slice(4, 12);
  }
  if (digits.startsWith('9') && digits.length >= 9) {
    return digits.slice(1, 9);
  }
  return digits.slice(-8);
}

export function parsePassport(nationalId: string | null | undefined): { prefix: 'EP' | 'E'; digits: string } {
  const raw = (nationalId ?? '').toUpperCase().replace(/[\s-]/g, '');
  if (raw.startsWith('EP')) {
    return { prefix: 'EP', digits: raw.slice(2).replace(/\D/g, '').slice(0, 6) };
  }
  if (raw.startsWith('E')) {
    return { prefix: 'E', digits: raw.slice(1).replace(/\D/g, '').slice(0, 6) };
  }
  return { prefix: 'EP', digits: raw.replace(/\D/g, '').slice(0, 6) };
}

export function memberNumberSuffix(memberNumber: string | null | undefined): string {
  const match = (memberNumber ?? '').toUpperCase().match(/^MEM-(\d{0,5})$/);
  return match ? match[1] : '';
}
