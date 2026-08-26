'use client';

/**
 * frontend/src/components/views/TellerSettingsView.tsx
 *
 * Compact, professional Teller Workstation Settings & Preferences view.
 * Instant global Light / Dark / System theme switching, local workstation preferences,
 * and session security lifecycle information.
 */

import React, { useState } from 'react';
import {
  Palette,
  Sliders,
  Shield,
  Check,
  Sun,
  Moon,
  Laptop,
  Server,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { useTheme, type Theme } from '@/components/theme/ThemeProvider';

export function TellerSettingsView() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [autoClear, setAutoClear] = useState(true);
  const [sessionReceipts, setSessionReceipts] = useState(true);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSavePreferences = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const themeOptions: { value: Theme; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      value: 'light',
      label: 'Light Mode',
      icon: <Sun className="w-4 h-4" />,
      desc: 'Clean financial paper surface',
    },
    {
      value: 'dark',
      label: 'Dark Mode',
      icon: <Moon className="w-4 h-4" />,
      desc: 'High-contrast midnight terminal',
    },
    {
      value: 'system',
      label: 'System OS',
      icon: <Laptop className="w-4 h-4" />,
      desc: 'Match device system scheme',
    },
  ];

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Compact Header */}
      <div className="pb-3 border-b border-slate-200/80 dark:border-slate-800">
        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-gold">
          Configuration
        </span>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-serif tracking-tight mt-0.5">
          Workstation Settings
        </h1>
        <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
          Manage visual theme, teller desk behaviors, and session security policies.
        </p>
      </div>

      {savedNotice && (
        <div className="p-3 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-xs font-medium text-emerald-900 dark:text-emerald-200 flex items-center gap-2 shadow-sm">
          <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
          <span>Local workstation preferences saved for this session.</span>
        </div>
      )}

      {/* 1. Appearance / Global Theme */}
      <Card>
        <CardHeader className="py-2.5 px-4">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-amber-800 dark:text-gold shrink-0" />
            <CardTitle className="text-sm">Appearance &amp; Global Theme</CardTitle>
          </div>
          <span className="text-[10px] font-mono font-semibold uppercase text-slate-600 dark:text-slate-400">
            Active: {resolvedTheme}
          </span>
        </CardHeader>

        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {themeOptions.map((opt) => {
              const isSelected = theme === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTheme(opt.value)}
                  className={cn(
                    'p-3 rounded-lg border text-left transition-all flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
                    isSelected
                      ? 'border-gold bg-gold/10 dark:bg-gold/15 ring-1 ring-gold shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100/70 dark:hover:bg-slate-800/70',
                  )}
                >
                  <span
                    className={cn(
                      'p-2 rounded-md shrink-0 transition-colors',
                      isSelected
                        ? 'bg-midnight text-gold dark:bg-gold dark:text-midnight'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700',
                    )}
                  >
                    {opt.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {opt.label}
                      </p>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-gold shrink-0" />
                      )}
                    </div>
                    <p className="text-[10px] font-medium text-slate-600 dark:text-slate-400 truncate mt-0.5">
                      {opt.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 2. Workstation Preferences */}
      <Card>
        <CardHeader className="py-2.5 px-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-800 dark:text-gold shrink-0" />
            <CardTitle className="text-sm">Desk Workflow Preferences</CardTitle>
          </div>
          <span className="text-[10px] font-mono font-semibold text-slate-600 dark:text-slate-400">Local Only</span>
        </CardHeader>

        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-slate-200/70 dark:border-slate-800 text-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  Auto-Clear Transaction Forms
                </span>
                <span className="text-[9px] font-mono font-semibold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                  LOCAL ONLY
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5 font-medium">
                Automatically reset amount and reference inputs after confirmation.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
              <input
                type="checkbox"
                checked={autoClear}
                onChange={(e) => setAutoClear(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-200/70 dark:border-slate-800 text-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  Session Activity Feed Retention
                </span>
                <span className="text-[9px] font-mono font-semibold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                  LOCAL ONLY
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5 font-medium">
                Retain recent transaction entries in desk feed until account switch.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
              <input
                type="checkbox"
                checked={sessionReceipts}
                onChange={(e) => setSessionReceipts(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Base Currency: <strong className="text-slate-900 dark:text-slate-100">ETB (Ethiopian Birr)</strong>
            </span>
            <button
              type="button"
              onClick={handleSavePreferences}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-midnight text-gold hover:bg-midnight-light dark:bg-gold dark:text-midnight dark:hover:bg-gold-light transition-all shadow-sm"
            >
              Save Preferences
            </button>
          </div>
        </CardContent>
      </Card>

      {/* 3. Session Security & 4. System Specs (2-col) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <Card>
          <CardHeader className="py-2.5 px-4">
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-amber-800 dark:text-gold shrink-0" />
              <CardTitle className="text-xs uppercase tracking-wider">Session Security</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Token Lifetime:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">8 Hours</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Isolation:</span>
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">Tenant RLS Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Authentication:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">JWT Token Bearer</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-2.5 px-4">
            <div className="flex items-center gap-1.5">
              <Server className="w-4 h-4 text-amber-800 dark:text-gold shrink-0" />
              <CardTitle className="text-xs uppercase tracking-wider">System Specifications</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Ledger Precision:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">BigInt Minor Units</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Accounting Model:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">Double-Entry Journal</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Theme Engine:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">CSS Class (`.dark`)</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default TellerSettingsView;
