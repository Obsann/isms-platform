'use client';

import React, { useState } from 'react';
import { Palette, Sliders, Shield, Check, Sun, Moon, Laptop, Server } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { useTheme, type Theme } from '@/components/theme/ThemeProvider';

interface StaffSettingsViewProps {
  portalLabel: string;
  showDeskPrefs?: boolean;
}

export function StaffSettingsView({ portalLabel, showDeskPrefs = false }: StaffSettingsViewProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [autoClear, setAutoClear] = useState(true);
  const [sessionReceipts, setSessionReceipts] = useState(true);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSavePreferences = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const themeOptions: { value: Theme; label: string; icon: React.ReactNode; desc: string }[] = [
    { value: 'light', label: 'Light Mode', icon: <Sun className="w-4 h-4" />, desc: 'Clean financial paper surface' },
    { value: 'dark', label: 'Dark Mode', icon: <Moon className="w-4 h-4" />, desc: 'High-contrast midnight terminal' },
    { value: 'system', label: 'System OS', icon: <Laptop className="w-4 h-4" />, desc: 'Match device system scheme' },
  ];

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="pb-3 border-b border-slate-200/80 dark:border-slate-800">
        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-gold">Configuration</span>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-serif tracking-tight mt-0.5">
          {portalLabel} Settings
        </h1>
        <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
          Theme, session security, and workstation preferences for this login.
        </p>
      </div>

      {savedNotice && (
        <div className="p-3 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-xs font-medium text-emerald-900 dark:text-emerald-200 flex items-center gap-2 shadow-sm">
          <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
          <span>Preferences saved for this session.</span>
        </div>
      )}

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
                      'p-2 rounded-md shrink-0',
                      isSelected
                        ? 'bg-midnight text-gold dark:bg-gold dark:text-midnight'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700',
                    )}
                  >
                    {opt.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{opt.label}</p>
                    <p className="text-[10px] font-medium text-slate-600 dark:text-slate-400 mt-0.5">{opt.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {showDeskPrefs && (
        <Card>
          <CardHeader className="py-2.5 px-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-800 dark:text-gold shrink-0" />
              <CardTitle className="text-sm">Desk Workflow Preferences</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-slate-200/70 dark:border-slate-800 text-xs">
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100">Auto-Clear Transaction Forms</span>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">Reset amount and reference after confirmation.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                <input type="checkbox" checked={autoClear} onChange={(e) => setAutoClear(e.target.checked)} className="sr-only peer" />
                <div className="w-9 h-5 bg-slate-300 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between py-2 text-xs">
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100">Session Activity Feed Retention</span>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">Keep recent desk entries until account switch.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                <input type="checkbox" checked={sessionReceipts} onChange={(e) => setSessionReceipts(e.target.checked)} className="sr-only peer" />
                <div className="w-9 h-5 bg-slate-300 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-end pt-1">
              <button
                type="button"
                onClick={handleSavePreferences}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-midnight text-gold hover:bg-midnight-light dark:bg-gold dark:text-midnight"
              >
                Save Preferences
              </button>
            </div>
          </CardContent>
        </Card>
      )}

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
              <CardTitle className="text-xs uppercase tracking-wider">System</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Currency:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">ETB (Ethiopian Birr)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Accounting:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">Double-entry ledger</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Portal:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{portalLabel}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default StaffSettingsView;
