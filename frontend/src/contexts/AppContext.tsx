'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type?: 'success' | 'error' | 'info' | 'warning';
}

interface AppState {
  toast: ToastMessage | null;
  showToast: (titleOrMsg: string, descriptionOrType?: string, type?: ToastMessage['type']) => void;
  closeToast: () => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback((titleOrMsg: string, descriptionOrType?: string, type: ToastMessage['type'] = 'success') => {
    const isType = (val?: string): val is ToastMessage['type'] =>
      val === 'success' || val === 'error' || val === 'info' || val === 'warning';
    const finalDescription = isType(descriptionOrType) ? undefined : descriptionOrType;
    const finalType = isType(descriptionOrType) ? descriptionOrType : type;
    setToast({
      id: Date.now().toString(),
      title: titleOrMsg,
      description: finalDescription,
      type: finalType,
    });
  }, []);

  const closeToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return (
    <AppContext.Provider value={{ toast, showToast, closeToast }}>
      {children}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-5 left-5 z-[20000] max-w-sm rounded-xl border px-4 py-3 shadow-lg text-sm ${
            toast.type === 'error'
              ? 'bg-rose-950 border-rose-500/40 text-rose-50'
              : toast.type === 'warning'
                ? 'bg-amber-950 border-amber-500/40 text-amber-50'
                : 'bg-slate-900 border-emerald-500/40 text-white'
          }`}
        >
          <p className="font-semibold">{toast.title}</p>
          {toast.description && <p className="text-xs opacity-80 mt-0.5">{toast.description}</p>}
          <button type="button" onClick={closeToast} className="absolute top-2 right-3 text-xs opacity-70">
            ×
          </button>
        </div>
      )}
    </AppContext.Provider>
  );
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) {
    return { toast: null, showToast: () => {}, closeToast: () => {} };
  }
  return ctx;
}
