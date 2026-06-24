import { BoutiqueProviders } from './BoutiqueProviders';
import { BoutiqueLayoutShell } from './BoutiqueLayoutShell';
import { productService } from '@/modules/produits/services/product.service';
import { categorieVersVitrine } from '@/modules/produits/lib/category-showcase';
import { buildBoutiqueFooterLinks, buildBoutiqueNavLinks } from '@/modules/produits/lib/boutique-nav';

export const dynamic = 'force-dynamic';

export default async function BoutiqueLayout({ children }: { children: React.ReactNode }) {
  const categories = (await productService.listerCategoriesVitrine()).map(categorieVersVitrine);
  const boutiqueNavLinks = buildBoutiqueNavLinks(categories);
  const boutiqueFooterLinks = buildBoutiqueFooterLinks(categories);

  return (
    <BoutiqueProviders>
      <BoutiqueLayoutShell
        boutiqueNavLinks={boutiqueNavLinks}
        boutiqueFooterLinks={boutiqueFooterLinks}
      >
        {children}
      </BoutiqueLayoutShell>
    </BoutiqueProviders>
  );
}
