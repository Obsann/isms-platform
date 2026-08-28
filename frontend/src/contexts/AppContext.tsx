'use client';

import React, { createContext, useContext, useState } from 'react';

export interface AppMember {
  id: string;
  name: string;
  fullName?: string;
  faydaId?: string;
  nationalId?: string;
  savingsBalance: number;
}

interface AppContextType {
  members: AppMember[];
  showToast: (titleOrMsg: string, descriptionOrType?: string, type?: 'success' | 'error' | 'info') => void;
}

const defaultMembers: AppMember[] = [
  { id: 'MEM-1001', name: 'Abebe Bikila', fullName: 'Abebe Bikila', faydaId: 'FIN-1001', nationalId: 'ETH-1001', savingsBalance: 45230 },
  { id: 'MEM-1002', name: 'Tigist Assefa', fullName: 'Tigist Assefa', faydaId: 'FIN-1002', nationalId: 'ETH-1002', savingsBalance: 128500 },
  { id: 'MEM-1003', name: 'Mulugeta Seretse', fullName: 'Mulugeta Seretse', faydaId: 'FIN-1003', nationalId: 'ETH-1003', savingsBalance: 35000 },
  { id: 'MEM-1004', name: 'Hirut Bekele', fullName: 'Hirut Bekele', faydaId: 'FIN-1004', nationalId: 'ETH-1004', savingsBalance: 892100 },
  { id: 'MEM-1005', name: 'Kassahun Tadesse', fullName: 'Kassahun Tadesse', faydaId: 'FIN-1005', nationalId: 'ETH-1005', savingsBalance: 50000 },
];

const AppContext = createContext<AppContextType>({
  members: defaultMembers,
  showToast: (msg: string) => console.log('[Toast]', msg),
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [members] = useState<AppMember[]>(defaultMembers);

  const showToast = (titleOrMsg: string, descriptionOrType?: string, type?: 'success' | 'error' | 'info') => {
    console.log(`[Toast] ${titleOrMsg} - ${descriptionOrType || ''} (${type || 'info'})`);
  };

  return (
    <AppContext.Provider value={{ members, showToast }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
