'use client';

import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { DICTIONARIES, lookupDict, type AppLang } from './dictionary';

export type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

interface LangContextValue {
  lang: AppLang;
  setLang: (lang: AppLang) => void;
  t: TranslateFn;
}

const LangContext = createContext<LangContextValue | null>(null);

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  let out = template;
  for (const [key, value] of Object.entries(vars)) {
    out = out.replaceAll(`{${key}}`, String(value));
  }
  return out;
}

function translateEn(key: string, vars?: Record<string, string | number>): string {
  return interpolate(lookupDict(DICTIONARIES.en, key) ?? key, vars);
}

/** No-op: page language is English; Google Translate owns locale switching. */
export function persistLang(_next: AppLang) {
  void _next;
}

export function LangProvider({ children }: { children: React.ReactNode }) {
  const t = useCallback<TranslateFn>(translateEn, []);
  const value = useMemo<LangContextValue>(
    () => ({ lang: 'en', setLang: () => {}, t }),
    [t],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): LangContextValue {
  const context = useContext(LangContext);
  if (!context) {
    return {
      lang: 'en',
      setLang: () => {},
      t: translateEn,
    };
  }
  return context;
}

export default LangProvider;
