'use client';

import { createContext, useContext } from 'react';
import { useAdminMessagerie } from '@/modules/admin/hooks/useAdminMessagerie';

type AdminMessagerieState = ReturnType<typeof useAdminMessagerie>;

const AdminMessagerieContext = createContext<AdminMessagerieState | null>(null);

export function AdminMessagerieProvider({ children }: { children: React.ReactNode }) {
  const value = useAdminMessagerie(true);
  return (
    <AdminMessagerieContext.Provider value={value}>{children}</AdminMessagerieContext.Provider>
  );
}

export function useAdminMessagerieContext(): AdminMessagerieState {
  const ctx = useContext(AdminMessagerieContext);
  if (!ctx) {
    throw new Error('useAdminMessagerieContext must be used within AdminMessagerieProvider');
  }
  return ctx;
}
