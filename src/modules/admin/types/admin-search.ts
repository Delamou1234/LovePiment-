export type AdminSearchCommande = {
  type: 'commande';
  id: string;
  clientNom: string;
  clientVille: string;
  statut: string;
  montantTotal: number;
  createdAt: string;
};

export type AdminSearchClient = {
  type: 'client';
  id: string;
  nom: string;
  email: string;
  telephone: string | null;
};

export type AdminSearchProduit = {
  type: 'produit';
  id: string;
  slug: string;
  nom: string;
  prix: number;
  image: string | null;
  actif: boolean;
};

export type AdminSearchResults = {
  commandes: AdminSearchCommande[];
  clients: AdminSearchClient[];
  produits: AdminSearchProduit[];
  query: string;
  tookMs: number;
};
