import React from 'react';
import Link from 'next/link';
import { 
  SlidersHorizontal, 
  Search, 
  ChevronRight, 
  X,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mockDb, getUniversForCategory } from '@/shared/lib/mock-db';
import { ProductCard } from '@/shared/components/ProductCard';

// ─── CATALOG PAGE (SERVER COMPONENT) ─────────────────────────────────────────

type SearchParams = Promise<{
  categorie?: string;
  univers?: string;
  taille?: string;
  couleur?: string;
  search?: string;
  tri?: string;
  prixMin?: string;
  prixMax?: string;
  promo?: string;
}>;

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  // Await searchParams in Next.js 15+
  const resolvedParams = await searchParams;
  const activeCategorie = resolvedParams.categorie || '';
  const activeUnivers = resolvedParams.univers || '';
  const activeTaille = resolvedParams.taille || '';
  const activeCouleur = resolvedParams.couleur || '';
  const activeSearch = resolvedParams.search || '';
  const activeTri = resolvedParams.tri || 'nouveautes';
  const activePrixMin = resolvedParams.prixMin || '';
  const activePrixMax = resolvedParams.prixMax || '';

  // Récupérer les catégories pour les filtres
  const categories = mockDb.getCategories();

  // Filtrer les produits
  let products = [...mockDb.getProducts()];

  if (activeUnivers === 'mode' || activeUnivers === 'beaute') {
    products = products.filter(
      (p) => getUniversForCategory(p.categorie.slug) === activeUnivers,
    );
  }

  if (activeCategorie) {
    products = products.filter(p => p.categorie.slug === activeCategorie);
  }

  if (activeTaille) {
    products = products.filter(p => p.variantes.some(v => v.taille === activeTaille));
  }

  if (activeCouleur) {
    products = products.filter(p => p.variantes.some(v => v.couleur === activeCouleur));
  }

  if (activeSearch) {
    const cleanSearch = activeSearch.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    products = products.filter(p => {
      const cleanNom = p.nom.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const cleanDesc = (p.description || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return cleanNom.includes(cleanSearch) || cleanDesc.includes(cleanSearch);
    });
  }

  if (activePrixMin) {
    products = products.filter(p => Number(p.prix) >= Number(activePrixMin));
  }

  if (activePrixMax) {
    products = products.filter(p => Number(p.prix) <= Number(activePrixMax));
  }

  // Tri
  products.sort((a, b) => {
    if (activeTri === 'prix_asc') {
      return Number(a.prix) - Number(b.prix);
    }
    if (activeTri === 'prix_desc') {
      return Number(b.prix) - Number(a.prix);
    }
    // Par défaut (nouveautés)
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  // Liste des filtres de tailles et couleurs statiques pour affichage
  const taillesDisponibles = ['XS', 'S', 'M', 'L', 'XL', '36', '38', '40', '42', 'Unique'];
  const couleursDisponibles = ['Blanc', 'Noir', 'Beige', 'Bordeaux', 'Bleu fleuri', 'Rouge fleuri', 'Orange & Noir', 'Camel', 'Crème', 'Multicolore'];

  // Fonction utilitaire pour générer le lien avec les nouveaux filtres
  const buildUrl = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams();
    
    // Conserver les paramètres actuels
    if (activeCategorie) params.set('categorie', activeCategorie);
    if (activeUnivers) params.set('univers', activeUnivers);
    if (activeTaille) params.set('taille', activeTaille);
    if (activeCouleur) params.set('couleur', activeCouleur);
    if (activeSearch) params.set('search', activeSearch);
    if (activeTri) params.set('tri', activeTri);
    if (activePrixMin) params.set('prixMin', activePrixMin);
    if (activePrixMax) params.set('prixMax', activePrixMax);

    // Appliquer les mises à jour
    Object.entries(updates).forEach(([key, val]) => {
      if (val === null) {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    });

    return `/produits?${params.toString()}`;
  };

  const cleanFiltres = () => {
    return '/produits';
  };

  const hasActiveFilters = activeCategorie || activeUnivers || activeTaille || activeCouleur || activeSearch || activePrixMin || activePrixMax;

  const pageTitle = activeUnivers === 'beaute'
    ? 'Beauté — Parfums & Soins'
    : activeUnivers === 'mode'
      ? 'Mode — Vêtements'
      : 'Catalogue';

  return (
    <div className="container-kabishop py-8 animate-fadeIn">
      <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-6">
        <Link href="/" className="hover:text-accent transition font-medium">Accueil</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-zinc-800 font-bold">{pageTitle}</span>
      </div>

      {/* Onglets univers */}
      <div className="flex flex-wrap gap-2 mb-8">
        {[
          { label: 'Tout', value: '' },
          { label: 'Mode', value: 'mode' },
          { label: 'Beauté', value: 'beaute' },
        ].map((tab) => (
          <Link
            key={tab.value}
            href={tab.value ? `/produits?univers=${tab.value}` : '/produits'}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
              activeUnivers === tab.value
                ? 'bg-primary text-white'
                : 'bg-white border border-[#ebe4d8] text-zinc-600 hover:border-accent hover:text-accent'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        
        {/* ─── COLONNE FILTRES (DESKTOP) ──────────────────────────────────── */}
        <aside className="hidden lg:block space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
            <h3 className="font-extrabold text-zinc-900 text-lg flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-primary" /> Filtres
            </h3>
            {hasActiveFilters && (
              <Link href={cleanFiltres()} className="text-xs font-bold text-primary hover:underline">
                Effacer tout
              </Link>
            )}
          </div>

          {/* Catégories */}
          <div className="space-y-3">
            <h4 className="font-bold text-zinc-800 text-sm uppercase tracking-wider">Catégorie</h4>
            <div className="flex flex-col gap-2">
              <Link 
                href={buildUrl({ categorie: null })}
                className={`text-sm py-1.5 px-3 rounded-lg transition-all font-medium ${
                  !activeCategorie ? 'bg-primary-50 text-primary font-bold' : 'text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                Tous les vêtements
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={buildUrl({ categorie: cat.slug })}
                  className={`text-sm py-1.5 px-3 rounded-lg transition-all font-medium ${
                    activeCategorie === cat.slug ? 'bg-primary-50 text-primary font-bold' : 'text-zinc-600 hover:bg-zinc-50'
                  }`}
                >
                  {cat.nom}
                </Link>
              ))}
            </div>
          </div>

          {/* Tailles */}
          <div className="space-y-3 pt-4 border-t border-zinc-100">
            <h4 className="font-bold text-zinc-800 text-sm uppercase tracking-wider">Taille</h4>
            <div className="flex flex-wrap gap-2">
              {taillesDisponibles.map((t) => {
                const isSelected = activeTaille === t;
                return (
                  <Link
                    key={t}
                    href={buildUrl({ taille: isSelected ? null : t })}
                    className={`flex h-10 min-w-10 items-center justify-center rounded-lg border text-sm font-bold transition-all px-2 ${
                      isSelected
                        ? 'border-primary bg-primary text-white'
                        : 'border-zinc-200 text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50'
                    }`}
                  >
                    {t}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Couleurs */}
          <div className="space-y-3 pt-4 border-t border-zinc-100">
            <h4 className="font-bold text-zinc-800 text-sm uppercase tracking-wider">Couleur</h4>
            <div className="flex flex-wrap gap-2">
              {couleursDisponibles.map((c) => {
                const isSelected = activeCouleur === c;
                return (
                  <Link
                    key={c}
                    href={buildUrl({ couleur: isSelected ? null : c })}
                    className={`text-xs font-semibold py-1.5 px-3 rounded-full border transition-all ${
                      isSelected
                        ? 'border-primary bg-primary-50 text-primary font-bold'
                        : 'border-zinc-200 text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50'
                    }`}
                  >
                    {c}
                  </Link>
                );
              })}
            </div>
          </div>
        </aside>

        {/* ─── LISTE PRODUITS & RECHERCHE ─────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Header de liste: Filtre tri, barre recherche */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-100 pb-4">
            
            {/* Barre de recherche mobile/desktop intégrée */}
            <div className="relative flex-grow max-w-md">
              <form action="" method="GET">
                {activeUnivers && <input type="hidden" name="univers" value={activeUnivers} />}
                {activeCategorie && <input type="hidden" name="categorie" value={activeCategorie} />}
                {activeTaille && <input type="hidden" name="taille" value={activeTaille} />}
                {activeCouleur && <input type="hidden" name="couleur" value={activeCouleur} />}
                {activeTri && <input type="hidden" name="tri" value={activeTri} />}
                <input
                  type="text"
                  name="search"
                  placeholder="Rechercher dans le catalogue..."
                  defaultValue={activeSearch}
                  className="w-full rounded-full border border-zinc-200 bg-zinc-50 py-2 pl-4 pr-10 text-sm outline-none transition focus:border-primary focus:bg-white"
                />
                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-primary">
                  <Search className="h-4 w-4" />
                </button>
              </form>
            </div>

            {/* Tri et Nombre d'articles */}
            <div className="flex items-center justify-between sm:justify-end gap-4">
              <span className="text-sm font-medium text-zinc-500">
                <span className="font-bold text-zinc-800">{products.length}</span> article(s) trouvé(s)
              </span>

              <div className="flex items-center gap-1.5 bg-zinc-100/80 p-1 rounded-lg">
                <Link
                  href={buildUrl({ tri: 'nouveautes' })}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition duration-200 ${
                    activeTri === 'nouveautes' ? 'bg-white text-primary shadow-sm' : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  Nouveautés
                </Link>
                <Link
                  href={buildUrl({ tri: 'prix_asc' })}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition duration-200 ${
                    activeTri === 'prix_asc' ? 'bg-white text-primary shadow-sm' : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  Prix ↗
                </Link>
                <Link
                  href={buildUrl({ tri: 'prix_desc' })}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition duration-200 ${
                    activeTri === 'prix_desc' ? 'bg-white text-primary shadow-sm' : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  Prix ↘
                </Link>
              </div>
            </div>
          </div>

          {/* Badges filtres actifs */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mr-1">Filtres actifs :</span>
              {activeCategorie && (
                <Link href={buildUrl({ categorie: null })} className="inline-flex items-center gap-1 rounded-full bg-zinc-100 hover:bg-zinc-200 py-1 px-3 text-xs font-bold text-zinc-700 transition">
                  Catégorie: {categories.find(c => c.slug === activeCategorie)?.nom} <X className="h-3.5 w-3.5 text-zinc-400" />
                </Link>
              )}
              {activeTaille && (
                <Link href={buildUrl({ taille: null })} className="inline-flex items-center gap-1 rounded-full bg-zinc-100 hover:bg-zinc-200 py-1 px-3 text-xs font-bold text-zinc-700 transition">
                  Taille: {activeTaille} <X className="h-3.5 w-3.5 text-zinc-400" />
                </Link>
              )}
              {activeCouleur && (
                <Link href={buildUrl({ couleur: null })} className="inline-flex items-center gap-1 rounded-full bg-zinc-100 hover:bg-zinc-200 py-1 px-3 text-xs font-bold text-zinc-700 transition">
                  Couleur: {activeCouleur} <X className="h-3.5 w-3.5 text-zinc-400" />
                </Link>
              )}
              {activeSearch && (
                <Link href={buildUrl({ search: null })} className="inline-flex items-center gap-1 rounded-full bg-zinc-100 hover:bg-zinc-200 py-1 px-3 text-xs font-bold text-zinc-700 transition">
                  Recherche: "{activeSearch}" <X className="h-3.5 w-3.5 text-zinc-400" />
                </Link>
              )}
            </div>
          )}

          {/* Grille de produits */}
          {products.length > 0 ? (
            <div className="products-grid">
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  slug={p.slug}
                  nom={p.nom}
                  categorie={p.categorie.nom}
                  prix={Number(p.prix)}
                  image={p.images[0]}
                  featured={p.featured}
                />
              ))}
            </div>
          ) : (
            /* Aucun produit */
            <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-zinc-100 rounded-2xl">
              <Filter className="h-12 w-12 text-zinc-300 mb-4" />
              <h3 className="text-lg font-bold text-zinc-950 mb-2">Aucun article ne correspond à votre recherche</h3>
              <p className="text-sm text-zinc-500 max-w-sm leading-relaxed mb-6">
                Essayez d'élargir vos critères de recherche ou de retirer certains filtres actifs.
              </p>
              <Link href={cleanFiltres()}>
                <Button className="btn-primary rounded-full px-6">Voir tous les articles</Button>
              </Link>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
