import type { WishlistItemClient } from '@/modules/compte/types';

type WishlistRow = Awaited<
  ReturnType<
    typeof import('@/modules/auth/repository/customer-auth.repository').customerAuthRepository.listerWishlist
  >
>[number];

export function serialiserWishlistItems(items: WishlistRow[]): WishlistItemClient[] {
  return items.map((item) => ({
    id: item.id,
    productId: item.productId,
    addedAt: item.createdAt.toISOString(),
    product: {
      id: item.product.id,
      nom: item.product.nom,
      slug: item.product.slug,
      prix: Number(item.product.prix),
      prixPromo: item.product.prixPromo ? Number(item.product.prixPromo) : null,
      image: item.product.images[0] ?? null,
      categorie: item.product.categorie.nom,
      enStock: (item.product.variantes?.[0]?.stock ?? 0) > 0,
      variante: item.product.variantes?.[0]
        ? {
            id: item.product.variantes[0].id,
            stock: item.product.variantes[0].stock,
          }
        : null,
    },
  }));
}
