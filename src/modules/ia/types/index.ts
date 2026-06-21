export type MessageAssistant = {
  role: 'user' | 'assistant';
  content: string;
};

export type ReponseAssistant = {
  reply: string;
  productSlugs: string[];
  products: {
    id: string;
    nom: string;
    slug: string;
    prix: number;
    image: string | null;
    categorie: string;
  }[];
};

export type ProduitRecommande = {
  id: string;
  nom: string;
  slug: string;
  prix: number;
  image: string | null;
  categorie: string;
  raison?: string;
};

export type SuggestionIa = {
  id: string;
  nom: string;
  slug: string;
  prix: number;
  image: string | null;
  categorie: string;
  source: 'ia' | 'classique';
};
