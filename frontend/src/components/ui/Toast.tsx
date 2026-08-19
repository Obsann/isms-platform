"use client";

import React, { useEffect } from "react";
import { cn } from "@/lib/utils";

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type?: "success" | "error" | "info" | "warning";
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
  durationMs?: number;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose, durationMs = 4000 }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, durationMs);
    return () => clearTimeout(timer);
  }, [toast, onClose, durationMs]);

  if (!toast) return null;

  const iconMap = {
    success: "✅",
    error: "⚠️",
    info: "ℹ️",
    warning: "🔔",
  };

  const type = toast.type ?? "success";

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm bg-white border border-slate-200 rounded-xl shadow-elevated p-4 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-5 duration-200">
      <div className="mt-0.5 shrink-0 text-base">{iconMap[type]}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900">{toast.title}</p>
        {toast.description && (
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{toast.description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="text-slate-400 hover:text-slate-600 transition-colors p-1"
        aria-label="Close notification"
      >
        ✕
      </button>
    </div>
  );
};

export default Toast;
