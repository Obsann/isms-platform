'use client';

import React, { useState } from 'react';
import {
  Globe,
  ShieldAlert,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { apiClient, ApiRequestError } from '@/lib/api-client';
import type { Tenant, TenantStatus } from '@/types';

interface ProvisionTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newTenant: Tenant) => void;
}

export default function ProvisionTenantModal({
  isOpen,
  onClose,
  onSuccess,
}: ProvisionTenantModalProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<TenantStatus>('active');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const generateSlug = (val: string) => {
    return val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 30);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!code || code === generateSlug(name)) {
      setCode(generateSlug(val));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmedName = name.trim();
    const trimmedCode = code.trim().toLowerCase();

    if (!trimmedName || !trimmedCode) {
      setErrorMsg('Both Organization Name and Tenant Code are required.');
      return;
    }

    if (trimmedCode.length < 2) {
      setErrorMsg('Tenant code must be at least 2 characters.');
      return;
    }

    if (!/^[a-z0-9-_]+$/i.test(trimmedCode)) {
      setErrorMsg('Tenant code can only contain letters, numbers, hyphens, and underscores.');
      return;
    }

    setLoading(true);

    try {
      const created = await apiClient.post<Tenant>('/platform/tenants', {
        name: trimmedName,
        code: trimmedCode,
        status,
      });

      setSuccessMsg(`Tenant "${created.name}" (${created.code}) provisioned successfully!`);
      setTimeout(() => {
        onSuccess(created);
        handleResetAndClose();
      }, 1000);
    } catch (err: unknown) {
      if (err instanceof ApiRequestError) {
        setErrorMsg(err.messages.join(' '));
      } else if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Failed to provision tenant. Please check network connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setName('');
    setCode('');
    setStatus('active');
    setErrorMsg(null);
    setSuccessMsg(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-midnight text-gold dark:bg-gold/15 dark:text-gold flex items-center justify-center font-bold border border-gold/30 shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                Provision New SACCO Tenant
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  <ShieldAlert className="w-3 h-3" /> Platform-Level Scope (Outside Tenant RLS)
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            disabled={loading}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Platform Warning Notice */}
        <div className="mx-6 mt-5 p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Platform-Level Action:</span> This operation registers a new global tenant root entity. It initializes the isolated tenant context and default Chart of Accounts.
          </div>
        </div>

        {/* Alerts */}
        <div className="px-6 pt-4 space-y-3">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-xl text-xs font-medium text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMsg}</div>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 rounded-xl text-xs font-medium text-emerald-700 dark:text-emerald-300 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1">{successMsg}</div>
            </div>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              SACCO Organization Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Addis Ababa Teachers SACCO"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-colors"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Official legal or display name of the SACCO organization.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Tenant Code (Slug Identifier) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toLowerCase().trim())}
                placeholder="e.g. aat-sacco"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-colors"
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              URL-friendly slug used for tenant context resolution. Lowercase letters, numbers, hyphens only.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Initial Provisioning Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TenantStatus)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-colors"
            >
              <option value="active">Active (Ready for operational use)</option>
              <option value="provisioning">Provisioning (Setup in progress)</option>
              <option value="suspended">Suspended (Access restricted)</option>
            </select>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleResetAndClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-midnight text-gold hover:bg-midnight-light dark:bg-gold dark:text-midnight dark:hover:bg-gold-light text-xs font-bold shadow-sm hover:shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Provisioning Tenant...
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4" /> Provision Tenant
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
