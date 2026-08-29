'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  SaccoMember,
  Vendor,
  RiskItem,
  AssetItem,
  SaccoAuditLog,
  ComplianceFramework,
  SaccoUserProfile,
  NotificationItem,
  FinancialMetric,
} from '@/types/isms';
import {
  initialMembers,
  initialVendors,
  initialFinancialMetrics,
  initialRisks,
  initialAssets,
  initialAuditLogs,
  initialComplianceFrameworks,
  currentUserProfile,
  initialNotifications,
} from '@/data/mockData';

export interface AppMember {
  id: string;
  name: string;
  fullName?: string;
  faydaId?: string;
  nationalId?: string;
  savingsBalance: number;
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type?: 'success' | 'error' | 'info' | 'warning';
}

interface AppState {
  // Data
  members: SaccoMember[];
  vendors: Vendor[];
  risks: RiskItem[];
  assets: AssetItem[];
  auditLogs: SaccoAuditLog[];
  complianceFrameworks: ComplianceFramework[];
  financialMetrics: FinancialMetric[];
  notifications: NotificationItem[];
  userProfile: SaccoUserProfile;
  // UI
  darkMode: boolean;
  toast: ToastMessage | null;
  // Modal state
  selectedVendor: Vendor | null;
  quickScanType: 'primary' | 'secondary' | null;
  searchModalOpen: boolean;
  helpModalOpen: boolean;
  addRiskModalOpen: boolean;
  addAssetModalOpen: boolean;
  // Actions
  addMember: (m: Omit<SaccoMember, 'id' | 'joinedDate'>) => void;
  updateMember: (m: SaccoMember) => void;
  deleteMember: (id: string) => void;
  addVendor: (v: Omit<Vendor, 'id' | 'dateAdded'>) => void;
  updateVendor: (v: Vendor) => void;
  deleteVendor: (id: string) => void;
  addRisk: (r: RiskItem) => void;
  deleteRisk: (id: string) => void;
  addAsset: (a: AssetItem) => void;
  deleteAsset: (id: string) => void;
  toggleFinancialMask: (id: string) => void;
  markNotificationRead: (id: string) => void;
  showToast: (titleOrMsg: string, descriptionOrType?: string, type?: ToastMessage['type']) => void;
  closeToast: () => void;
  toggleDarkMode: () => void;
  updateProfile: (p: SaccoUserProfile) => void;
  addAuditLog: (action: string, category: SaccoAuditLog['category'], details: string) => void;
  setSelectedVendor: (v: Vendor | null) => void;
  setQuickScanType: (t: 'primary' | 'secondary' | null) => void;
  setSearchModalOpen: (open: boolean) => void;
  setHelpModalOpen: (open: boolean) => void;
  setAddRiskModalOpen: (open: boolean) => void;
  setAddAssetModalOpen: (open: boolean) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [members, setMembers] = useState<SaccoMember[]>(initialMembers);
  const [vendors, setVendors] = useState<Vendor[]>(initialVendors);
  const [risks, setRisks] = useState<RiskItem[]>(initialRisks);
  const [assets, setAssets] = useState<AssetItem[]>(initialAssets);
  const [auditLogs, setAuditLogs] = useState<SaccoAuditLog[]>(initialAuditLogs);
  const [complianceFrameworks] = useState<ComplianceFramework[]>(initialComplianceFrameworks);
  const [financialMetrics, setFinancialMetrics] = useState<FinancialMetric[]>(initialFinancialMetrics);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [userProfile, setUserProfile] = useState<SaccoUserProfile>(currentUserProfile);
  const [darkMode, setDarkMode] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [quickScanType, setQuickScanType] = useState<'primary' | 'secondary' | null>(null);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [addRiskModalOpen, setAddRiskModalOpen] = useState(false);
  const [addAssetModalOpen, setAddAssetModalOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sacco_dark_mode');
    if (saved !== null) {
      setDarkMode(saved === 'true');
    } else {
      setDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('sacco_dark_mode', 'true');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('sacco_dark_mode', 'false');
    }
  }, [darkMode]);

  const addAuditLog = useCallback((action: string, category: SaccoAuditLog['category'], details: string) => {
    const newLog: SaccoAuditLog = {
      id: `LOG-${Math.floor(9000 + Math.random() * 999)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user: userProfile.email,
      action,
      category,
      details,
      status: 'Success',
      ipAddress: '192.168.1.104',
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  }, [userProfile.email]);

  const showToast = useCallback((titleOrMsg: string, descriptionOrType?: string, type: ToastMessage['type'] = 'success') => {
    const isType = (val?: string): val is ToastMessage['type'] =>
      val === 'success' || val === 'error' || val === 'info' || val === 'warning';

    const finalDescription = isType(descriptionOrType) ? undefined : descriptionOrType;
    const finalType = isType(descriptionOrType) ? descriptionOrType : (type || 'success');

    setToast({ id: Date.now().toString(), title: titleOrMsg, description: finalDescription, type: finalType });
  }, []);

  const addMember = useCallback((data: Omit<SaccoMember, 'id' | 'joinedDate'>) => {
    const m: SaccoMember = { ...data, id: `MEM-${Math.floor(1000 + Math.random() * 9000)}`, joinedDate: new Date().toISOString().split('T')[0] };
    setMembers((prev) => [m, ...prev]);
    addAuditLog(`Registered Member: ${m.fullName}`, 'Data Entry', `Registered member ${m.id}`);
  }, [addAuditLog]);

  const updateMember = useCallback((m: SaccoMember) => {
    setMembers((prev) => prev.map((x) => (x.id === m.id ? m : x)));
    addAuditLog(`Updated Member: ${m.fullName}`, 'Data Entry', `Updated status to ${m.status}`);
  }, [addAuditLog]);

  const deleteMember = useCallback((id: string) => {
    setMembers((prev) => { const t = prev.find((m) => m.id === id); const next = prev.filter((m) => m.id !== id); if (t) addAuditLog(`Deleted Member: ${t.fullName}`, 'Data Entry', `Removed member ${id}`); return next; });
  }, [addAuditLog]);

  const addVendor = useCallback((data: Omit<Vendor, 'id' | 'dateAdded'>) => {
    const v: Vendor = { ...data, id: `v-${Date.now()}`, dateAdded: new Date().toISOString().split('T')[0] };
    setVendors((prev) => [v, ...prev]);
    addAuditLog(`Added Vendor: ${v.name}`, 'Data Entry', `Added new vendor with score ${v.auditScore ?? 85}`);
  }, [addAuditLog]);

  const updateVendor = useCallback((v: Vendor) => {
    setVendors((prev) => prev.map((x) => (x.id === v.id ? v : x)));
    addAuditLog(`Updated Vendor: ${v.name}`, 'Data Entry', `Updated status to ${v.status}`);
  }, [addAuditLog]);

  const deleteVendor = useCallback((id: string) => {
    setVendors((prev) => { const t = prev.find((v) => v.id === id); const next = prev.filter((v) => v.id !== id); if (t) addAuditLog(`Deleted Vendor: ${t.name}`, 'Data Entry', `Removed vendor ${id}`); return next; });
  }, [addAuditLog]);

  const addRisk = useCallback((r: RiskItem) => { setRisks((prev) => [r, ...prev]); addAuditLog(`Registered Risk: ${r.title}`, 'Risk Action', `Added risk ${r.id}`); }, [addAuditLog]);
  const deleteRisk = useCallback((id: string) => { setRisks((prev) => prev.filter((r) => r.id !== id)); addAuditLog(`Resolved Risk: ${id}`, 'Risk Action', `Removed risk ${id}`); }, [addAuditLog]);
  const addAsset = useCallback((a: AssetItem) => { setAssets((prev) => [a, ...prev]); addAuditLog(`Registered Asset: ${a.name}`, 'Settings', `Added asset ${a.id}`); }, [addAuditLog]);
  const deleteAsset = useCallback((id: string) => { setAssets((prev) => prev.filter((a) => a.id !== id)); addAuditLog(`Decommissioned Asset: ${id}`, 'Settings', `Removed asset ${id}`); }, [addAuditLog]);
  const toggleFinancialMask = useCallback((id: string) => { setFinancialMetrics((prev) => prev.map((m) => (m.id === id ? { ...m, isMasked: !m.isMasked } : m))); }, []);
  const markNotificationRead = useCallback((id: string) => { setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n))); }, []);
  const closeToast = useCallback(() => setToast(null), []);
  const toggleDarkMode = useCallback(() => setDarkMode((d) => !d), []);
  const updateProfile = useCallback((p: SaccoUserProfile) => setUserProfile(p), []);

  return (
    <AppContext.Provider value={{
      members, vendors, risks, assets, auditLogs, complianceFrameworks, financialMetrics, notifications, userProfile,
      darkMode, toast,
      selectedVendor, quickScanType, searchModalOpen, helpModalOpen, addRiskModalOpen, addAssetModalOpen,
      addMember, updateMember, deleteMember,
      addVendor, updateVendor, deleteVendor,
      addRisk, deleteRisk, addAsset, deleteAsset,
      toggleFinancialMask, markNotificationRead,
      showToast, closeToast, toggleDarkMode, updateProfile, addAuditLog,
      setSelectedVendor, setQuickScanType, setSearchModalOpen, setHelpModalOpen, setAddRiskModalOpen, setAddAssetModalOpen,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) {
    return {
      members: [], vendors: [], risks: [], assets: [], auditLogs: [], complianceFrameworks: [], financialMetrics: [], notifications: [],
      userProfile: { name: '', email: '', role: '', title: '', department: '', phone: '', location: '', mfaEnabled: false, clearance: '', avatarUrl: '' },
      darkMode: false, toast: null, selectedVendor: null, quickScanType: null, searchModalOpen: false, helpModalOpen: false, addRiskModalOpen: false, addAssetModalOpen: false,
      addMember: () => {}, updateMember: () => {}, deleteMember: () => {},
      addVendor: () => {}, updateVendor: () => {}, deleteVendor: () => {},
      addRisk: () => {}, deleteRisk: () => {}, addAsset: () => {}, deleteAsset: () => {},
      toggleFinancialMask: () => {}, markNotificationRead: () => {},
      showToast: () => {}, closeToast: () => {}, toggleDarkMode: () => {}, updateProfile: () => {}, addAuditLog: () => {},
      setSelectedVendor: () => {}, setQuickScanType: () => {}, setSearchModalOpen: () => {}, setHelpModalOpen: () => {}, setAddRiskModalOpen: () => {}, setAddAssetModalOpen: () => {},
    };
  }
  return ctx;
}
