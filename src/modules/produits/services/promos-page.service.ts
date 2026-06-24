import { marketingService } from '@/modules/marketing/services/marketing.service';
import { productService } from '@/modules/produits/services/product.service';
import { calculerRemisePct, formaterDatePromo, versDatePromo } from '@/modules/produits/lib/promo';
import type { Category } from '@prisma/client';
import type { ProduitAvecCategorie } from '@/modules/produits/types';

export type PromoProduitEnrichi = ProduitAvecCategorie & {
  prixNum: number;
  prixPromoNum: number | null;
  remisePct: number;
};

export type CategorieAvecPromos = Category & { promoCount: number };

export type CouponPublic = {
  id: string;
  code: string;
  label: string;
  fin: string | null;
  minCommande: number | null;
};

export type FlashPromoBlock = {
  id: string;
  titre: string;
  slug: string;
  description: string | null;
  fin: Date;
  produits: PromoProduitEnrichi[];
};

function enrichirProduit(p: ProduitAvecCategorie): PromoProduitEnrichi {
  const prixNum = Number(p.prix);
  const prixPromoNum = p.prixPromo != null ? Number(p.prixPromo) : null;
  return {
    ...p,
    prixNum,
    prixPromoNum,
    remisePct:
      prixPromoNum != null ? calculerRemisePct(prixNum, prixPromoNum) : 0,
  };
}

function libelleCoupon(type: string, valeur: number): string {
  if (type === 'POURCENT') return `-${Math.round(valeur)}%`;
  return `-${valeur.toLocaleString('fr-FR')} GN`;
}

export const promosPageService = {
  async charger(categorieSlug?: string) {
    const [categories, tousPromos, flash, couponsBruts] = await Promise.all([
      productService.listerCategories(),
      productService.listerPromotionsActives(),
      marketingService.obtenirFlashActive(),
      marketingService.listerCouponsActifsPublics(),
    ]);

    const tousEnrichis = tousPromos.map(enrichirProduit);

    const compteurParCategorie = new Map<string, number>();
    for (const p of tousEnrichis) {
      const slug = p.categorie.slug;
      compteurParCategorie.set(slug, (compteurParCategorie.get(slug) ?? 0) + 1);
    }

    const categoriesAvecPromos: CategorieAvecPromos[] = categories
      .map((c) => ({
        ...c,
        promoCount: compteurParCategorie.get(c.slug) ?? 0,
      }))
      .filter((c) => c.promoCount > 0);

    const produitsFiltres = categorieSlug
      ? (await productService.listerPromotionsActives({ categorieSlug })).map(enrichirProduit)
      : tousEnrichis;

    const remises = tousEnrichis.map((p) => p.remisePct).filter((r) => r > 0);
    const stats = {
      total: tousEnrichis.length,
      remiseMax: remises.length ? Math.max(...remises) : 0,
    };

    const prochaineFin =
      tousEnrichis
        .map((p) => versDatePromo(p.promoFin))
        .filter((d): d is Date => d != null)
        .sort((a, b) => a.getTime() - b.getTime())[0] ?? null;

    let flashBlock: FlashPromoBlock | null = null;
    if (flash) {
      const flashProduitsRaw =
        flash.productIds.length > 0
          ? await productService.obtenirProduitsParIds(flash.productIds)
          : [];
      flashBlock = {
        id: flash.id,
        titre: flash.titre,
        slug: flash.slug,
        description: flash.description,
        fin: flash.fin,
        produits: flashProduitsRaw.map(enrichirProduit),
      };
    }

    const coupons: CouponPublic[] = couponsBruts.map((c) => ({
      id: c.id,
      code: c.code,
      label: libelleCoupon(c.type, Number(c.valeur)),
      fin: c.fin ? formaterDatePromo(c.fin) : null,
      minCommande: c.minCommande != null ? Number(c.minCommande) : null,
    }));

    return {
      categories: categoriesAvecPromos,
      produits: produitsFiltres,
      stats,
      prochaineFin,
      flash: flashBlock,
      coupons,
    };
  },
};
