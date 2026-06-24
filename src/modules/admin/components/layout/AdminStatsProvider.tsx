'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRunAfterMount } from '@/shared/hooks/useRunAfterMount';
import type { AdminDashboardStats } from '@/modules/admin/services/admin-stats.service';

type AdminStatsContextValue = {
  stats: AdminDashboardStats | null;
  refresh: () => Promise<void>;
};

const AdminStatsContext = createContext<AdminStatsContextValue>({
  stats: null,
  refresh: async () => {},
});

const POLL_MS = 30_000;

export function AdminStatsProvider({ children }: { children: React.ReactNode }) {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/stats', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats ?? null);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useRunAfterMount(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const interval = setInterval(refresh, POLL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  return (
    <AdminStatsContext.Provider value={{ stats, refresh }}>
      {children}
    </AdminStatsContext.Provider>
  );
}

export function useAdminStats() {
  return useContext(AdminStatsContext);
}
