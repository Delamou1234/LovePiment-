import { BoutiqueProviders } from './BoutiqueProviders';
import { BoutiqueLayoutShell } from './BoutiqueLayoutShell';
import { getCachedHomeCategories } from '@/modules/produits/lib/cached-queries';
import { buildBoutiqueFooterLinks, buildBoutiqueNavLinks } from '@/modules/produits/lib/boutique-nav';

/** Nav/footer partagés — régénérés toutes les 2 min (invalidation via revalidateBoutique). */
export const revalidate = 120;

export default async function BoutiqueLayout({ children }: { children: React.ReactNode }) {
  const categories = await getCachedHomeCategories();
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
