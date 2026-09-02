'use client';

import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/theme/ThemeProvider';
import { useLang } from '@/components/i18n';

interface ThemeToggleButtonProps {
  toDarkLabel?: string;
  toLightLabel?: string;
  variant?: 'default' | 'ghost';
  className?: string;
}

export default function ThemeToggleButton({
  toDarkLabel,
  toLightLabel,
  variant = 'default',
  className,
}: ThemeToggleButtonProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const { t } = useLang();

  const isDark = resolvedTheme === 'dark';
  const label = isDark ? (toLightLabel ?? t('themeToLight')) : (toDarkLabel ?? t('themeToDark'));

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={cn(
        variant === 'ghost'
          ? 'w-9 h-9 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10 flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60'
          : 'w-9 h-9 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-gold hover:border-gold/40 dark:border-white/10 dark:bg-midnight-light/40 dark:text-slate-300 flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface dark:focus-visible:ring-offset-midnight',
        className,
      )}
    >
      {isDark ? (
        <Sun className="w-4 h-4" aria-hidden="true" />
      ) : (
        <Moon className="w-4 h-4" aria-hidden="true" />
      )}
    </button>
  );
}
