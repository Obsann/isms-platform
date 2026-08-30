'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import StatusBadge from '@/components/badges/StatusBadge';
import ProvisionTenantModal from '@/components/tenants/ProvisionTenantModal';
import {
  getTenants,
  updateTenant,
  deleteTenant,
  type TenantListItem,
} from '@/lib/api-client';
import type { Tenant, TenantStatus } from '@/types';
import {
  Globe,
  Plus,
  ShieldAlert,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Building2,
  ExternalLink,
} from 'lucide-react';

export default function SuperAdminTenantsPage() {
  const [tenants, setTenants] = useState<TenantListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
    } catch (err: any) {
      // Revert optimistic update
      setTenants((prev) =>
        prev.map((t) => (t.id === tenant.id ? { ...t, status: oldStatus } : t))
      );
      triggerToast(err?.message || 'Failed to update tenant status.', 'error');
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
    } catch (err: any) {
      triggerToast(err?.message || 'Failed to delete tenant.', 'error');
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

  const filteredTenants = tenants.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.code.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-8">
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

      {/* Prominent Platform Warning Banner */}
      <div className="bg-gradient-to-r from-amber-950/90 via-slate-900 to-amber-950/90 border border-amber-500/40 rounded-2xl p-4 sm:p-5 shadow-lg text-amber-100 flex items-start gap-4">
        <div className="p-3 bg-amber-500/20 rounded-xl text-amber-400 shrink-0 border border-amber-500/30">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-extrabold uppercase tracking-widest bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded-full font-mono">
              UNSCOPED PLATFORM PORTAL
            </span>
            <span className="text-xs font-bold text-amber-300">
              Operates Outside Per-Tenant RLS Scoping
            </span>
          </div>
          <h3 className="text-sm font-bold text-amber-200 mt-1">
            Global Tenant Registry & Provisioning Console
          </h3>
          <p className="text-xs text-amber-200/80 mt-0.5 leading-relaxed">
            All tenant management operations (provisioning, activation, suspension, deletion) on this page execute at the <strong>platform level</strong> without single-tenant isolation boundaries. Every action directly modifies the platform-wide SACCO tenant registry.
          </p>
        </div>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
              Platform Admin
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
              /platform/tenants
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-serif">
            SACCO Tenant Registry
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Provision and manage tenant instances across the ISMS platform.
          </p>
        </div>

        <button
          onClick={() => setShowProvisionModal(true)}
          className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Provision New Tenant</span>
        </button>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by tenant name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={fetchTenantsList}
            disabled={loading}
            className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-amber-600 rounded-xl transition-colors shrink-0 cursor-pointer"
            title="Refresh tenant list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {(['all', 'active', 'provisioning', 'suspended'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer shrink-0 ${
                statusFilter === st
                  ? 'bg-slate-900 text-amber-400 dark:bg-amber-600 dark:text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {st === 'all' ? 'All Tenants' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Error Alert */}
      {fetchError && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-xl flex items-center justify-between gap-3 text-rose-800 dark:text-rose-300">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            <div>
              <p className="text-xs font-bold">Failed to load live tenant list from backend</p>
              <p className="text-[11px] text-rose-600 dark:text-rose-400">{fetchError}</p>
            </div>
          </div>
          <button
            onClick={fetchTenantsList}
            className="px-3 py-1 bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-200 text-xs font-bold rounded-lg hover:bg-rose-200 transition-colors shrink-0"
          >
            Retry API
          </button>
        </div>
      )}

      {/* Tenant List */}
      <div className="space-y-3">
        {loading ? (
          // Loading skeleton
          [1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 animate-pulse"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="h-5 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
              <div className="h-6 w-64 bg-slate-200 dark:bg-slate-800 rounded mb-2" />
              <div className="h-4 w-48 bg-slate-100 dark:bg-slate-800/60 rounded" />
            </div>
          ))
        ) : filteredTenants.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-3">
              <Building2 className="w-10 h-10 mx-auto text-slate-400/60" />
              <div>
                <p className="text-base font-bold text-slate-700 dark:text-slate-300">
                  No Tenants Found
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                  {fetchError
                    ? 'Could not connect to backend server. Ensure backend is running.'
                    : 'No tenants match your search filter. Click "Provision New Tenant" to create one.'}
                </p>
              </div>
              <button
                onClick={() => setShowProvisionModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow transition-all"
              >
                <Plus className="w-4 h-4" /> Provision New SACCO Tenant
              </button>
            </CardContent>
          </Card>
        ) : (
          filteredTenants.map((tenant) => (
            <Card
              key={tenant.id}
              className="hover:border-amber-300 dark:hover:border-amber-700/60 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 px-2 py-0.5 rounded">
                      {tenant.code}
                    </span>
                    <StatusBadge status={tenant.status} size="sm" />
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                      Platform Scoped
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg font-serif">
                    {tenant.name}
                  </h3>

                  <div className="flex items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                    <span className="font-mono text-[11px]">ID: {tenant.id}</span>
                    <span>•</span>
                    <span>
                      Created: {tenant.createdAt ? tenant.createdAt.split('T')[0] : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Actions Toolbar */}
                <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => handleStatusToggle(tenant)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                      tenant.status === 'active'
                        ? 'border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                        : 'border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                    }`}
                  >
                    {tenant.status === 'active' ? 'Suspend' : 'Activate'}
                  </button>

                  <button
                    onClick={() => handleDeleteTenant(tenant)}
                    disabled={deletingId === tenant.id}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer disabled:opacity-50"
                    title="Delete tenant (Platform Level)"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
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
