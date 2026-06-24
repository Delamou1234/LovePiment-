import { productService } from '@/modules/produits/services/product.service';
import type { SuggestionRecherche } from '@/modules/produits/types';
import { geminiGenerateJson, isGeminiConfigured } from '@/shared/lib/gemini/client';
import {
  formaterCataloguePourPrompt,
  obtenirCatalogueIa,
  produitsParIds,
} from '../lib/catalog-context';
import type { SuggestionIa } from '../types';

const SYSTEM = `Tu es le moteur de suggestions Love Piment&. À partir d'une requête client (français, parfois avec fautes),
identifie les produits du catalogue les plus pertinents (sémantique, pas seulement mots exacts).
Réponds en JSON: {"productIds":["id1","id2"]} — max 6 IDs, ordonnés par pertinence.`;

type GeminiSuggestions = { productIds?: string[] };

export class SuggestionService {
  async suggerer(query: string): Promise<{
    suggestions: SuggestionRecherche[];
    aiEnhanced: boolean;
  }> {
    const classiques = await productService.suggererRecherche(query);

    if (!isGeminiConfigured() || query.trim().length < 2) {
      return { suggestions: classiques, aiEnhanced: false };
    }

    try {
      const catalogue = await obtenirCatalogueIa(100);
      const parsed = await geminiGenerateJson<GeminiSuggestions>(
        SYSTEM,
        `Requête: "${query.trim()}"\n\nCATALOGUE:\n${formaterCataloguePourPrompt(catalogue)}`,
      );

      if (!parsed?.productIds?.length) {
        return { suggestions: classiques, aiEnhanced: false };
      }

      const iaProducts = await produitsParIds(parsed.productIds.slice(0, 6));
      const iaSuggestions: SuggestionIa[] = iaProducts.map((p) => ({
        id: p.id,
        nom: p.nom,
        slug: p.slug,
        prix: p.prix,
        image: p.image,
        categorie: p.categorie,
        source: 'ia' as const,
      }));

      const seen = new Set<string>();
      const merged: SuggestionRecherche[] = [];

      for (const s of iaSuggestions) {
        if (seen.has(s.id)) continue;
        seen.add(s.id);
        merged.push({
          type: 'produit',
          id: s.id,
          nom: s.nom,
          slug: s.slug,
          prix: s.prix,
          image: s.image,
          categorie: s.categorie,
        });
      }

      for (const s of classiques) {
        const key = s.type === 'produit' ? s.id : s.slug;
        if (seen.has(key)) continue;
        seen.add(key);
        merged.push(s);
      }

      return { suggestions: merged.slice(0, 9), aiEnhanced: true };
    } catch (error) {
      console.error('[SuggestionService]', error);
      return { suggestions: classiques, aiEnhanced: false };
    }
  }
}

export const suggestionService = new SuggestionService();
