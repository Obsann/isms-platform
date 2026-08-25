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
          <span aria-hidden="true">⚠</span> {error}
        </p>
      )}
    </div>
  );
};

export default FormFieldGroup;
