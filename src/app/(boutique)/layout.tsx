'use client';

import { ShopHeader } from '@/shared/ui/ShopHeader';
import { ShopFooter } from '@/shared/ui/ShopFooter';
import { CartDrawer } from '@/shared/ui/CartDrawer';
import { WhatsAppFloatingButton } from '@/shared/ui/WhatsAppFloatingButton';
import { TrackingProvider } from '@/shared/components/TrackingProvider';

export default function BoutiqueLayout({ children }: { children: React.ReactNode }) {
  return (
    <TrackingProvider>
      <div className="flex min-h-screen flex-col bg-white">
        <ShopHeader />
        <main className="flex-grow">{children}</main>
        <ShopFooter />
        <CartDrawer />
        <WhatsAppFloatingButton />
      </div>
    </TrackingProvider>
  );
}
