import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Truck,
  Lock,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Headphones,
  BadgeCheck,
  Percent,
} from 'lucide-react';
import { ProductCard } from '@/shared/components/ProductCard';
import { variantePourCarte } from '@/shared/lib/product-card';
import { HomeHero } from '@/shared/components/HomeHero';
import { HomeSectionHeader } from '@/shared/components/home/HomeSectionHeader';
import { HomeCategoryShowcase } from '@/shared/components/home/HomeCategoryShowcase';
import { HomePromoSection } from '@/shared/components/home/HomePromoSection';
import { HomePromoFlashBand } from '@/shared/components/home/HomePromoFlashBand';
import { HomeTestimonials } from '@/shared/components/home/HomeTestimonials';
import { getCachedHomeCatalog, getCachedHomeCategories, getCachedHomeReviews } from '@/modules/produits/lib/cached-queries';
import { notesPourProduit } from '@/modules/produits/lib/product-ratings';
import { HomeRecommendationsLazy } from '@/modules/ia/components/HomeRecommendationsLazy';

const TRUST_HERO = [
  {
    icon: Truck,
    title: 'Livraison rapide',
    desc: '24 à 48h à Conakry et environs.',
  },
  {
    icon: Lock,
    title: 'Paiement sécurisé',
    desc: 'Orange Money, MTN MoMo & CinetPay.',
  },
  {
    icon: RotateCcw,
    title: 'Produits authentiques',
    desc: 'Sélection premium garantie.',
  },
  {
    icon: Headphones,
    title: 'Support 7j/7',
    desc: 'Messagerie instantanée & WhatsApp.',
  },
];

const TRUST_ROW = [
  { icon: ShieldCheck, title: 'Qualité garantie', desc: 'Produits vérifiés' },
  { icon: Sparkles, title: 'Meilleurs prix', desc: 'Promos régulières' },
  { icon: BadgeCheck, title: 'Satisfait ou remboursé', desc: 'Avis clients' },
  { icon: Percent, title: 'Offres exclusives', desc: 'Membres newsletter' },
];

const PAYMENT_METHODS = ['Orange Money', 'MTN MoMo', 'CinetPay', 'Paiement à la livraison'];

export const revalidate = 120;

export default async function HomePage() {
  const [{ featured, latest, statsPromos, flash, notesProduits }, categoriesVitrine, { avisClients, totalAvis }] =
    await Promise.all([
      getCachedHomeCatalog(),
      getCachedHomeCategories(),
      getCachedHomeReviews(),
    ]);

  const featuredProducts = featured.produits;
  const latestProducts = latest.produits;

  const displayFeatured = featuredProducts.length > 0 ? featuredProducts : latestProducts;
  const displayLatest = latestProducts.slice(0, 4);

  return (
    <div className="animate-fadeIn bg-[#faf7f2]">
      <HomeHero />

      {/* Barre confiance */}
      <section className="relative z-10 -mt-10 md:-mt-14">
        <div className="container-kabishop px-4">
          <div className="rounded-2xl border border-[#ebe4d8]/60 bg-white shadow-[0_16px_48px_rgba(0,0,0,0.08)] overflow-hidden">
            <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-[#ebe4d8]/80">
              {TRUST_HERO.map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="flex items-start gap-3 px-4 py-5 sm:px-6 sm:py-6"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef0eb] text-[#4a5240]">
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-zinc-900">{title}</p>
                    <p className="text-[11px] text-zinc-500 leading-snug mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <HomePromoFlashBand stats={statsPromos} flash={flash} />

      {/* Catégories — bento grid */}
      <section className="container-kabishop py-16 md:py-24">
        <HomeSectionHeader
          eyebrow="Collections"
          title="Acheter par catégorie"
          description={
            categoriesVitrine.length > 0
              ? `${categoriesVitrine.length} collection${categoriesVitrine.length > 1 ? 's' : ''} disponible${categoriesVitrine.length > 1 ? 's' : ''} — parfums, huiles et soins.`
              : 'Parfums, huiles corps, capillaires et eaux de parfum — trouvez votre signature olfactive.'
          }
          href="/produits"
          linkLabel="Toutes les catégories"
        />
        <HomeCategoryShowcase categories={categoriesVitrine} />
      </section>

      {/* Best-sellers */}
      <section className="bg-white py-16 md:py-24 border-y border-[#ebe4d8]/60">
        <div className="container-kabishop">
          <HomeSectionHeader
            eyebrow="Tendances"
            title="Nos best-sellers"
            description="Les produits les plus aimés par nos clients à Conakry."
            href="/produits"
            linkLabel="Voir toute la boutique"
          />

          {displayFeatured.length === 0 ? (
            <p className="text-center text-sm text-zinc-500 py-12">
              Catalogue en cours de mise à jour.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 md:gap-6">
              {displayFeatured.slice(0, 8).map((p, idx) => {
                const notes = notesPourProduit(notesProduits, p.id);
                return (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  slug={p.slug}
                  nom={p.nom}
                  categorie={p.categorie.nom}
                  prix={Number(p.prix)}
                  image={p.images[0]}
                  featured={p.featured}
                  rating={notes.rating}
                  reviews={notes.reviews}
                  priority={idx < 4}
                  variante={variantePourCarte(p.id, Number(p.prix), p.variantes?.[0])}
                />
              );})}
            </div>
          )}
        </div>
      </section>

      {/* Collections promo */}
      <HomePromoSection categories={categoriesVitrine} statsPromos={statsPromos} />

      {/* Recommandations IA personnalisées */}
      <HomeRecommendationsLazy />

      {/* Nouveautés */}
      {displayLatest.length > 0 && (
        <section className="bg-[#faf7f2] py-16 md:py-24 border-t border-[#ebe4d8]/60">
          <div className="container-kabishop">
            <HomeSectionHeader
              eyebrow="Nouveautés"
              title="Derniers arrivages"
              description="Découvrez nos dernières références ajoutées à la boutique."
              href="/produits"
              linkLabel="Voir les nouveautés"
            />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {displayLatest.map((p, idx) => {
                const notes = notesPourProduit(notesProduits, p.id);
                return (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  slug={p.slug}
                  nom={p.nom}
                  categorie={p.categorie.nom}
                  prix={Number(p.prix)}
                  image={p.images[0]}
                  rating={notes.rating}
                  reviews={notes.reviews}
                  variante={variantePourCarte(p.id, Number(p.prix), p.variantes?.[0])}
                />
              );})}
            </div>
          </div>
        </section>
      )}

      {/* Marque / storytelling */}
      <section className="bg-white py-16 md:py-24 border-y border-[#ebe4d8]/60">
        <div className="container-kabishop">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=900&q=85&auto=format&fit=crop"
                alt="KabiShop — parfums et huiles"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#4a5240] mb-3">
                Notre histoire
              </p>
              <h2 className="font-serif text-2xl md:text-4xl font-bold text-zinc-900 leading-tight">
                L&apos;excellence olfactive, livrée à Conakry
              </h2>
              <p className="mt-5 text-sm md:text-base text-zinc-600 leading-relaxed">
                KabiShop sélectionne pour vous les meilleurs parfums et huiles — authentiques,
                soigneusement choisis et livrés rapidement. Paiement sécurisé, suivi en temps réel
                et une équipe à votre écoute 7j/7.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-4">
                {TRUST_ROW.map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-3">
                    <Icon className="h-5 w-5 text-[#4a5240] shrink-0 mt-0.5" strokeWidth={1.5} />
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">{title}</p>
                      <p className="text-xs text-zinc-500">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/produits"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-zinc-900 px-7 py-3 text-sm font-semibold text-white hover:bg-zinc-800 transition"
              >
                Découvrir la boutique
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Témoignages — avis réels après livraison */}
      <section className="container-kabishop px-6 sm:px-8 py-16 md:py-24">
        <HomeSectionHeader
          eyebrow="Avis clients"
          title="Ils nous font confiance"
          description={
            totalAvis > 0
              ? `${totalAvis} avis vérifiés — notes, commentaires et photos de clients ayant reçu leur commande.`
              : 'Notes et commentaires authentiques, liés à des achats livrés et vérifiés.'
          }
          align="center"
        />
        <HomeTestimonials avis={avisClients} />
      </section>

      {/* Moyens de paiement */}
      <section className="border-t border-[#ebe4d8]/60 bg-[#faf7f2] py-10 md:py-12">
        <div className="container-kabishop text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-400 mb-6">
            Paiements acceptés
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
            {PAYMENT_METHODS.map((name) => (
              <span
                key={name}
                className="rounded-full border border-[#ebe4d8] bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
