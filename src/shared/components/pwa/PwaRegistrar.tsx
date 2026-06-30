'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { isClientPwaRoute, PWA_SW_PATH } from '@/shared/lib/pwa';

export function PwaRegistrar() {
  const pathname = usePathname();

  useEffect(() => {
    if (!isClientPwaRoute(pathname)) return;
    if (!('serviceWorker' in navigator)) return;

    const register = () => {
      void navigator.serviceWorker.register(PWA_SW_PATH, { scope: '/' }).catch((error) => {
        console.warn('[PWA] Enregistrement service worker échoué', error);
      });
    };

    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', register, { once: true });
    }
  }, [pathname]);

  return null;
}
