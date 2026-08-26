'use client';

import React, { useState } from "react";
import { AlertTriangle, ChevronDown, Check, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { MemberRecord } from "@/types/dashboard";

interface FormFieldGroupProps {
  onAddMember?: (newMember: Partial<MemberRecord>) => void;
  label?: string;
  htmlFor?: string;
  required?: boolean;
  tooltip?: string;
  helperText?: string;
  error?: string;
  className?: string;
  children?: React.ReactNode;
}

export function FormFieldGroup({
  onAddMember,
  label,
  htmlFor,
  required,
  tooltip,
  helperText,
  error,
  className,
  children,
}: FormFieldGroupProps) {
  // If used as a wrapper component for form fields
  if (label || children) {
    return (
      <div className={cn("flex flex-col gap-1.5 w-full", className)}>
        {label && (
          <div className="flex items-center justify-between">
            <label
              htmlFor={htmlFor}
              className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1"
            >
              {label}
              {required && (
                <span className="text-amber-600 dark:text-amber-400 font-bold text-xs leading-none" aria-hidden="true">*</span>
              )}
            </label>
            {tooltip && (
              <span
                className="text-[11px] text-slate-500 dark:text-slate-400 cursor-help hover:text-slate-800 dark:hover:text-slate-200 transition-colors inline-flex items-center gap-1"
                title={tooltip}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" />
                </svg>
              </span>
            )}
          </div>
        )}
        <div
          className={cn(
            "[&>input]:w-full [&>input]:px-3 [&>input]:py-2 [&>input]:rounded-lg",
            "[&>input]:border [&>input]:text-sm [&>input]:font-medium [&>input]:text-slate-900 dark:[&>input]:text-slate-100",
            "[&>input]:bg-white dark:[&>input]:bg-slate-900/90 [&>input]:outline-none [&>input]:transition-all",
            "[&>input]:placeholder:text-slate-400 dark:[&>input]:placeholder:text-slate-500",
            "[&>textarea]:w-full [&>textarea]:px-3 [&>textarea]:py-2 [&>textarea]:rounded-lg",
            "[&>textarea]:border [&>textarea]:text-sm [&>textarea]:font-medium [&>textarea]:text-slate-900 dark:[&>textarea]:text-slate-100",
            "[&>textarea]:bg-white dark:[&>textarea]:bg-slate-900/90 [&>textarea]:outline-none [&>textarea]:transition-all [&>textarea]:resize-y",
            "[&>textarea]:placeholder:text-slate-400 dark:[&>textarea]:placeholder:text-slate-500",
            "[&>select]:w-full [&>select]:px-3 [&>select]:py-2 [&>select]:rounded-lg",
            "[&>select]:border [&>select]:text-sm [&>select]:font-medium [&>select]:text-slate-900 dark:[&>select]:text-slate-100",
            "[&>select]:bg-white dark:[&>select]:bg-slate-900/90 [&>select]:outline-none [&>select]:transition-all",
            error
              ? [
                  "[&>input]:border-rose-400 dark:[&>input]:border-rose-700 [&>input]:ring-2 [&>input]:ring-rose-100 dark:[&>input]:ring-rose-900/30",
                  "[&>textarea]:border-rose-400 dark:[&>textarea]:border-rose-700 [&>textarea]:ring-2 [&>textarea]:ring-rose-100 dark:[&>textarea]:ring-rose-900/30",
                  "[&>select]:border-rose-400 dark:[&>select]:border-rose-700 [&>select]:ring-2 [&>select]:ring-rose-100 dark:[&>select]:ring-rose-900/30",
                ]
              : [
                  "[&>input]:border-slate-300 dark:[&>input]:border-slate-700 [&>input]:focus:border-gold dark:[&>input]:focus:border-gold [&>input]:focus:ring-2 [&>input]:focus:ring-amber-100 dark:[&>input]:focus:ring-amber-500/20",
                  "[&>textarea]:border-slate-300 dark:[&>textarea]:border-slate-700 [&>textarea]:focus:border-gold dark:[&>textarea]:focus:border-gold [&>textarea]:focus:ring-2 [&>textarea]:focus:ring-amber-100 dark:[&>textarea]:focus:ring-amber-500/20",
                  "[&>select]:border-slate-300 dark:[&>select]:border-slate-700 [&>select]:focus:border-gold dark:[&>select]:focus:border-gold [&>select]:focus:ring-2 [&>select]:focus:ring-amber-100 dark:[&>select]:focus:ring-amber-500/20",
                ]
          )}
        >
          {children}
        </div>
        {helperText && !error && (
          <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed">{helperText}</p>
        )}
        {error && (
          <p className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        )}
      </div>
    );
  }

  // Original Form Field Group Component from UI original change
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("09");
  const [idType, setIdType] = useState("National ID");
  const [idNumber, setIdNumber] = useState("");
  const [initialDeposit, setInitialDeposit] = useState("");
  const [showIdDropdown, setShowIdDropdown] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const cleanPhone = phoneNumber.replace(/\s+/g, "");
  const isPhoneValid = /^(09|07)\d{8}$/.test(cleanPhone);
  const hasPhoneError = phoneNumber.length > 0 && !isPhoneValid;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(e.target.value);
  };

  const idOptions = ["National ID", "Passport", "Driver's License", "Kebele Resident ID"];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    const depositNum = parseFloat(initialDeposit) || 500;

    if (onAddMember) {
      onAddMember({
        id: `M-${Date.now().toString().slice(-3)}`,
        name: fullName.trim(),
        avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80`,
        memberId: `M-00${Math.floor(Math.random() * 90) + 10}`,
        savingAmount: depositNum,
        status: depositNum >= 5000 ? "Approved" : "In Progress",
        phone: phoneNumber,
        idType: idType,
        idNumber: idNumber || `FAN-${Math.floor(100000 + Math.random() * 900000)}`,
      });
    }

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setFullName("");
      setPhoneNumber("09");
      setIdNumber("");
      setInitialDeposit("");
    }, 2000);
  };

  return (
    <div
      id="form-field-group-card"
      className="bg-[#23242a] border border-[#2e303a] rounded-2xl p-5 sm:p-6 shadow-md flex flex-col justify-between"
    >
      <div className="flex items-center justify-between mb-3.5">
        <h3 className="text-sm sm:text-base font-semibold text-[#2dd4bf] tracking-tight">
          Form Field Group
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 text-xs">
        {/* Full name input */}
        <div className="space-y-1">
          <label htmlFor="input-full-name" className="block text-[11px] font-medium text-[#9ca3af]">
            Full name
          </label>
          <input
            id="input-full-name"
            type="text"
            placeholder="e.g. Hirut Bekele"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full bg-[#1c1d22] border border-[#2e303a] rounded-lg px-3 py-2 text-xs text-white placeholder-[#525765] focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 transition-all"
          />
        </div>

        {/* Phone number input */}
        <div className="space-y-1">
          <label htmlFor="input-phone-number" className="block text-[11px] font-medium text-[#9ca3af]">
            Phone number
          </label>
          <div className="relative">
            <input
              id="input-phone-number"
              type="text"
              placeholder="09xx xxx xxx"
              value={phoneNumber}
              onChange={handlePhoneChange}
              className={cn(
                "w-full rounded-lg px-3 py-2 text-xs font-mono transition-all focus:outline-hidden",
                hasPhoneError
                  ? "bg-[#281417] border border-[#ef4444] text-[#fca5a5] placeholder-[#7f262e] focus:ring-1 focus:ring-red-500/30"
                  : "bg-[#1c1d22] border border-[#2e303a] text-white placeholder-[#525765] focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20"
              )}
            />
          </div>

          {hasPhoneError && (
            <div id="phone-error-message" className="flex items-center gap-1.5 text-[10px] text-[#ef4444] font-medium pt-0.5">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              <span>Enter a valid 10-digit phone number</span>
            </div>
          )}
        </div>

        {/* ID type dropdown */}
        <div className="space-y-1 relative">
          <label htmlFor="select-id-type" className="block text-[11px] font-medium text-[#9ca3af]">
            ID
          </label>
          <button
            type="button"
            id="select-id-type"
            onClick={() => setShowIdDropdown(!showIdDropdown)}
            className="w-full bg-[#1c1d22] border border-[#2e303a] rounded-lg px-3 py-2 text-xs text-left text-white flex items-center justify-between hover:border-[#3d414f] transition-all focus:outline-hidden focus:border-sky-500"
          >
            <span>{idType}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#717888]" />
          </button>

          {showIdDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#1c1d22] border border-[#353844] rounded-lg shadow-xl py-1 z-30">
              {idOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    setIdType(opt);
                    setShowIdDropdown(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center justify-between",
                    idType === opt
                      ? "text-sky-400 bg-sky-500/10 font-medium"
                      : "text-[#9ca3af] hover:text-white hover:bg-[#282a32]"
                  )}
                >
                  <span>{opt}</span>
                  {idType === opt && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ID number */}
        <div className="space-y-1">
          <label htmlFor="input-id-number" className="block text-[11px] font-medium text-[#9ca3af]">
            ID number
          </label>
          <input
            id="input-id-number"
            type="text"
            placeholder="e.g. FAN-0012345"
            value={idNumber}
            onChange={(e) => setIdNumber(e.target.value)}
            className="w-full bg-[#1c1d22] border border-[#2e303a] rounded-lg px-3 py-2 text-xs text-white placeholder-[#525765] focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 font-mono transition-all"
          />
        </div>

        {/* Initial deposit */}
        <div className="space-y-1">
          <label htmlFor="input-initial-deposit" className="block text-[11px] font-medium text-[#9ca3af]">
            Initial deposit (ETB)
          </label>
          <input
            id="input-initial-deposit"
            type="number"
            step="50"
            placeholder="0.00"
            value={initialDeposit}
            onChange={(e) => setInitialDeposit(e.target.value)}
            className="w-full bg-[#1c1d22] border border-[#2e303a] rounded-lg px-3 py-2 text-xs text-white placeholder-[#525765] focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 font-mono transition-all"
          />
          <p className="text-[10px] text-[#6b7280]">
            Minimum opening deposit is 500.00 ETB.
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-1">
          <button
            type="submit"
            id="btn-submit-member-form"
            className={cn(
              "w-full py-2 px-3.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-sm",
              isSuccess
                ? "bg-emerald-600 text-white"
                : "bg-gradient-to-r from-teal-500 to-sky-600 hover:from-teal-400 hover:to-sky-500 text-white"
            )}
          >
            {isSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Member Enrolled Successfully</span>
              </>
            ) : (
              <>
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register Member</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default FormFieldGroup;
