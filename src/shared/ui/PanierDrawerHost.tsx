'use client';

import dynamic from 'next/dynamic';

const CartDrawer = dynamic(
  () => import('@/shared/ui/CartDrawer').then((m) => ({ default: m.CartDrawer })),
  { ssr: false },
);

/** Panier latéral partagé (boutique + espace client). */
export function PanierDrawerHost() {
  return <CartDrawer />;
}
