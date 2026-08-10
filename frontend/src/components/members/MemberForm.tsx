"use client";

import React, { useState } from "react";
import FormFieldGroup from "@/components/forms/FormFieldGroup";
import { Button } from "@/components/ui/button";
import type { CreateMemberPayload } from "@/lib/api-client";

interface MemberFormValues {
  memberNumber: string;
  firstName: string;
  middleName: string;
  lastName: string;
  nationalId: string;
  idType: "national_id" | "passport" | "other" | "";
  phone: string;
  email: string;
  dateOfBirth: string;
  status: "pending" | "active" | "inactive";
  joinedAt: string;
}

interface MemberFormProps {
  initialValues?: Partial<MemberFormValues>;
  onSubmit: (values: CreateMemberPayload) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
  onCancel?: () => void;
}

export const MemberForm: React.FC<MemberFormProps> = ({
  initialValues,
  onSubmit,
  isLoading = false,
  submitLabel = "Register Member",
  onCancel,
}) => {
  const [values, setValues] = useState<MemberFormValues>({
    memberNumber: initialValues?.memberNumber ?? "",
    firstName: initialValues?.firstName ?? "",
    middleName: initialValues?.middleName ?? "",
    lastName: initialValues?.lastName ?? "",
    nationalId: initialValues?.nationalId ?? "",
    idType: initialValues?.idType ?? "",
    phone: initialValues?.phone ?? "",
    email: initialValues?.email ?? "",
    dateOfBirth: initialValues?.dateOfBirth ?? "",
    status: initialValues?.status ?? "pending",
    joinedAt: initialValues?.joinedAt ?? "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof MemberFormValues, string>>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const handleChange = (key: keyof MemberFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof MemberFormValues, string>> = {};

    if (!values.memberNumber.trim()) {
      newErrors.memberNumber = "Member number is required";
    }
    if (!values.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!values.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validate()) {
      return;
    }

    try {
      const payload: CreateMemberPayload = {
        memberNumber: values.memberNumber.trim(),
        firstName: values.firstName.trim(),
        middleName: values.middleName.trim() || undefined,
        lastName: values.lastName.trim(),
        nationalId: values.nationalId.trim() || undefined,
        idType: values.idType ? (values.idType as "national_id" | "passport" | "other") : undefined,
        phone: values.phone.trim() || undefined,
        email: values.email.trim() || undefined,
        dateOfBirth: values.dateOfBirth || undefined,
        status: values.status,
        joinedAt: values.joinedAt || undefined,
      };
      await onSubmit(payload);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred. Please try again.";
      setGeneralError(msg);
    }
  };
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8 w-full max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200/80 shadow-card p-8">
      {generalError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-lg font-medium">
          ⚠️ {generalError}
        </div>
      )}

      {/* Section 1: Membership Details */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400 mb-5 border-b border-slate-100 pb-2">
          Membership Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormFieldGroup label="Member Number" required error={errors.memberNumber}>
            <input
              type="text"
              value={values.memberNumber}
              disabled={isLoading || !!initialValues?.memberNumber}
              onChange={(e) => handleChange("memberNumber", e.target.value)}
              placeholder="e.g. MEM-001"
            />
          </FormFieldGroup>

          <FormFieldGroup label="Member Status" required error={errors.status}>
            <select
              value={values.status}
              disabled={isLoading}
              onChange={(e) => handleChange("status", e.target.value)}
            >
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </FormFieldGroup>

          <FormFieldGroup label="Joined Date" error={errors.joinedAt}>
            <input
              type="date"
              value={values.joinedAt}
              disabled={isLoading}
              onChange={(e) => handleChange("joinedAt", e.target.value)}
            />
          </FormFieldGroup>
        </div>
      </div>

      {/* Section 2: Personal Information */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400 mb-5 border-b border-slate-100 pb-2">
          Personal Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormFieldGroup label="First Name" required error={errors.firstName}>
            <input
              type="text"
              value={values.firstName}
              disabled={isLoading}
              onChange={(e) => handleChange("firstName", e.target.value)}
              placeholder="e.g. Abebe"
            />
          </FormFieldGroup>

          <FormFieldGroup label="Middle Name" error={errors.middleName}>
            <input
              type="text"
              value={values.middleName}
              disabled={isLoading}
              onChange={(e) => handleChange("middleName", e.target.value)}
              placeholder="e.g. Bikila"
            />
          </FormFieldGroup>

          <FormFieldGroup label="Last Name" required error={errors.lastName}>
            <input
              type="text"
              value={values.lastName}
              disabled={isLoading}
              onChange={(e) => handleChange("lastName", e.target.value)}
              placeholder="e.g. Kebede"
            />
          </FormFieldGroup>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <FormFieldGroup label="Date of Birth" error={errors.dateOfBirth}>
            <input
              type="date"
              value={values.dateOfBirth}
              disabled={isLoading}
              onChange={(e) => handleChange("dateOfBirth", e.target.value)}
            />
          </FormFieldGroup>
        </div>
      </div>

      {/* Section 3: Identity Capture */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400 mb-5 border-b border-slate-100 pb-2">
          Identification (Stored Capture Only)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormFieldGroup label="ID Type" error={errors.idType}>
            <select
              value={values.idType}
              disabled={isLoading}
              onChange={(e) => handleChange("idType", e.target.value)}
            >
              <option value="">No ID provided</option>
              <option value="national_id">National ID</option>
              <option value="passport">Passport</option>
              <option value="other">Other</option>
            </select>
          </FormFieldGroup>

          <FormFieldGroup label="ID / National ID Number" error={errors.nationalId}>
            <input
              type="text"
              value={values.nationalId}
              disabled={isLoading}
              onChange={(e) => handleChange("nationalId", e.target.value)}
              placeholder="e.g. ET-123456789"
            />
          </FormFieldGroup>
        </div>
      </div>

      {/* Section 4: Contact Information */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400 mb-5 border-b border-slate-100 pb-2">
          Contact Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormFieldGroup label="Phone Number" error={errors.phone}>
            <input
              type="tel"
              value={values.phone}
              disabled={isLoading}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="e.g. +251 911 234 567"
            />
          </FormFieldGroup>

          <FormFieldGroup label="Email Address" error={errors.email}>
            <input
              type="email"
              value={values.email}
              disabled={isLoading}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="e.g. member@sacco.org"
            />
          </FormFieldGroup>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 border-t border-slate-100 pt-6 mt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="default"
          size="lg"
          className="bg-midnight hover:bg-midnight/90 text-gold font-semibold px-8"
          disabled={isLoading}
        >
          {isLoading ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
};

export default MemberForm;
