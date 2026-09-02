import { ArrowDownLeft, ArrowUpRight, Check } from 'lucide-react';
import type { WelcomeHeroVisualCopy } from './welcome-copy';

const TREND_BARS = [38, 52, 45, 64, 58, 78, 92];

export default function HeroLedgerVisual({ copy }: { copy: WelcomeHeroVisualCopy }) {
  return (
    <div className="relative select-none pointer-events-none" aria-hidden="true">
      <div className="absolute inset-0 -m-8 rounded-[2.5rem] bg-gold/10 blur-3xl" />

      <div className="relative mx-auto w-full max-w-sm">
        <div
          className="absolute inset-x-5 top-0 h-full rounded-2xl border border-slate-200 bg-white/70 dark:border-white/10 dark:bg-midnight-light/25"
          style={{ transform: 'rotate(4deg)' }}
        />

        <div
          className="relative rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-elevated dark:border-white/10 dark:bg-midnight-light/70"
          style={{ transform: 'rotate(-2deg)' }}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600 dark:text-white/70">
              <span className="w-1.5 h-1.5 rounded-full bg-gold" />
              {copy.accountLabel}
            </span>
            <span className="text-[10px] tracking-[0.18em] text-slate-400 dark:text-white/35">
              {copy.accountMask}
            </span>
          </div>

          <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-gold-dark dark:text-gold/80">
            {copy.balanceLabel}
          </p>
          <p className="mt-1.5 font-heading text-2xl sm:text-[1.75rem] font-bold text-slate-900 dark:text-white tracking-tight">
            {copy.balance}
          </p>

          <svg viewBox="0 0 140 34" className="mt-4 w-full h-8" role="presentation">
            {TREND_BARS.map((height, i) => (
              <rect
                key={i}
                x={i * 20 + 2}
                y={34 - (height / 100) * 30}
                width="9"
                height={(height / 100) * 30}
                rx="2"
                fill="rgb(216 177 56)"
                opacity={0.35 + i * 0.08}
              />
            ))}
          </svg>

          <div className="mt-4 border-t border-slate-200 dark:border-white/10 pt-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-white/35">
              {copy.postingsLabel}
            </p>

            <div className="mt-3 space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 text-[12px] text-slate-600 dark:text-white/75">
                  <span className="w-6 h-6 rounded-md bg-gold/15 text-gold-dark dark:text-gold inline-flex items-center justify-center">
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                  </span>
                  {copy.debitLabel}
                </span>
                <span className="text-[12px] font-semibold text-slate-900 dark:text-white tabular-nums">
                  {copy.debitAmount}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 text-[12px] text-slate-600 dark:text-white/75">
                  <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300 inline-flex items-center justify-center">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                  {copy.creditLabel}
                </span>
                <span className="text-[12px] font-semibold text-slate-900 dark:text-white tabular-nums">
                  {copy.creditAmount}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div
          className="relative z-10 mx-auto -mt-3 w-fit rounded-full border border-gold/30 bg-white dark:bg-midnight px-3 py-1.5 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-gold-dark dark:text-gold"
          style={{ transform: 'rotate(-2deg)' }}
        >
          <Check className="w-3 h-3" />
          {copy.balancedNote}
        </div>
      </div>
    </div>
  );
}
