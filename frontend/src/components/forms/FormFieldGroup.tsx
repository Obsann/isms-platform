'use client';

import React from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormFieldGroupProps {
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
  label,
  htmlFor,
  required,
  tooltip,
  helperText,
  error,
  className,
  children,
}: FormFieldGroupProps) {
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
          "[&_input]:w-full [&_input]:px-3 [&_input]:py-2 [&_input]:rounded-lg",
          "[&_input]:border [&_input]:text-sm [&_input]:font-medium [&_input]:text-slate-900 dark:[&_input]:text-slate-100",
          "[&_input]:bg-white dark:[&_input]:bg-slate-900/90 [&_input]:outline-none [&_input]:transition-all",
          "[&_input]:placeholder:text-slate-400 dark:[&_input]:placeholder:text-slate-500",
          "[&_textarea]:w-full [&_textarea]:px-3 [&_textarea]:py-2 [&_textarea]:rounded-lg",
          "[&_textarea]:border [&_textarea]:text-sm [&_textarea]:font-medium [&_textarea]:text-slate-900 dark:[&_textarea]:text-slate-100",
          "[&_textarea]:bg-white dark:[&_textarea]:bg-slate-900/90 [&_textarea]:outline-none [&_textarea]:transition-all [&_textarea]:resize-y",
          "[&_textarea]:placeholder:text-slate-400 dark:[&_textarea]:placeholder:text-slate-500",
          "[&_select]:w-full [&_select]:px-3 [&_select]:py-2 [&_select]:rounded-lg",
          "[&_select]:border [&_select]:text-sm [&_select]:font-medium [&_select]:text-slate-900 dark:[&_select]:text-slate-100",
          "[&_select]:bg-white dark:[&_select]:bg-slate-900/90 [&_select]:outline-none [&_select]:transition-all",
          error
            ? [
                "[&_input]:border-rose-400 dark:[&_input]:border-rose-700 [&_input]:ring-2 [&_input]:ring-rose-100 dark:[&_input]:ring-rose-900/30",
                "[&_textarea]:border-rose-400 dark:[&_textarea]:border-rose-700 [&_textarea]:ring-2 [&_textarea]:ring-rose-100 dark:[&_textarea]:ring-rose-900/30",
                "[&_select]:border-rose-400 dark:[&_select]:border-rose-700 [&_select]:ring-2 [&_select]:ring-rose-100 dark:[&_select]:ring-rose-900/30",
              ]
            : [
                "[&_input]:border-slate-300 dark:[&_input]:border-slate-700 [&_input]:focus:border-gold dark:[&_input]:focus:border-gold [&_input]:focus:ring-2 [&_input]:focus:ring-amber-100 dark:[&_input]:focus:ring-amber-500/20",
                "[&_textarea]:border-slate-300 dark:[&_textarea]:border-slate-700 [&_textarea]:focus:border-gold dark:[&_textarea]:focus:border-gold [&_textarea]:focus:ring-2 [&_textarea]:focus:ring-amber-100 dark:[&_textarea]:focus:ring-amber-500/20",
                "[&_select]:border-slate-300 dark:[&_select]:border-slate-700 [&_select]:focus:border-gold dark:[&_select]:focus:border-gold [&_select]:focus:ring-2 [&_select]:focus:ring-amber-100 dark:[&_select]:focus:ring-amber-500/20",
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

export default FormFieldGroup;
