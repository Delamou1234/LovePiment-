'use client';

import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { ShopHeader } from '@/shared/ui/ShopHeader';
import { ShopFooter } from '@/shared/ui/ShopFooter';
import { BoutiqueWidgets } from './BoutiqueWidgets';
import type { BoutiqueNavLink } from '@/modules/produits/lib/boutique-nav';

type Props = {
  boutiqueNavLinks: BoutiqueNavLink[];
  boutiqueFooterLinks: { label: string; href: string }[];
  children: React.ReactNode;
};

function HeaderFallback() {
  return <div className="h-24 bg-[#0a0508] md:h-[6.75rem]" aria-hidden />;
}

export function BoutiqueLayoutShell({ boutiqueNavLinks, boutiqueFooterLinks, children }: Props) {
  const pathname = usePathname();
  const hideFooter = pathname === '/produits' || pathname === '/promos';
  const isHome = pathname === '/';

  return (
    <div
      className={`flex min-h-dvh flex-col overflow-x-clip bg-white${hideFooter ? ' boutique-layout--no-footer' : ''}${isHome ? ' boutique-layout--home' : ''}`}
    >
      <Suspense fallback={<HeaderFallback />}>
        <ShopHeader boutiqueLinks={boutiqueNavLinks} />
      </Suspense>
      <main className="flex-grow">{children}</main>
      {!hideFooter && <ShopFooter boutiqueLinks={boutiqueFooterLinks} />}
      <BoutiqueWidgets />
    </div>
  );
}
