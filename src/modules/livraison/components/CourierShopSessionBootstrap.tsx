'use client';

import { useRunAfterMount } from '@/shared/hooks/useRunAfterMount';

/** Active la session client pour un livreur qui navigue sur la boutique. */
export function CourierShopSessionBootstrap() {
  useRunAfterMount(() => {
    void fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user?.role !== 'courier') return;
        return fetch('/api/livreur/compte-client', {
          method: 'POST',
          credentials: 'include',
        });
      })
      .catch(() => {});
  }, []);

  return null;
}
