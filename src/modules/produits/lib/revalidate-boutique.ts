import { revalidatePath, revalidateTag } from 'next/cache';

type RevalidateBoutiqueOptions = {
  productSlug?: string;
  reviews?: boolean;
};

/** Invalide le cache boutique après une mutation admin (catégories, produits, promos…). */
export function revalidateBoutique(options: RevalidateBoutiqueOptions = {}) {
  revalidateTag('products', 'max');
  revalidateTag('categories', 'max');
  revalidateTag('promos', 'max');
  revalidateTag('stock', 'max');

  if (options.reviews) {
    revalidateTag('reviews', 'max');
  }

  if (options.productSlug) {
    revalidateTag(`product-${options.productSlug}`, 'max');
    revalidatePath(`/produits/${options.productSlug}`);
  }

  revalidatePath('/', 'layout');
  revalidatePath('/');
  revalidatePath('/produits');
  revalidatePath('/promos');
  revalidatePath('/api/categories');
}
