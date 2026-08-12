'use client';

import React from 'react';
import { Moon, Sun, Bell, Shield, Info } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default function SettingsView() {
  const { darkMode, toggleDarkMode, showToast } = useApp();

  const handleSave = () => showToast('Settings Saved', 'Platform configuration updated successfully.', 'success');

  return (
    <div className="space-y-6 pb-8 max-w-3xl">
      <div className="border-b border-slate-200 pb-4">
        <span className="text-xs font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">Platform</span>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 font-serif">Platform Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Configure ISMS platform behavior, notifications, and security policies.</p>
      </div>

      {/* Dark Mode */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Moon className="w-4 h-4 text-slate-600" />Appearance</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <p className="font-semibold text-slate-800">Dark Mode</p>
              <p className="text-xs text-slate-500 mt-0.5">Switch between light and dark theme. Persisted in local storage.</p>
            </div>
            <button onClick={toggleDarkMode} className={`relative w-12 h-6 rounded-full transition-colors ${ darkMode ? 'bg-amber-500' : 'bg-slate-300' }`}>
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${ darkMode ? 'translate-x-7' : 'translate-x-1' }`} />
            </button>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-3">
            {darkMode ? <Moon className="w-4 h-4 text-amber-600 shrink-0" /> : <Sun className="w-4 h-4 text-amber-600 shrink-0" />}
            <p className="text-sm text-amber-800">Currently in <strong>{darkMode ? 'Dark' : 'Light'}</strong> mode.</p>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="w-4 h-4 text-slate-600" />Notification Preferences</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: 'High Risk Vendor Alerts', desc: 'Notify when a vendor drops below 60 audit score', enabled: true },
            { label: 'Compliance Framework Updates', desc: 'Receive notifications for framework score changes', enabled: true },
            { label: 'New Member Registrations', desc: 'Alert when new Sacco members are onboarded', enabled: false },
            { label: 'Audit Log Anomalies', desc: 'Alert on failed or suspicious system events', enabled: true },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="font-semibold text-slate-800 text-sm">{item.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
              </div>
              <div className={`relative w-10 h-5 rounded-full cursor-pointer transition-colors ${ item.enabled ? 'bg-amber-500' : 'bg-slate-300' }`} onClick={() => showToast('Preference Updated', `${item.label} preference toggled.`, 'info')}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${ item.enabled ? 'translate-x-5' : 'translate-x-0.5' }`} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Security Policy */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="w-4 h-4 text-slate-600" />Security Policy Thresholds</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: 'Minimum Audit Score', value: '75', unit: '/ 100' },
            { label: 'Risk Score Alert Threshold', value: '80', unit: '/ 100' },
            { label: 'MFA Session Timeout', value: '30', unit: 'minutes' },
            { label: 'Password Expiry Policy', value: '90', unit: 'days' },
          ].map((policy) => (
            <div key={policy.label} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <p className="font-semibold text-slate-800 text-sm">{policy.label}</p>
              <div className="flex items-center gap-2">
                <input type="number" defaultValue={policy.value} className="w-20 h-8 px-2 text-center border border-slate-300 rounded-lg text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-300" />
                <span className="text-xs text-slate-500">{policy.unit}</span>
              </div>
            </div>
          ))}
          <button onClick={handleSave} className="w-full py-2.5 bg-slate-900 text-amber-400 text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors">Save Security Policies</button>
        </CardContent>
      </Card>

      {/* System Info */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Info className="w-4 h-4 text-slate-600" />System Information</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          {[['Platform Version', 'ISMS v2.4.1'], ['Next.js Version', '16.3.0'], ['Environment', 'Production'], ['API Base URL', 'http://localhost:4000/api'], ['Build Date', new Date().toLocaleDateString()], ['Theme', 'Prosperum Luxury']].map(([k, v]) => (
            <div key={k} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs text-slate-400 uppercase tracking-wider">{k}</p>
              <p className="text-sm font-mono font-semibold text-slate-800 mt-0.5 truncate">{v}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
