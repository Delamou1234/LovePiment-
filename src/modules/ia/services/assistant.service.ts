import { geminiGenerateJson, GeminiApiError, isGeminiConfigured } from '@/shared/lib/gemini/client';
import {
  formaterCataloguePourPrompt,
  obtenirCatalogueIa,
  type ProduitCatalogueIa,
} from '../lib/catalog-context';
import type { MessageAssistant, ReponseAssistant } from '../types';

const SYSTEM = `Tu es l'assistant shopping KabiShop, boutique e-commerce de parfums, huiles pour la peau et crèmes corporelles en Guinée.
Tu réponds en français, de façon chaleureuse et concise (max 3 phrases sauf si détails demandés).
Tu connais le catalogue ci-dessous. Recommande des produits pertinents quand c'est utile.
Ne invente jamais de produits hors catalogue. Prix en francs guinéens (GN).`;

type GeminiAssistantReply = {
  reply: string;
  productSlugs?: string[];
};

export class AssistantService {
  async discuter(
    message: string,
    historique: MessageAssistant[] = [],
  ): Promise<ReponseAssistant> {
    if (!isGeminiConfigured()) {
      return {
        reply:
          'Assistant IA indisponible : vérifiez que GEMINI_API_KEY est bien renseignée dans `.env.local`, enregistrez le fichier (Ctrl+S), puis redémarrez le serveur (`npm run dev`).',
        productSlugs: [],
        products: [],
      };
    }

    const catalogue = await obtenirCatalogueIa(80);
    const catalogText = formaterCataloguePourPrompt(catalogue);

    const historyText = historique
      .slice(-6)
      .map((m) => `${m.role === 'user' ? 'Client' : 'Assistant'}: ${m.content}`)
      .join('\n');

    let parsed: GeminiAssistantReply | null;
    try {
      parsed = await geminiGenerateJson<GeminiAssistantReply>(
        SYSTEM,
        `CATALOGUE KABISHOP:\n${catalogText}\n\nHISTORIQUE:\n${historyText || '(nouvelle conversation)'}\n\nMESSAGE CLIENT:\n${message}\n\nRéponds en JSON: {"reply":"...","productSlugs":["slug1"]}`,
      );
    } catch (error) {
      if (error instanceof GeminiApiError && error.invalidKey) {
        return {
          reply:
            'Clé API Gemini refusée par Google. Générez une nouvelle clé sur https://aistudio.google.com/apikey (pas Google Cloud Console), mettez-la dans GEMINI_API_KEY, puis redémarrez le serveur.',
          productSlugs: [],
          products: [],
        };
      }
      console.error('[AssistantService]', error);
      return {
        reply: 'Assistant temporairement indisponible. Réessayez dans un instant.',
        productSlugs: [],
        products: [],
      };
    }

    if (!parsed?.reply) {
      return {
        reply: 'Désolé, je n\'ai pas pu traiter votre demande. Pouvez-vous reformuler ?',
        productSlugs: [],
        products: [],
      };
    }

    const slugs = (parsed.productSlugs ?? []).slice(0, 4);
    const products = this.resoudreProduits(catalogue, slugs);

    return {
      reply: parsed.reply,
      productSlugs: slugs,
      products,
    };
  }

  private resoudreProduits(catalogue: ProduitCatalogueIa[], slugs: string[]) {
    const bySlug = new Map(catalogue.map((p) => [p.slug, p]));
    return slugs
      .map((slug) => bySlug.get(slug))
      .filter(Boolean)
      .map((p) => ({
        id: p!.id,
        nom: p!.nom,
        slug: p!.slug,
        prix: p!.prix,
        image: p!.image,
        categorie: p!.categorie,
      }));
  }
}

export const assistantService = new AssistantService();
