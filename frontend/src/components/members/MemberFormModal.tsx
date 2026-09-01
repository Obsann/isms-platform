'use client';

import React, { useMemo, useState } from 'react';
import { AlertCircle, Loader2, X } from 'lucide-react';
import type { CreateMemberPayload } from '@/lib/api-client';
import type { Member } from '@/types';
import {
  DOB_MESSAGE,
  EMAIL_MESSAGE,
  MEMBER_EMAIL_PATTERN,
  MEMBER_NUMBER_MESSAGE,
  NAME_MESSAGE,
  NAME_PATTERN,
  NATIONAL_ID_MESSAGE,
  OTHER_ID_MESSAGE,
  PASSPORT_MESSAGE,
  PHONE_MESSAGE,
  digitsOnly,
  formatFinDisplay,
  isDobAtLeast18,
  lettersOnly,
  maxAdultDobIsoDate,
  memberNumberSuffix,
  nonZeroDigitsOnly,
  parseFinDigits,
  parsePassport,
  parsePhoneLocal,
} from '@/lib/member-field-rules';

type IdType = NonNullable<CreateMemberPayload['idType']>;
type MemberStatus = NonNullable<CreateMemberPayload['status']>;

interface MemberFormModalProps {
  mode: 'create' | 'edit';
  member?: Member | null;
  submitting: boolean;
  formError: string | null;
  onClose: () => void;
  onSubmit: (payload: CreateMemberPayload, original?: Member | null) => void;
}

interface FormState {
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  idType: IdType;
  finDigits: string;
  passportPrefix: 'EP' | 'E';
  passportDigits: string;
  otherId: string;
  memberSuffix: string;
  phoneLocal: string;
  email: string;
  status: MemberStatus;
}

function fromMember(member?: Member | null): FormState {
  const passport = parsePassport(member?.nationalId);
  return {
    firstName: member?.firstName ?? '',
    middleName: member?.middleName ?? '',
    lastName: member?.lastName ?? '',
    dateOfBirth: member?.dateOfBirth ?? '',
    idType: member?.idType ?? 'national_id',
    finDigits: parseFinDigits(member?.nationalId),
    passportPrefix: passport.prefix,
    passportDigits: passport.digits,
    otherId: member?.idType === 'other' ? (member.nationalId ?? '') : '',
    memberSuffix: memberNumberSuffix(member?.memberNumber),
    phoneLocal: parsePhoneLocal(member?.phone),
    email: member?.email ?? '',
    status: member?.status ?? 'active',
  };
}

function composedNationalId(form: FormState): string {
  if (form.idType === 'national_id') {
    return form.finDigits.length === 12 ? formatFinDisplay(form.finDigits) : '';
  }
  if (form.idType === 'passport') {
    return form.passportDigits.length === 6 ? `${form.passportPrefix}${form.passportDigits}` : '';
  }
  return form.otherId.trim().toUpperCase();
}

function composedPhone(form: FormState): string {
  return form.phoneLocal.length === 8 ? `+2519${form.phoneLocal}` : '';
}

export default function MemberFormModal({
  mode,
  member,
  submitting,
  formError,
  onClose,
  onSubmit,
}: MemberFormModalProps) {
  const [form, setForm] = useState<FormState>(() => fromMember(member));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const maxDob = useMemo(() => maxAdultDobIsoDate(), []);

  const title = mode === 'edit' ? 'Edit Member' : 'Register New Member';

  const validate = (): Record<string, string> => {
    const next: Record<string, string> = {};
    if (!NAME_PATTERN.test(form.firstName)) next.firstName = NAME_MESSAGE;
    if (!form.middleName) next.middleName = 'Middle name is required';
    else if (!NAME_PATTERN.test(form.middleName)) next.middleName = NAME_MESSAGE;
    if (!NAME_PATTERN.test(form.lastName)) next.lastName = NAME_MESSAGE;
    if (!/^\d{5}$/.test(form.memberSuffix)) next.memberNumber = MEMBER_NUMBER_MESSAGE;
    if (!form.dateOfBirth) next.dateOfBirth = 'Date of birth is required';
    else if (!isDobAtLeast18(form.dateOfBirth)) next.dateOfBirth = DOB_MESSAGE;
    if (form.idType === 'national_id' && form.finDigits.length !== 12) {
      next.nationalId = NATIONAL_ID_MESSAGE;
    }
    if (form.idType === 'passport' && form.passportDigits.length !== 6) {
      next.nationalId = PASSPORT_MESSAGE;
    }
    if (form.idType === 'other' && !/^[A-Za-z0-9]{4,32}$/.test(form.otherId)) {
      next.nationalId = OTHER_ID_MESSAGE;
    }
    const legacyEmail =
      mode === 'edit' && member?.email === form.email && !MEMBER_EMAIL_PATTERN.test(form.email);
    const composedPhoneValue = composedPhone(form);
    const legacyPhone =
      mode === 'edit' && member?.phone === composedPhoneValue && !/^[1-9]{8}$/.test(form.phoneLocal);

    if (!form.phoneLocal) next.phone = 'Phone number is required';
    else if (!legacyPhone && !/^[1-9]{8}$/.test(form.phoneLocal)) next.phone = PHONE_MESSAGE;
    if (!form.email.trim()) next.email = 'Email is required';
    else if (!legacyEmail && !MEMBER_EMAIL_PATTERN.test(form.email.trim())) next.email = EMAIL_MESSAGE;
    return next;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next = validate();
    setFieldErrors(next);
    if (Object.keys(next).length > 0) return;

    const payload: CreateMemberPayload = {
      memberNumber: `MEM-${form.memberSuffix}`,
      firstName: form.firstName,
      middleName: form.middleName,
      lastName: form.lastName,
      status: form.status,
      nationalId: composedNationalId(form),
      idType: form.idType,
      phone: composedPhone(form),
      email: form.email.trim().toLowerCase(),
      dateOfBirth: form.dateOfBirth,
    };
    onSubmit(payload, member);
  };

  const err = (key: string) => fieldErrors[key];

  return (
    <div
      className="fixed inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl p-6 space-y-5 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-800 dark:text-gold">
              Member Directory
            </span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-serif mt-0.5">{title}</h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {formError && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-900 dark:text-rose-200 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-700 dark:text-rose-400 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-3">
            <h4 className="font-bold text-amber-800 dark:text-gold uppercase tracking-wider text-[11px] border-b border-slate-200/80 dark:border-slate-800 pb-1">
              1. Personal Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  value={form.firstName}
                  onChange={(e) => setForm((p) => ({ ...p, firstName: lettersOnly(e.target.value) }))}
                  placeholder="Abebe"
                  className="w-full h-9 px-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg"
                />
                {err('firstName') && <p className="mt-1 text-[10px] text-rose-600">{err('firstName')}</p>}
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Middle Name *</label>
                <input
                  type="text"
                  required
                  value={form.middleName}
                  onChange={(e) => setForm((p) => ({ ...p, middleName: lettersOnly(e.target.value) }))}
                  placeholder="Kebede"
                  className="w-full h-9 px-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg"
                />
                {err('middleName') && <p className="mt-1 text-[10px] text-rose-600">{err('middleName')}</p>}
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  value={form.lastName}
                  onChange={(e) => setForm((p) => ({ ...p, lastName: lettersOnly(e.target.value) }))}
                  placeholder="Tadesse"
                  className="w-full h-9 px-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg"
                />
                {err('lastName') && <p className="mt-1 text-[10px] text-rose-600">{err('lastName')}</p>}
              </div>
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Date of Birth *</label>
              <input
                type="date"
                required
                max={maxDob}
                value={form.dateOfBirth}
                onChange={(e) => setForm((p) => ({ ...p, dateOfBirth: e.target.value }))}
                className="w-full h-9 px-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg"
              />
              <p className="mt-1 text-[10px] text-slate-500">Must be 18 or older. Dates after {maxDob} are blocked.</p>
              {err('dateOfBirth') && <p className="mt-1 text-[10px] text-rose-600">{err('dateOfBirth')}</p>}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-amber-800 dark:text-gold uppercase tracking-wider text-[11px] border-b border-slate-200/80 dark:border-slate-800 pb-1">
              2. Identification
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">ID Type *</label>
                <select
                  required
                  value={form.idType}
                  onChange={(e) => setForm((p) => ({ ...p, idType: e.target.value as IdType }))}
                  className="w-full h-9 px-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg"
                >
                  <option value="national_id">National ID (Fayda)</option>
                  <option value="passport">Passport</option>
                  <option value="other">Other ID</option>
                </select>
              </div>
              <div>
                {form.idType === 'national_id' && (
                  <>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">National ID *</label>
                    <input
                      type="text"
                      required
                      inputMode="numeric"
                      value={formatFinDisplay(form.finDigits)}
                      onChange={(e) => setForm((p) => ({ ...p, finDigits: digitsOnly(e.target.value.replace(/^FIN/, ''), 12) }))}
                      placeholder="FIN 1234 5678 9012"
                      className="w-full h-9 px-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-sm tracking-tight whitespace-nowrap overflow-x-auto"
                    />
                    <p className="mt-1 text-[10px] text-slate-500 whitespace-nowrap">Format: FIN 1234 5678 9012 (12 digits).</p>
                  </>
                )}
                {form.idType === 'passport' && (
                  <>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Passport number *</label>
                    <div className="flex gap-2">
                      <select
                        required
                        value={form.passportPrefix}
                        onChange={(e) => setForm((p) => ({ ...p, passportPrefix: e.target.value as 'EP' | 'E' }))}
                        className="h-9 px-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono w-20 shrink-0"
                      >
                        <option value="EP">EP</option>
                        <option value="E">E</option>
                      </select>
                      <input
                        type="text"
                        required
                        inputMode="numeric"
                        value={form.passportDigits}
                        onChange={(e) => setForm((p) => ({ ...p, passportDigits: digitsOnly(e.target.value, 6) }))}
                        placeholder="123456"
                        className="flex-1 min-w-0 h-9 px-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono"
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-slate-500">EP or E followed by 6 digits.</p>
                  </>
                )}
                {form.idType === 'other' && (
                  <>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Other ID *</label>
                    <input
                      type="text"
                      required
                      value={form.otherId}
                      onChange={(e) => setForm((p) => ({ ...p, otherId: e.target.value.replace(/[^A-Za-z0-9]/g, '') }))}
                      placeholder="Letters and numbers only"
                      className="w-full h-9 px-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono"
                    />
                  </>
                )}
                {err('nationalId') && <p className="mt-1 text-[10px] text-rose-600">{err('nationalId')}</p>}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-amber-800 dark:text-gold uppercase tracking-wider text-[11px] border-b border-slate-200/80 dark:border-slate-800 pb-1">
              3. Contact &amp; Membership
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Member Number *</label>
                <div className="flex">
                  <span className="inline-flex items-center px-2.5 h-9 rounded-l-lg border border-r-0 border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 font-mono font-bold text-slate-600">
                    MEM-
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    minLength={5}
                    maxLength={5}
                    value={form.memberSuffix}
                    onChange={(e) => setForm((p) => ({ ...p, memberSuffix: digitsOnly(e.target.value, 5) }))}
                    placeholder="90000"
                    className="flex-1 h-9 px-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-r-lg font-mono"
                  />
                </div>
                <p className="mt-1 text-[10px] text-slate-500">Exactly 5 digits. Example MEM-90000.</p>
                {err('memberNumber') && <p className="mt-1 text-[10px] text-rose-600">{err('memberNumber')}</p>}
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Phone Number *</label>
                <div className="flex">
                  <span className="inline-flex items-center px-2.5 h-9 rounded-l-lg border border-r-0 border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 font-mono font-bold text-slate-600">
                    +251 9
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    minLength={8}
                    maxLength={8}
                    value={form.phoneLocal}
                    onChange={(e) => setForm((p) => ({ ...p, phoneLocal: nonZeroDigitsOnly(e.target.value, 8) }))}
                    placeholder="11234567"
                    className="flex-1 h-9 px-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-r-lg font-mono"
                  />
                </div>
                <p className="mt-1 text-[10px] text-slate-500">8 digits, 1–9 only. Zeros are rejected.</p>
                {err('phone') && <p className="mt-1 text-[10px] text-rose-600">{err('phone')}</p>}
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value.replace(/\s/g, '') }))}
                  placeholder="name@gmail.com"
                  className="w-full h-9 px-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg"
                />
                <p className="mt-1 text-[10px] text-slate-500">Must be @gmail.com or @yahoo.com.</p>
                {err('email') && <p className="mt-1 text-[10px] text-rose-600">{err('email')}</p>}
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Status *</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as MemberStatus }))}
                  className="w-full h-9 px-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg"
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-200/80 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl bg-midnight text-gold hover:bg-midnight-light dark:bg-gold dark:text-midnight font-bold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : mode === 'edit' ? (
                'Save Changes'
              ) : (
                'Complete Registration'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
