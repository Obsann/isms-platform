'use client';

import Link from 'next/link';
import { formatRoleLabel } from '@/components/auth/useAuthUser';
import type { AuthUser } from '@/types';
import LanguagePicker from './LanguagePicker';
import ThemeToggleButton from './ThemeToggleButton';
import type { WelcomeCopy, WelcomeLang } from './welcome-copy';

interface WelcomeNavProps {
  user: AuthUser | null;
  continueHref: string;
  copy: WelcomeCopy;
  lang: WelcomeLang;
  onLangChange: (lang: WelcomeLang) => void;
}

function LogoMark() {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-11 h-11 rounded-full bg-gold text-midnight flex items-center justify-center font-display text-[10px] font-bold tracking-wider shadow-[0_0_0_3px_rgba(197,155,39,0.2)]"
        aria-hidden="true"
      >
        ISMS
      </div>
      <div className="leading-none">
        <p className="font-display text-sm font-bold text-slate-900 dark:text-white tracking-[0.2em] uppercase">
          ISMS
        </p>
        <p className="text-[10px] text-slate-500 dark:text-white/40 tracking-[0.15em] uppercase mt-1">
          Savings &amp; Credit
        </p>
      </div>
    </div>
  );
}

export default function WelcomeNav({
  user,
  continueHref,
  copy,
  lang,
  onLangChange,
}: WelcomeNavProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-5">
      <LogoMark />
      <div className="flex items-center gap-2 sm:gap-3">
        {user && (
          <p className="hidden lg:block text-[11px] text-slate-500 dark:text-white/50 truncate max-w-[12rem]">
            {user.fullName}
            <span className="text-gold-dark dark:text-gold/80"> · {formatRoleLabel(user.role)}</span>
          </p>
        )}
        <ThemeToggleButton toDarkLabel={copy.themeToDark} toLightLabel={copy.themeToLight} />
        <LanguagePicker lang={lang} onChange={onLangChange} label={copy.languageLabel} />
        <Link
          href={continueHref}
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-gold text-midnight text-sm font-semibold tracking-wide hover:bg-gold-light transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface dark:focus-visible:ring-offset-midnight"
        >
          {user ? copy.navContinue : copy.navSignIn}
        </Link>
      </div>
    </div>
  );
}
