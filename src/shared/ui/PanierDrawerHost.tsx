'use client';

import dynamic from 'next/dynamic';
import { useEffect } from 'react';

const CartDrawer = dynamic(
  () => import('@/shared/ui/CartDrawer').then((m) => ({ default: m.CartDrawer })),
  { ssr: false },
);

/** Panier latéral partagé (boutique + espace client). */
export function PanierDrawerHost() {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void import('@/shared/ui/CartDrawer');
    }, 1200);
    return () => window.clearTimeout(timer);
  }, []);

  return <CartDrawer />;
}
