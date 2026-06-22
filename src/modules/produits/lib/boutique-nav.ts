import type { CategorieVitrine } from '@/modules/produits/lib/category-showcase';

export type BoutiqueNavLink = {
  name: string;
  href: string;
  desc: string;
};

export function buildBoutiqueNavLinks(categories: CategorieVitrine[]): BoutiqueNavLink[] {
  return [
    { name: 'Toute la boutique', href: '/produits', desc: 'Tous nos produits' },
    ...categories.map((c) => ({ name: c.nom, href: c.href, desc: c.desc })),
    { name: 'Promotions', href: '/promos', desc: 'Offres du moment' },
  ];
}

export function buildBoutiqueFooterLinks(
  categories: CategorieVitrine[],
): { label: string; href: string }[] {
  return [
    { label: 'Tous les produits', href: '/produits' },
    ...categories.map((c) => ({ label: c.nom, href: c.href })),
    { label: 'Promotions', href: '/promos' },
  ];
}
