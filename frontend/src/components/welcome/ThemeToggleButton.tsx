'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/theme/ThemeProvider';

interface ThemeToggleButtonProps {
  toDarkLabel: string;
  toLightLabel: string;
}

export default function ThemeToggleButton({ toDarkLabel, toLightLabel }: ThemeToggleButtonProps) {
  const { resolvedTheme, toggleTheme } = useTheme();

  const isDark = resolvedTheme === 'dark';
  const label = isDark ? toLightLabel : toDarkLabel;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className="w-9 h-9 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-gold hover:border-gold/40 dark:border-white/10 dark:bg-midnight-light/40 dark:text-slate-300 flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface dark:focus-visible:ring-offset-midnight"
    >
      {isDark ? (
        <Sun className="w-4 h-4" aria-hidden="true" />
      ) : (
        <Moon className="w-4 h-4" aria-hidden="true" />
      )}
    </button>
  );
}
