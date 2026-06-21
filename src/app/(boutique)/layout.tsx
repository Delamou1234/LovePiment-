import { ShopHeader } from '@/shared/ui/ShopHeader';
import { ShopFooter } from '@/shared/ui/ShopFooter';
import { BoutiqueWidgets } from './BoutiqueWidgets';
import { BoutiqueProviders } from './BoutiqueProviders';

export default function BoutiqueLayout({ children }: { children: React.ReactNode }) {
  return (
    <BoutiqueProviders>
      <div className="flex min-h-screen flex-col bg-white">
        <ShopHeader />
        <main className="flex-grow pb-28">{children}</main>
        <ShopFooter />
        <BoutiqueWidgets />
      </div>
    </BoutiqueProviders>
  );
}
