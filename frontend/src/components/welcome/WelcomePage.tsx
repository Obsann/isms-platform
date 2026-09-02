'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  BarChart3,
  Landmark,
  PiggyBank,
  Receipt,
  Smartphone,
  Wallet,
} from 'lucide-react';
import { useAuthUser } from '@/components/auth/useAuthUser';
import { portalHome } from '@/lib/api-client';
import PortalFooter from '@/components/layout/PortalFooter';
import HeroLedgerVisual from './HeroLedgerVisual';
import WelcomeNav from './WelcomeNav';
import { setWelcomeLang, useWelcomeLang } from './useWelcomeLang';
import { WELCOME_COPY } from './welcome-copy';

const SERVICE_ICONS = [PiggyBank, Wallet, Landmark, Receipt, BarChart3, Smartphone] as const;

const SLIDE_INTERVAL_MS = 3000;

export default function WelcomePage() {
  const user = useAuthUser();
  const continueHref = user ? portalHome(user.role) : '/login';

  const lang = useWelcomeLang();
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const elapsedRef = useRef(0);
  const slideRef = useRef(slide);

  const copy = WELCOME_COPY[lang];
  const slideCount = copy.slides.length;

  useEffect(() => {
    if (slideRef.current !== slide) {
      slideRef.current = slide;
      elapsedRef.current = 0;
    }

    const syncBar = () => {
      setProgress((elapsedRef.current / SLIDE_INTERVAL_MS) * 100);
    };

    if (paused) {
      const frame = requestAnimationFrame(syncBar);
      return () => cancelAnimationFrame(frame);
    }

    const origin = performance.now() - elapsedRef.current;
    let frame = 0;
    const remaining = Math.max(0, SLIDE_INTERVAL_MS - elapsedRef.current);

    const tick = (now: number) => {
      elapsedRef.current = Math.min(SLIDE_INTERVAL_MS, now - origin);
      setProgress((elapsedRef.current / SLIDE_INTERVAL_MS) * 100);
      if (elapsedRef.current < SLIDE_INTERVAL_MS) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    const timeout = window.setTimeout(() => {
      setSlide((prev) => (prev + 1) % slideCount);
    }, remaining);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [slide, paused, slideCount]);

  const active = copy.slides[slide] ?? copy.slides[0];
  const primaryLabel = user ? copy.ctaContinue : copy.ctaSignIn;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-surface" lang={lang}>
      <a
        href="#welcome-main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-20 focus:px-3 focus:py-2 focus:rounded-lg focus:bg-gold focus:text-midnight focus:text-sm focus:font-semibold"
      >
        {copy.skipToContent}
      </a>

      <header
        className="relative bg-surface text-slate-900 dark:bg-midnight dark:text-white overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.18] dark:opacity-[0.12]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgb(216 177 56 / 0.5) 0.8px, transparent 0.9px)',
            backgroundSize: '16px 16px',
          }}
        />
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gold/10 blur-3xl pointer-events-none" />

        <div className="relative px-6 md:px-10">
          <WelcomeNav
            user={user}
            continueHref={continueHref}
            copy={copy}
            lang={lang}
            onLangChange={setWelcomeLang}
          />

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_22rem] gap-10 lg:gap-14 items-center pt-8 pb-14 md:pt-12 md:pb-20">
            <div className="max-w-2xl">
              <div className="relative min-h-[7.5rem] sm:min-h-[9rem]">
                <p
                  key={`badge-${lang}-${slide}`}
                  className="text-[11px] font-bold uppercase tracking-[0.22em] text-gold-dark dark:text-gold mb-4 transition-opacity duration-300"
                >
                  <span aria-hidden="true">✦ </span>
                  {active.badge}
                </p>
                <h1
                  key={`title-${lang}-${slide}`}
                  className="font-heading text-3xl sm:text-4xl md:text-[2.75rem] font-bold tracking-tight leading-tight transition-opacity duration-300"
                >
                  {active.title}
                </h1>
              </div>

              <p className="mt-4 text-[15px] sm:text-base text-slate-600 dark:text-white/65 leading-relaxed">
                {copy.intro}
              </p>

              <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-3">
                <Link
                  href={continueHref}
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-gold text-midnight text-sm font-semibold tracking-wide hover:bg-gold-light transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface dark:focus-visible:ring-offset-midnight"
                >
                  {primaryLabel}
                </Link>
                <a
                  href="#services"
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-slate-300 dark:border-white/15 text-sm font-semibold text-slate-700 dark:text-white/80 hover:border-gold/50 hover:text-gold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                >
                  {copy.ctaSecondary}
                </a>
              </div>
              <p className="mt-3 text-[12px] text-slate-500 dark:text-white/40">{copy.tenantNote}</p>

              <div className="mt-8 flex items-center gap-4">
                <div className="relative h-1 flex-1 max-w-[12rem] rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-gold"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex items-center gap-1.5" role="tablist" aria-label={copy.slidesLabel}>
                  {copy.slides.map((s, i) => (
                    <button
                      key={s.title}
                      type="button"
                      role="tab"
                      aria-selected={i === slide}
                      aria-label={`${copy.slideLabelPrefix} ${i + 1}: ${s.title}`}
                      onClick={() => setSlide(i)}
                      className={`h-2 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                        i === slide
                          ? 'w-6 bg-gold'
                          : 'w-2 bg-slate-300 hover:bg-slate-400 dark:bg-white/25 dark:hover:bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <HeroLedgerVisual copy={copy.heroVisual} />
          </div>
        </div>
      </header>

      <main id="welcome-main" className="flex-1 px-6 md:px-10 py-14 md:py-20 max-w-6xl w-full mx-auto">
        <section id="services" aria-labelledby="services-heading">
          <h2
            id="services-heading"
            className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white"
          >
            {copy.servicesHeading}
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
            {copy.servicesIntro}
          </p>
          <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 list-none p-0">
            {copy.services.map(({ title, body }, i) => {
              const Icon = SERVICE_ICONS[i];
              return (
                <li
                  key={title}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-5 shadow-sm"
                >
                  <span className="inline-flex w-9 h-9 rounded-lg bg-gold/15 text-gold-dark dark:text-gold items-center justify-center mb-3">
                    <Icon className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
                  <p className="mt-1.5 text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    {body}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>

        <section id="get-started" className="mt-14 md:mt-20" aria-labelledby="get-started-heading">
          <h2
            id="get-started-heading"
            className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white"
          >
            {copy.gettingStartedHeading}
          </h2>
          <ol className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 list-none p-0">
            {copy.steps.map(({ step, title, body }) => (
              <li
                key={step}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-5 shadow-sm"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gold-dark dark:text-gold">
                  {step}
                </p>
                <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
                <p className="mt-1.5 text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  {body}
                </p>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <PortalFooter pathname="/" />
    </div>
  );
}
