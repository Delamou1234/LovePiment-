import sharp from 'sharp';
import { productRepository } from '@/modules/produits/repository/product.repository';
import { geminiAnalyzeImage, isGeminiConfigured } from '@/shared/lib/gemini/client';
import {
  formaterCataloguePourPrompt,
  obtenirCatalogueIa,
  produitsParIds,
} from '@/modules/ia/lib/catalog-context';

export type ResultatRechercheImage = {
  id: string;
  nom: string;
  slug: string;
  prix: number;
  image: string | null;
  categorie: string;
  score: number;
  source?: 'ia' | 'classique';
};

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

type GeminiImageMatch = {
  productIds?: string[];
  description?: string;
};

async function empreinteVisuelle(source: Buffer | ArrayBuffer): Promise<number[]> {
  const buffer = Buffer.isBuffer(source) ? source : Buffer.from(source);
  const { data } = await sharp(buffer)
    .rotate()
    .resize(8, 8, { fit: 'fill' })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return Array.from(data);
}

function distanceEmpreintes(a: number[], b: number[]): number {
  if (a.length !== b.length) return Number.MAX_SAFE_INTEGER;
  return a.reduce((sum, val, i) => sum + Math.abs(val - b[i]), 0);
}

async function empreinteDepuisUrl(url: string): Promise<number[] | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return empreinteVisuelle(buf);
  } catch {
    return null;
  }
}

function parseGeminiJson<T>(raw: string): T | null {
  try {
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    return JSON.parse(cleaned) as T;
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as T;
    } catch {
      return null;
    }
  }
}

export class ImageSearchService {
  validerFichier(file: File): string | null {
    if (!ALLOWED_TYPES.has(file.type)) {
      return 'Format non supporté. Utilisez JPG, PNG ou WebP.';
    }
    if (file.size > MAX_FILE_BYTES) {
      return 'Image trop volumineuse (max 5 Mo).';
    }
    return null;
  }

  async rechercherParImage(
    imageBuffer: Buffer,
    mimeType = 'image/jpeg',
    limit = 6,
  ): Promise<ResultatRechercheImage[]> {
    if (isGeminiConfigured()) {
      try {
        const ia = await this.rechercherViaGemini(imageBuffer, mimeType, limit);
        if (ia.length > 0) return ia;
      } catch (error) {
        console.error('[ImageSearchService Gemini]', error);
      }
    }
    return this.rechercherClassique(imageBuffer, limit);
  }

  private async rechercherViaGemini(
    imageBuffer: Buffer,
    mimeType: string,
    limit: number,
  ): Promise<ResultatRechercheImage[]> {
    const catalogue = await obtenirCatalogueIa(100);
    const catalogText = formaterCataloguePourPrompt(catalogue);

    const analysis = await geminiAnalyzeImage(
      `Tu es un expert visuel Love Piment& (boutique intime, lingerie, accessoires).`,
      `CATALOGUE:\n${catalogText}\n\nAnalyse cette photo et réponds UNIQUEMENT en JSON: {"description":"...","productIds":["id1"]} — max ${limit} IDs ordonnés par pertinence.`,
      { mimeType, data: imageBuffer },
    );

    const parsed = parseGeminiJson<GeminiImageMatch>(analysis);
    if (!parsed?.productIds?.length) return [];

    const produits = await produitsParIds(parsed.productIds.slice(0, limit));
    return produits.map((p, index) => ({
      id: p.id,
      nom: p.nom,
      slug: p.slug,
      prix: p.prix,
      image: p.image,
      categorie: p.categorie,
      score: index,
      source: 'ia' as const,
    }));
  }

  private async rechercherClassique(
    imageBuffer: Buffer,
    limit: number,
  ): Promise<ResultatRechercheImage[]> {
    const queryFingerprint = await empreinteVisuelle(imageBuffer);
    const { produits } = await productRepository.trouverTous(
      { actif: true },
      { champ: 'createdAt', ordre: 'desc' },
      { page: 1, limit: 50 },
    );

    const scores: ResultatRechercheImage[] = [];
    for (const produit of produits) {
      const imageUrl = produit.images[0];
      if (!imageUrl) continue;
      const productFingerprint = await empreinteDepuisUrl(imageUrl);
      if (!productFingerprint) continue;
      scores.push({
        id: produit.id,
        nom: produit.nom,
        slug: produit.slug,
        prix: Number(produit.prix),
        image: imageUrl,
        categorie: produit.categorie.nom,
        score: distanceEmpreintes(queryFingerprint, productFingerprint),
        source: 'classique',
      });
    }
    return scores.sort((a, b) => a.score - b.score).slice(0, limit);
  }
}

export const imageSearchService = new ImageSearchService();
