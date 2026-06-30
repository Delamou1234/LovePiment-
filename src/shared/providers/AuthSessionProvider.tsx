'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useRunAfterMount } from '@/shared/hooks/useRunAfterMount';
import { AVATAR_UPDATED_EVENT } from '@/modules/compte/lib/avatar-events';
import { confirmLogout, type LogoutRole } from '@/shared/lib/confirm-logout';
import {
  clearAuthMeCache,
  mapMeResponseToSessionUser,
  readAuthMeCache,
  writeAuthMeCache,
  type AuthSessionUser,
} from '@/shared/lib/auth/auth-session-user';

export type { AuthSessionUser };

type AuthSessionContextValue = {
  user: AuthSessionUser | null;
  loading: boolean;
  /** true après le premier paint client — évite les mismatches d'hydratation */
  hydrated: boolean;
  refresh: () => Promise<void>;
  logout: (role?: 'customer' | 'admin' | 'all') => Promise<void>;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export { clearAuthMeCache, seedAuthSessionAfterLogin } from '@/shared/lib/auth/auth-session-user';

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<AuthSessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const cached = readAuthMeCache();
    if (cached) setUser(cached);
    setHydrated(true);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!res.ok) {
        setUser(null);
        clearAuthMeCache();
        return;
      }

      const data = (await res.json()) as { user?: Record<string, unknown> | null };
      const nextUser = mapMeResponseToSessionUser(data.user);
      setUser(nextUser);
      writeAuthMeCache(nextUser);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(
    async (role: 'customer' | 'admin' | 'all' = 'customer') => {
      const confirmRole: LogoutRole =
        role === 'admin' ? 'admin' : role === 'all' ? 'customer' : 'customer';
      if (!(await confirmLogout(confirmRole))) return;

      await fetch(`/api/auth/logout?role=${role}`, {
        method: 'POST',
        credentials: 'include',
      });
      clearAuthMeCache();
      setUser(null);
    },
    [],
  );

  useRunAfterMount(() => {
    void refresh();
  }, [refresh, pathname]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refresh]);

  useEffect(() => {
    const onAvatarUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ avatarUrl: string | null }>).detail;
      setUser((prev) => {
        if (!prev) return prev;
        const next = { ...prev, avatarUrl: detail.avatarUrl ?? null };
        writeAuthMeCache(next);
        return next;
      });
      void refresh();
    };
    window.addEventListener(AVATAR_UPDATED_EVENT, onAvatarUpdated);
    return () => window.removeEventListener(AVATAR_UPDATED_EVENT, onAvatarUpdated);
  }, [refresh]);

  const value = useMemo(
    () => ({ user, loading, hydrated, refresh, logout }),
    [user, loading, hydrated, refresh, logout],
  );

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession() {
  const ctx = useContext(AuthSessionContext);
  if (!ctx) {
    throw new Error('useAuthSession doit être utilisé dans AuthSessionProvider');
  }
  return ctx;
}

/** Données client connecté (checkout, contact, etc.). */
export function useCustomerSession() {
  const { user, loading, hydrated, refresh } = useAuthSession();
  const isCustomer = user?.role === 'customer';
  return {
    customer: isCustomer ? user : null,
    loading,
    hydrated,
    refresh,
  };
}
