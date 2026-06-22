import { geminiGenerateJson, GeminiApiError, isGeminiConfigured } from '@/shared/lib/gemini/client';
import { formaterInfosBoutiquePourPrompt } from '../lib/boutique-context';
import {
  formaterCataloguePourPrompt,
  obtenirCatalogueIa,
  type ProduitCatalogueIa,
} from '../lib/catalog-context';
import type { MessageAssistant, ReponseAssistant } from '../types';

const SYSTEM = `Tu es l'assistant shopping KabiShop sur le site e-commerce.
Tu réponds en français, chaleureusement et clairement.
Tu t'appuies UNIQUEMENT sur le catalogue et les infos boutique fournis (prix, stock, variantes, promos, livraison).
Règles :
- Indique toujours si un produit est disponible ou en rupture quand on te le demande.
- Donne le prix en francs guinéens (GN) tel qu'indiqué dans le catalogue.
- Mentionne les variantes en stock si pertinent (taille, capacité, couleur).
- Recommande 1 à 4 produits via productSlugs quand c'est utile.
- Ne invente jamais de produit, prix ou stock hors catalogue.
- Pour une commande complexe ou hors stock : propose WhatsApp.`;

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
          'Assistant indisponible. Ajoutez GEMINI_API_KEY dans `.env.local` (https://aistudio.google.com/apikey), puis redémarrez le serveur.',
        productSlugs: [],
        products: [],
      };
    }

    const catalogue = await obtenirCatalogueIa(120);
    const boutiqueInfo = formaterInfosBoutiquePourPrompt();
    const catalogText = formaterCataloguePourPrompt(catalogue);

    const historyText = historique
      .slice(-8)
      .map((m) => `${m.role === 'user' ? 'Client' : 'Assistant'}: ${m.content}`)
      .join('\n');

    let parsed: GeminiAssistantReply | null;
    try {
      parsed = await geminiGenerateJson<GeminiAssistantReply>(
        SYSTEM,
        `${boutiqueInfo}\n\nCATALOGUE PRODUITS:\n${catalogText}\n\nHISTORIQUE:\n${historyText || '(nouvelle conversation)'}\n\nMESSAGE CLIENT:\n${message}\n\nRéponds en JSON strict: {"reply":"...","productSlugs":["slug-optionnel"]}`,
      );
    } catch (error) {
      if (error instanceof GeminiApiError && error.invalidKey) {
        return {
          reply:
            'Clé API Gemini invalide. Créez-en une sur https://aistudio.google.com/apikey, mettez-la dans GEMINI_API_KEY, puis redémarrez le serveur.',
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
