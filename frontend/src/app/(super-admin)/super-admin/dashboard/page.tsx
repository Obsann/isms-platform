'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, Users, AlertTriangle, Shield, CheckCircle2, ArrowRight, Activity, Server } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { getTenants, type TenantListItem } from '@/lib/api-client';
import { useLang } from '@/components/i18n';

export default function SuperAdminDashboardPage() {
  const { t } = useLang();
  const [tenants, setTenants] = useState<TenantListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const data = await getTenants();
        setTenants(data);
      } catch (err) {
        setError('Failed to load platform statistics');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const totalTenants = tenants.length;
  const activeTenants = tenants.filter(t => t.status === 'active').length;
  const suspendedTenants = tenants.filter(t => t.status === 'suspended').length;
  const provisioningTenants = tenants.filter(t => t.status === 'provisioning').length;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-4 h-4 text-amber-500" />
          <p className="text-[11px] font-bold uppercase tracking-widest text-amber-500">{t('dash.superEyebrow')}</p>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{t('dash.superTitle')}</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
          {t('dash.superIntro')}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tenants */}
        <Card className="relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-transparent dark:from-indigo-900/20 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5 flex flex-col justify-between h-full relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
                <Server className="w-5 h-5" />
              </div>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Total Tenants</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {loading ? '...' : totalTenants}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Tenants */}
        <Card className="relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent dark:from-emerald-900/20 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5 flex flex-col justify-between h-full relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Active Tenants</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {loading ? '...' : activeTenants}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Provisioning */}
        <Card className="relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent dark:from-blue-900/20 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5 flex flex-col justify-between h-full relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                <Activity className="w-5 h-5" />
              </div>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Provisioning</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {loading ? '...' : provisioningTenants}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Suspended */}
        <Card className="relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-50 to-transparent dark:from-rose-900/20 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5 flex flex-col justify-between h-full relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2.5 bg-rose-100 dark:bg-rose-900/30 rounded-xl text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Suspended</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {loading ? '...' : suspendedTenants}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Tenants */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Recent Tenants</CardTitle>
                <CardDescription>Latest tenants added to the platform</CardDescription>
              </div>
              <Link 
                href="/super-admin/tenants"
                className="text-xs font-semibold text-gold hover:text-amber-600 transition-colors flex items-center gap-1"
              >
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-8 text-center text-sm text-slate-500">Loading tenants...</div>
              ) : error ? (
                <div className="py-8 text-center text-sm text-rose-500 flex items-center justify-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> {error}
                </div>
              ) : tenants.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500">No tenants registered on the platform.</div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/60 border-t border-slate-100 dark:border-slate-800/60 mt-2">
                  {tenants.slice(0, 5).map((tenant) => (
                    <div key={tenant.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                            {tenant.name}
                          </p>
                          <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                            {tenant.code}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          tenant.status === 'active' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' :
                          tenant.status === 'suspended' ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400' :
                          'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
                        }`}>
                          {tenant.status}
                        </span>
                        {tenant.adminEmail && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">{tenant.adminEmail}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-gradient-to-br from-midnight to-slate-900 border-none shadow-lg text-white">
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center mb-4">
                <Building2 className="w-6 h-6 text-gold" />
              </div>
              <h3 className="text-lg font-bold mb-2 tracking-tight">Provision New Tenant</h3>
              <p className="text-xs text-white/70 mb-6 font-medium leading-relaxed">
                Create and onboard a new SACCO tenant onto the ISMS platform. Requires unique tenant code.
              </p>
              <Link 
                href="/super-admin/tenants"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gold text-midnight font-bold text-sm tracking-wide hover:bg-amber-400 transition-colors"
              >
                Go to Registry <ArrowRight className="w-4 h-4" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
