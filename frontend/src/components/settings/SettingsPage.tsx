'use client';

import { useState } from 'react';
import { Bell, Globe, Moon, Shield, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { useTheme } from '@/components/theme/ThemeProvider';
import { useAuthUser } from '@/components/auth/useAuthUser';

interface SettingsPageProps {
  eyebrow?: string;
}

export default function SettingsPage({ eyebrow = 'Account Configuration' }: SettingsPageProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const user = useAuthUser();

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form State
  const [language, setLanguage] = useState('en-US');
  const [timezone, setTimezone] = useState('Africa/Addis_Ababa');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [monthlyReports, setMonthlyReports] = useState(true);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    // Apply local changes immediately; backend sync is not yet implemented
    setSaving(false);
    setSuccess(true);
    
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Header */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-gold mb-1">{eyebrow}</p>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">System Settings</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
          Manage your personal preferences, notifications, and application settings.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-gold" />
              Appearance
            </CardTitle>
            <CardDescription>Customize how the platform looks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Dark Mode</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Switch between light and dark themes</p>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 ${
                  resolvedTheme === 'dark' ? 'bg-gold' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    resolvedTheme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Regional Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-sky-500" />
              Regional & Language
            </CardTitle>
            <CardDescription>Set your language and timezone preferences</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all"
              >
                <option value="en-US">English (US)</option>
                <option value="am-ET">Amharic (Ethiopia)</option>
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all"
              >
                <option value="Africa/Addis_Ababa">Africa/Addis Ababa (EAT)</option>
                <option value="UTC">Coordinated Universal Time (UTC)</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-500" />
              Notifications
            </CardTitle>
            <CardDescription>Choose how you want to be alerted</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Email Alerts</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Receive critical system alerts via email</p>
              </div>
              <button
                type="button"
                onClick={() => setEmailAlerts(!emailAlerts)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 ${
                  emailAlerts ? 'bg-gold' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${emailAlerts ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">SMS Notifications</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Get text messages for important events</p>
              </div>
              <button
                type="button"
                onClick={() => setSmsAlerts(!smsAlerts)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 ${
                  smsAlerts ? 'bg-gold' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${smsAlerts ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Monthly Reports</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Receive automated monthly portfolio summaries</p>
              </div>
              <button
                type="button"
                onClick={() => setMonthlyReports(!monthlyReports)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 ${
                  monthlyReports ? 'bg-gold' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${monthlyReports ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Security & Audit */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500" />
              Security & Audit
            </CardTitle>
            <CardDescription>View your active session and role context</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Active Session Details</p>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block mb-0.5">User ID</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 break-all">{user?.id || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Role</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{user?.role || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Tenant Scope</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 break-all">{user?.tenantId || 'Platform (Global)'}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Action */}
        <div className="flex items-center justify-between pt-4">
          <p className="text-xs text-slate-500">
            Some settings may require a page reload to take full effect.
          </p>
          <div className="flex items-center gap-4">
            {success && (
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                <CheckCircle2 className="w-4 h-4" />
                Local preferences applied
              </span>
            )}
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gold text-midnight font-bold text-sm tracking-wide hover:bg-gold-light disabled:opacity-60 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Preferences
                </>
              )}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}
