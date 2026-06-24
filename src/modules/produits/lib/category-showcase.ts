/** Image par défaut si la catégorie n'a pas d'image en base. */
export const CATEGORIE_IMAGE_DEFAUT = '/images/love-piment-secret.png';

export type CategorieVitrine = {
  nom: string;
  slug: string;
  href: string;
  image: string;
  desc: string;
  produitsCount: number;
};

export function categorieVersVitrine(c: {
  nom: string;
  slug: string;
  image: string | null;
  produitsCount: number;
  childrenCount?: number;
}): CategorieVitrine {
  const desc =
    c.produitsCount > 0
      ? `${c.produitsCount} produit${c.produitsCount > 1 ? 's' : ''}`
      : c.childrenCount && c.childrenCount > 0
        ? `${c.childrenCount} sous-collection${c.childrenCount > 1 ? 's' : ''}`
        : 'Découvrir la collection';

  return {
    nom: c.nom,
    slug: c.slug,
    href: `/produits?categorie=${c.slug}`,
    image: c.image?.trim() || CATEGORIE_IMAGE_DEFAUT,
    desc,
    produitsCount: c.produitsCount,
  };
}
