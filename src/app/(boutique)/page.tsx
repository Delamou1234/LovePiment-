import { variantePourCarte } from '@/shared/lib/product-card';
import { getCachedHomeCatalog, getCachedHomeCategories, getCachedHomeReviews } from '@/modules/produits/lib/cached-queries';
import { getCachedNewsletterConfig, getCachedHeroBadge } from '@/modules/marketing/lib/cached-queries';
import { notesPourProduit } from '@/modules/produits/lib/product-ratings';
import { LandingHero } from '@/shared/components/home/landing/LandingHero';
import { LandingSocialProof } from '@/shared/components/home/landing/LandingSocialProof';
import { LandingCategories } from '@/shared/components/home/landing/LandingCategories';
import { LandingTrustBar } from '@/shared/components/home/landing/LandingTrustBar';
import { HomePromoFlashBand } from '@/shared/components/home/HomePromoFlashBand';
import { HomePromoSection } from '@/shared/components/home/HomePromoSection';
import { LandingFeaturedProducts } from '@/shared/components/home/landing/LandingFeaturedProducts';
import type { LandingProduct } from '@/shared/components/home/landing/LandingFeaturedProducts';
import { LandingNewArrivals } from '@/shared/components/home/landing/LandingNewArrivals';
import { LandingBrandStory } from '@/shared/components/home/landing/LandingBrandStory';
import { LandingMarketingPerks } from '@/shared/components/home/landing/LandingMarketingPerks';
import { LandingNewsletter } from '@/shared/components/home/landing/LandingNewsletter';
import { LandingTestimonials } from '@/shared/components/home/landing/LandingTestimonials';
import { LandingFinalCTA } from '@/shared/components/home/landing/LandingFinalCTA';
import { HomeRecommendationsLazy } from '@/modules/ia/components/HomeRecommendationsLazy';

export const revalidate = 120;

function mapToLandingProducts(
  produits: Awaited<ReturnType<typeof getCachedHomeCatalog>>['featured']['produits'],
  notesProduits: Awaited<ReturnType<typeof getCachedHomeCatalog>>['notesProduits'],
): LandingProduct[] {
  return produits.map((p) => {
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
}

export default async function HomePage() {
  const [
    { featured, latest, statsPromos, flash, notesProduits, promoBanniere },
    categoriesVitrine,
    { avisClients, totalAvis },
    newsletter,
    heroBadge,
  ] = await Promise.all([
    getCachedHomeCatalog(),
    getCachedHomeCategories(),
    getCachedHomeReviews(),
    getCachedNewsletterConfig(),
    getCachedHeroBadge(),
  ]);

  const featuredProducts = mapToLandingProducts(featured.produits, notesProduits).slice(0, 4);
  const newArrivals = mapToLandingProducts(latest.produits, notesProduits).slice(0, 4);

  return (
    <div className="animate-fadeIn bg-white">
      <LandingHero clientesSatisfaites={heroBadge.label} clientesCount={heroBadge.count} />
      <HomePromoFlashBand stats={statsPromos} flash={flash} />
      <LandingSocialProof
        clientesCount={heroBadge.count}
        promoCount={statsPromos.total}
        categoryCount={categoriesVitrine.length}
        avisCount={totalAvis}
      />
      <LandingCategories categories={categoriesVitrine} />
      <LandingTrustBar />
      <HomePromoSection
        categories={categoriesVitrine}
        statsPromos={statsPromos}
        promoBanniere={promoBanniere}
      />
      <LandingFeaturedProducts products={featuredProducts} />
      <LandingNewArrivals products={newArrivals} />
      <LandingBrandStory />
      <HomeRecommendationsLazy />
      <LandingMarketingPerks />
      <LandingNewsletter {...newsletter} />
      <LandingTestimonials avis={avisClients} />
      <LandingFinalCTA />
    </div>
  );
}
