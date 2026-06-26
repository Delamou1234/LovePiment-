import { variantePourCarte } from '@/shared/lib/product-card';
import { getCachedHomeCatalog, getCachedHomeCategories, getCachedHomeReviews } from '@/modules/produits/lib/cached-queries';
import { getCachedNewsletterConfig, getCachedHeroBadge } from '@/modules/marketing/lib/cached-queries';
import { notesPourProduit } from '@/modules/produits/lib/product-ratings';
import { LandingHero } from '@/shared/components/home/landing/LandingHero';
import { LandingCategories } from '@/shared/components/home/landing/LandingCategories';
import { LandingTrustBar } from '@/shared/components/home/landing/LandingTrustBar';
import { LandingFeaturedProducts } from '@/shared/components/home/landing/LandingFeaturedProducts';
import { LandingNewsletter } from '@/shared/components/home/landing/LandingNewsletter';
import { LandingTestimonials } from '@/shared/components/home/landing/LandingTestimonials';

export default async function HomePage() {
  const [{ featured, notesProduits }, categoriesVitrine, { avisClients }, newsletter, heroBadge] =
    await Promise.all([
    getCachedHomeCatalog(),
    getCachedHomeCategories(),
    getCachedHomeReviews(),
    getCachedNewsletterConfig(),
    getCachedHeroBadge(),
  ]);

  const featuredProducts = featured.produits;
  const landingProducts = featuredProducts.slice(0, 4).map((p) => {
    const notes = notesPourProduit(notesProduits, p.id);
    return {
      id: p.id,
      slug: p.slug,
      nom: p.nom,
      prix: Number(p.prix),
      prixPromo: p.prixPromo != null ? Number(p.prixPromo) : null,
      image: p.images[0] ?? null,
      rating: notes.rating,
      reviews: notes.reviews,
      featured: p.featured,
      variante: variantePourCarte(p.id, Number(p.prix), p.variantes?.[0]),
    };
  });

  return (
    <div className="animate-fadeIn bg-white">
      <LandingHero clientesSatisfaites={heroBadge.label} clientesCount={heroBadge.count} />
      <LandingCategories categories={categoriesVitrine} />
      <LandingTrustBar />
      <LandingFeaturedProducts products={landingProducts} />
      <LandingNewsletter {...newsletter} />
      <LandingTestimonials avis={avisClients} />
    </div>
  );
}
