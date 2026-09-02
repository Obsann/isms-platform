'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Globe,
  Plus,
  ShieldAlert,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Building2,
  Power,
  RotateCcw,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import StatusBadge, { type StatusType } from '@/components/badges/StatusBadge';
import { DataTable, type Column } from '@/components/tables/DataTable';
import ProvisionTenantModal from '@/components/tenants/ProvisionTenantModal';
import {
  getTenants,
  updateTenant,
  deleteTenant,
  type TenantListItem,
} from '@/lib/api-client';
import type { Tenant, TenantStatus } from '@/types';
import { useLang } from '@/components/i18n';

export default function SuperAdminTenantsPage() {
  const { t } = useLang();
  const [tenants, setTenants] = useState<TenantListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const triggerToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchTenantsList = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await getTenants(statusFilter);
      setTenants(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load tenants from server.';
      setFetchError(msg);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchTenantsList();
  }, [fetchTenantsList]);

  const handleStatusToggle = async (tenant: TenantListItem) => {
    const nextStatus: TenantStatus = tenant.status === 'active' ? 'suspended' : 'active';
    const oldStatus = tenant.status;

    setUpdatingId(tenant.id);
    // Optimistic update
    setTenants((prev) =>
      prev.map((t) => (t.id === tenant.id ? { ...t, status: nextStatus } : t))
    );

    try {
      await updateTenant(tenant.id, { status: nextStatus });
      triggerToast(
        `Platform action: Tenant "${tenant.name}" (${tenant.code}) status changed to ${nextStatus.toUpperCase()}.`,
        nextStatus === 'active' ? 'success' : 'info'
      );
    } catch (err: unknown) {
      // Revert optimistic update
      setTenants((prev) =>
        prev.map((t) => (t.id === tenant.id ? { ...t, status: oldStatus } : t))
      );
      const msg = err instanceof Error ? err.message : 'Failed to update tenant status.';
      triggerToast(msg, 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteTenant = async (tenant: TenantListItem) => {
    if (
      !confirm(
        `PLATFORM ACTION WARNING:\n\nAre you sure you want to delete tenant "${tenant.name}" (${tenant.code})?\n\nThis platform-level operation runs outside RLS scoping and will unregister this SACCO tenant context.`
      )
    ) {
      return;
    }

    setDeletingId(tenant.id);
    try {
      await deleteTenant(tenant.id);
      setTenants((prev) => prev.filter((t) => t.id !== tenant.id));
      triggerToast(`Platform action: Tenant "${tenant.name}" deleted successfully.`, 'info');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete tenant.';
      triggerToast(msg, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleProvisionSuccess = (newTenant: Tenant) => {
    const newItem: TenantListItem = {
      id: newTenant.id,
      name: newTenant.name,
      code: newTenant.code,
      status: newTenant.status,
      createdAt: newTenant.createdAt,
    };
    setTenants((prev) => [newItem, ...prev.filter((t) => t.id !== newItem.id)]);
    triggerToast(
      `Tenant "${newTenant.name}" (${newTenant.code}) provisioned successfully!`,
      'success'
    );
  };

  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      return statusFilter === 'all' || t.status === statusFilter;
    });
  }, [tenants, statusFilter]);

  // Define Table Columns adhering to the Shared UI Kit DataTable standard
  const columns: Column<TenantListItem>[] = [
    {
      header: 'Tenant Name & Code',
      sortable: true,
      render: (tenant: TenantListItem) => (
        <div className="flex items-center gap-3 py-1">
          <div className="w-9 h-9 rounded-xl bg-midnight text-gold dark:bg-gold/15 dark:text-gold flex items-center justify-center font-bold text-sm shrink-0 border border-gold/30">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug">
              {tenant.name}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono text-[11px] font-semibold text-gold-dark dark:text-gold">
                {tenant.code}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                • ID: {tenant.id.slice(0, 8)}...
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      sortable: true,
      render: (tenant: TenantListItem) => (
        <StatusBadge status={tenant.status as StatusType} size="sm" />
      ),
    },
    {
      header: 'Scope Boundary',
      render: () => (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
          Platform Scoped
        </span>
      ),
    },
    {
      header: 'Onboarded Date',
      sortable: true,
      render: (tenant: TenantListItem) => (
        <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">
          {tenant.createdAt ? tenant.createdAt.split('T')[0] : '—'}
        </span>
      ),
    },
    {
      header: 'Actions',
      align: 'right',
      render: (tenant: TenantListItem) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => handleStatusToggle(tenant)}
            disabled={updatingId === tenant.id}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 border ${
              tenant.status === 'active'
                ? 'border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                : 'border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{tenant.status === 'active' ? 'Suspend' : 'Activate'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleDeleteTenant(tenant)}
            disabled={deletingId === tenant.id}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer disabled:opacity-50"
            title="Delete tenant (Platform Scope)"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl border text-xs font-semibold flex items-center gap-2.5 transition-all animate-bounce ${
            toast.type === 'success'
              ? 'bg-emerald-950 text-emerald-100 border-emerald-700 dark:bg-emerald-900'
              : toast.type === 'error'
              ? 'bg-rose-950 text-rose-100 border-rose-700 dark:bg-rose-900'
              : 'bg-slate-950 text-amber-300 border-amber-500 dark:bg-slate-900'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
          {toast.type === 'info' && <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Platform Warning Banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-900 dark:text-amber-200 shadow-sm">
        <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase tracking-wider text-[10px] bg-amber-200 dark:bg-amber-900/60 px-2 py-0.5 rounded font-mono">
              Unscoped Platform Action
            </span>
            <span className="font-semibold">Operates Outside Per-Tenant RLS Scoping</span>
          </div>
          <p className="text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
            All tenant management operations (provisioning, activation, suspension, deletion) on this console execute at the <strong>platform level</strong> without single-tenant isolation boundaries.
          </p>
        </div>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-gold mb-1">
            {t('dash.tenantsEyebrow')} · Platform Console
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {t('dash.tenantsTitle')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {t('dash.tenantsDesc')}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={fetchTenantsList}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            title="Refresh tenant list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setShowProvisionModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-midnight text-gold hover:bg-midnight-light dark:bg-gold dark:text-midnight dark:hover:bg-gold-light transition-all cursor-pointer shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Provision New Tenant</span>
          </button>
        </div>
      </div>

      {/* Status Filter Segmented Controls */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {(['all', 'active', 'provisioning', 'suspended'] as const).map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer shrink-0 ${
              statusFilter === st
                ? 'bg-midnight text-gold dark:bg-gold dark:text-midnight shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {st === 'all' ? 'All Tenants' : st}
          </button>
        ))}
      </div>

      {/* Error Alert */}
      {fetchError && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-xl flex items-center justify-between gap-3 text-rose-800 dark:text-rose-300 shadow-sm">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            <div>
              <p className="text-xs font-bold">Failed to load tenant list from backend</p>
              <p className="text-[11px] text-rose-600 dark:text-rose-400">{fetchError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={fetchTenantsList}
            className="px-3 py-1 bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-200 text-xs font-bold rounded-lg hover:bg-rose-200 transition-colors shrink-0 cursor-pointer"
          >
            Retry API
          </button>
        </div>
      )}

      {/* Standard Shared UI Kit DataTable */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredTenants}
          searchPlaceholder="Search tenants by name or code..."
          emptyMessage={
            loading
              ? 'Loading SACCO tenants...'
              : 'No SACCO cooperatives match your filter.'
          }
          defaultPageSize={10}
        />
      </div>

      {/* Provisioning Form Modal */}
      <ProvisionTenantModal
        isOpen={showProvisionModal}
        onClose={() => setShowProvisionModal(false)}
        onSuccess={handleProvisionSuccess}
      />
    </div>
  );
}
