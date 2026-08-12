import React from "react";
import { cn } from "@/lib/utils";

export interface FormFieldGroupProps {
  label?: string;
  htmlFor?: string;
  required?: boolean;
  tooltip?: string;
  helperText?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormFieldGroup: React.FC<FormFieldGroupProps> = ({
  label,
  htmlFor,
  required,
  tooltip,
  helperText,
  error,
  children,
  className,
}) => {
  return (
    <div className={cn("flex flex-col gap-2 w-full", className)}>
      {label && (
        <div className="flex items-center justify-between">
          <label
            htmlFor={htmlFor}
            className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 flex items-center gap-1.5"
          >
            {label}
            {required && (
              <span className="text-amber-500 font-bold text-xs leading-none" aria-hidden="true">*</span>
            )}
          </label>
          {tooltip && (
            <span
              className="text-[11px] text-slate-400 cursor-help hover:text-slate-600 transition-colors inline-flex items-center gap-1"
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
          "[&>input]:w-full [&>input]:px-3.5 [&>input]:py-2.5 [&>input]:rounded-lg",
          "[&>input]:border [&>input]:text-sm [&>input]:font-medium [&>input]:text-slate-800",
          "[&>input]:bg-white [&>input]:outline-none [&>input]:transition-all",
          "[&>textarea]:w-full [&>textarea]:px-3.5 [&>textarea]:py-2.5 [&>textarea]:rounded-lg",
          "[&>textarea]:border [&>textarea]:text-sm [&>textarea]:font-medium [&>textarea]:text-slate-800",
          "[&>textarea]:bg-white [&>textarea]:outline-none [&>textarea]:transition-all [&>textarea]:resize-y",
          "[&>select]:w-full [&>select]:px-3.5 [&>select]:py-2.5 [&>select]:rounded-lg",
          "[&>select]:border [&>select]:text-sm [&>select]:font-medium [&>select]:text-slate-800",
          "[&>select]:bg-white [&>select]:outline-none [&>select]:transition-all",
          error
            ? [
                "[&>input]:border-rose-300 [&>input]:ring-2 [&>input]:ring-rose-100",
                "[&>textarea]:border-rose-300 [&>textarea]:ring-2 [&>textarea]:ring-rose-100",
                "[&>select]:border-rose-300 [&>select]:ring-2 [&>select]:ring-rose-100",
              ]
            : [
                "[&>input]:border-slate-200 [&>input]:focus:border-gold [&>input]:focus:ring-2 [&>input]:focus:ring-amber-100",
                "[&>textarea]:border-slate-200 [&>textarea]:focus:border-gold [&>textarea]:focus:ring-2 [&>textarea]:focus:ring-amber-100",
                "[&>select]:border-slate-200 [&>select]:focus:border-gold [&>select]:focus:ring-2 [&>select]:focus:ring-amber-100",
              ]
        )}
      >
        {children}
      </div>
      {helperText && !error && (
        <p className="text-[11px] text-slate-400 leading-relaxed">{helperText}</p>
      )}
      {error && (
        <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
          <span aria-hidden="true">⚠</span> {error}
        </p>
      )}
    </div>
  );
};

export default FormFieldGroup;

