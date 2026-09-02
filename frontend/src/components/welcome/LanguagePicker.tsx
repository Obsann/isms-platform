'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { WELCOME_LANGUAGES, type WelcomeLang } from './welcome-copy';

interface LanguagePickerProps {
  lang: WelcomeLang;
  onChange: (lang: WelcomeLang) => void;
  label: string;
}

export default function LanguagePicker({ lang, onChange, label }: LanguagePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const current = WELCOME_LANGUAGES.find((item) => item.code === lang) ?? WELCOME_LANGUAGES[0];

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="menu"
        className="h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-gold hover:border-gold/40 dark:border-white/10 dark:bg-midnight-light/40 dark:text-slate-300 inline-flex items-center gap-1.5 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface dark:focus-visible:ring-offset-midnight"
      >
        <Globe className="w-4 h-4" aria-hidden="true" />
        <span>{current.short}</span>
        <ChevronDown
          className="w-3.5 h-3.5 transition-transform"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label={label}
          className="absolute right-0 top-full mt-2 z-30 w-40 rounded-lg border border-slate-200 bg-white dark:border-white/10 dark:bg-midnight-dark py-1 shadow-elevated"
        >
          {WELCOME_LANGUAGES.map((item) => (
            <button
              key={item.code}
              type="button"
              role="menuitemradio"
              aria-checked={item.code === lang}
              onClick={() => {
                onChange(item.code);
                setOpen(false);
              }}
              className={`w-full px-3 py-2 flex items-center justify-between gap-2 text-[13px] transition-colors focus-visible:outline-none focus-visible:bg-slate-50 dark:focus-visible:bg-white/10 ${
                item.code === lang
                  ? 'text-gold-dark dark:text-gold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/5'
              }`}
            >
              <span>{item.label}</span>
              {item.code === lang && <Check className="w-3.5 h-3.5" aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
