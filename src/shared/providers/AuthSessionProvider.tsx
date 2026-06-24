'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import { AVATAR_UPDATED_EVENT } from '@/modules/compte/lib/avatar-events';
import { confirmLogout, type LogoutRole } from '@/shared/lib/confirm-logout';

export type AuthSessionUser = {
  name: string;
  email: string;
  role: 'admin' | 'customer';
  avatarUrl?: string | null;
};

type AuthSessionContextValue = {
  user: AuthSessionUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: (role?: 'customer' | 'admin' | 'all') => Promise<void>;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export const AUTH_ME_CACHE_KEY = 'lovepiment_auth_me_v2';

export function clearAuthMeCache() {
  try {
    sessionStorage.removeItem(AUTH_ME_CACHE_KEY);
  } catch {
    /* ignore */
  }
}

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<AuthSessionUser | null>(null);
  const [loading, setLoading] = useState(true);

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

      const data = (await res.json()) as {
        user?: {
          name: string;
          email: string;
          role: 'admin' | 'customer';
          avatarUrl?: string | null;
        } | null;
      };

      const nextUser =
        data.user?.role === 'customer'
          ? ({
              name: data.user.name,
              email: data.user.email,
              role: 'customer' as const,
              avatarUrl: data.user.avatarUrl ?? null,
            } satisfies AuthSessionUser)
          : null;

      setUser(nextUser);
      try {
        sessionStorage.setItem(
          AUTH_ME_CACHE_KEY,
          JSON.stringify({ user: nextUser, ts: Date.now() }),
        );
      } catch {
        /* ignore */
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(
    async (role: 'customer' | 'admin' | 'all' = 'customer') => {
      const confirmRole: LogoutRole = role === 'admin' ? 'admin' : 'customer';
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

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(AUTH_ME_CACHE_KEY);
      if (raw) {
        const { user: cached } = JSON.parse(raw) as { user: AuthSessionUser | null; ts: number };
        if (cached?.role === 'customer') setUser(cached);
      }
    } catch {
      /* ignore */
    }

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
        if (!prev || prev.role !== 'customer') return prev;
        const next = { ...prev, avatarUrl: detail.avatarUrl ?? null };
        try {
          sessionStorage.setItem(
            AUTH_ME_CACHE_KEY,
            JSON.stringify({ user: next, ts: Date.now() }),
          );
        } catch {
          /* ignore */
        }
        return next;
      });
      void refresh();
    };
    window.addEventListener(AVATAR_UPDATED_EVENT, onAvatarUpdated);
    return () => window.removeEventListener(AVATAR_UPDATED_EVENT, onAvatarUpdated);
  }, [refresh]);

  const value = useMemo(
    () => ({ user, loading, refresh, logout }),
    [user, loading, refresh, logout],
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
