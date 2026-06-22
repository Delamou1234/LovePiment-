import { Suspense } from 'react';
import { ShopHeader } from '@/shared/ui/ShopHeader';
import { ShopFooter } from '@/shared/ui/ShopFooter';
import { BoutiqueWidgets } from './BoutiqueWidgets';
import { BoutiqueProviders } from './BoutiqueProviders';
import { productService } from '@/modules/produits/services/product.service';
import { categorieVersVitrine } from '@/modules/produits/lib/category-showcase';
import { buildBoutiqueFooterLinks, buildBoutiqueNavLinks } from '@/modules/produits/lib/boutique-nav';

export const dynamic = 'force-dynamic';

function HeaderFallback() {
  return <div className="h-[7.5rem] border-b border-beige-border bg-cream lg:h-[5.5rem]" aria-hidden />;
}

export default async function BoutiqueLayout({ children }: { children: React.ReactNode }) {
  const categories = (await productService.listerCategoriesVitrine()).map(categorieVersVitrine);
  const boutiqueNavLinks = buildBoutiqueNavLinks(categories);
  const boutiqueFooterLinks = buildBoutiqueFooterLinks(categories);

  return (
    <BoutiqueProviders>
      <div className="flex min-h-screen flex-col overflow-x-clip bg-cream">
        <Suspense fallback={<HeaderFallback />}>
          <ShopHeader boutiqueLinks={boutiqueNavLinks} />
        </Suspense>
        <main className="flex-grow pb-28">{children}</main>
        <ShopFooter boutiqueLinks={boutiqueFooterLinks} />
        <BoutiqueWidgets />
      </div>
    </BoutiqueProviders>
  );
}
