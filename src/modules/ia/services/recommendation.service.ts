import { prisma } from '@/shared/lib/prisma';
import { geminiGenerateJson, isGeminiConfigured } from '@/shared/lib/gemini/client';
import {
  formaterCataloguePourPrompt,
  obtenirCatalogueIa,
  produitsParIds,
} from '../lib/catalog-context';
import { formaterProfilBeautePourIa, type BeautyProfile } from '../lib/beauty-profile';
import type { ProduitRecommande } from '../types';

const SYSTEM = `Tu es le moteur de recommandations KabiShop (parfums, huiles pour la peau, crèmes corporelles, Guinée).
Sélectionne les produits les plus pertinents pour le client selon son historique de navigation et panier.
Réponds en JSON avec productIds (tableau d'IDs exacts du catalogue) et reasons (objet id→raison courte en français).`;

type GeminiRecs = {
  productIds?: string[];
  reasons?: Record<string, string>;
};

export class RecommendationService {
  async recommanderPersonnalise(input: {
    viewedProductIds?: string[];
    cartProductIds?: string[];
    beautyProfile?: BeautyProfile | null;
    excludeProductId?: string;
    limit?: number;
  }): Promise<{ products: ProduitRecommande[]; poweredByAi: boolean }> {
    const limit = input.limit ?? 8;
    const viewed = input.viewedProductIds ?? [];
    const cart = input.cartProductIds ?? [];
    const beautyProfile = input.beautyProfile ?? null;

    if (isGeminiConfigured()) {
      try {
        const ai = await this.recommanderViaGemini(
          viewed,
          cart,
          beautyProfile,
          input.excludeProductId,
          limit,
        );
        if (ai.length > 0) {
          return { products: ai, poweredByAi: true };
        }
      } catch (error) {
        console.error('[RecommendationService personnalise]', error);
      }
    }

    return {
      products: await this.recommanderFallback(
        viewed,
        cart,
        beautyProfile,
        input.excludeProductId,
        limit,
      ),
      poweredByAi: false,
    };
  }

  async recommanderSimilairesIa(
    productId: string,
    categorieId: string,
    limit = 4,
  ): Promise<{ products: ProduitRecommande[]; poweredByAi: boolean }> {
    try {
      const produit = await prisma.product.findUnique({
        where: { id: productId },
        include: { categorie: true },
      });
      if (!produit) return { products: [], poweredByAi: false };

      if (isGeminiConfigured()) {
        try {
          const catalogue = await obtenirCatalogueIa(100);
          const catalogText = formaterCataloguePourPrompt(catalogue.filter((p) => p.id !== productId));

          const parsed = await geminiGenerateJson<GeminiRecs>(
            SYSTEM,
            `Produit consulté: ${produit.nom} (${produit.categorie.nom}). Description: ${(produit.description ?? '').slice(0, 200)}
CATALOGUE (sans le produit actuel):
${catalogText}

Choisis ${limit} produits complémentaires ou similaires. JSON: {"productIds":["id1"],"reasons":{"id1":"..."}}`,
          );

          if (parsed?.productIds?.length) {
            const ids = parsed.productIds.slice(0, limit);
            const items = await produitsParIds(ids);
            return {
              products: items.map((p) => ({
                ...p,
                raison: parsed.reasons?.[p.id],
              })),
              poweredByAi: true,
            };
          }
        } catch (error) {
          console.error('[RecommendationService similaires]', error);
        }
      }

      return {
        products: await this.similairesFallback(productId, categorieId, limit),
        poweredByAi: false,
      };
    } catch (error) {
      console.error('[RecommendationService similaires]', error);
      return { products: [], poweredByAi: false };
    }
  }

  private async similairesFallback(productId: string, categorieId: string, limit: number) {
    const similaires = await prisma.product.findMany({
      where: { actif: true, categorieId, id: { not: productId } },
      include: { categorie: true },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return similaires.map((p) => ({
      id: p.id,
      nom: p.nom,
      slug: p.slug,
      prix: Number(p.prixPromo ?? p.prix),
      image: p.images[0] ?? null,
      categorie: p.categorie.nom,
    }));
  }

  private async recommanderViaGemini(
    viewed: string[],
    cart: string[],
    beautyProfile: BeautyProfile | null,
    excludeId: string | undefined,
    limit: number,
  ): Promise<ProduitRecommande[]> {
    const catalogue = await obtenirCatalogueIa(100);
    const exclude = new Set([...(excludeId ? [excludeId] : []), ...viewed.slice(0, 3)]);
    const disponible = catalogue.filter((p) => !exclude.has(p.id));
    if (disponible.length === 0) return [];

    const viewedDetails = catalogue.filter((p) => viewed.includes(p.id));
    const cartDetails = catalogue.filter((p) => cart.includes(p.id));

    const profilTexte = beautyProfile
      ? `\nProfil beauté du client:\n${formaterProfilBeautePourIa(beautyProfile)}`
      : '';

    const parsed = await geminiGenerateJson<GeminiRecs>(
      SYSTEM,
      `CATALOGUE:\n${formaterCataloguePourPrompt(disponible)}

Produits consultés récemment: ${viewedDetails.map((p) => p.nom).join(', ') || 'aucun'}
Produits dans le panier: ${cartDetails.map((p) => p.nom).join(', ') || 'aucun'}${profilTexte}

Recommande ${limit} produits personnalisés. JSON: {"productIds":["..."],"reasons":{"id":"raison"}}`,
    );

    if (!parsed?.productIds?.length) return [];

    const ids = parsed.productIds.slice(0, limit);
    const items = await produitsParIds(ids);
    return items.map((p) => ({
      ...p,
      raison: parsed.reasons?.[p.id],
    }));
  }

  private async recommanderFallback(
    viewed: string[],
    cart: string[],
    beautyProfile: BeautyProfile | null,
    excludeId: string | undefined,
    limit: number,
  ): Promise<ProduitRecommande[]> {
    const exclude = new Set([excludeId, ...viewed].filter(Boolean) as string[]);

    if (beautyProfile?.univers?.length) {
      const universSlugs = beautyProfile.univers.flatMap((u) => {
        switch (u) {
          case 'parfums':
            return ['parfums', 'eaux-parfum'];
          case 'huiles-corps':
            return ['huiles-corps', 'huiles-pures'];
          case 'huiles-cheveux':
            return ['huiles-capillaires'];
          case 'cremes':
            return ['cremes-corporelles'];
          default:
            return [];
        }
      });

      const parUnivers = await prisma.product.findMany({
        where: {
          actif: true,
          id: { notIn: [...exclude] },
          categorie: {
            slug: { in: universSlugs },
          },
        },
        include: { categorie: true },
        take: limit,
        orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      });

      if (parUnivers.length >= 2) {
        return parUnivers.map((p) => ({
          id: p.id,
          nom: p.nom,
          slug: p.slug,
          prix: Number(p.prixPromo ?? p.prix),
          image: p.images[0] ?? null,
          categorie: p.categorie.nom,
        }));
      }
    }

    if (viewed.length > 0) {
      const ref = await prisma.product.findFirst({
        where: { id: viewed[0] },
        select: { categorieId: true },
      });
      if (ref) {
        const sameCat = await prisma.product.findMany({
          where: {
            actif: true,
            categorieId: ref.categorieId,
            id: { notIn: [...exclude] },
          },
          include: { categorie: true },
          take: limit,
          orderBy: { featured: 'desc' },
        });
        if (sameCat.length >= 2) {
          return sameCat.map((p) => ({
            id: p.id,
            nom: p.nom,
            slug: p.slug,
            prix: Number(p.prixPromo ?? p.prix),
            image: p.images[0] ?? null,
            categorie: p.categorie.nom,
          }));
        }
      }
    }

    const featured = await prisma.product.findMany({
      where: { actif: true, featured: true, id: { notIn: [...exclude] } },
      include: { categorie: true },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return featured.map((p) => ({
      id: p.id,
      nom: p.nom,
      slug: p.slug,
      prix: Number(p.prixPromo ?? p.prix),
      image: p.images[0] ?? null,
      categorie: p.categorie.nom,
    }));
  }
}

export const recommendationService = new RecommendationService();
