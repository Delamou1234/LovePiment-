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
import { HomeTrustStrip } from '@/shared/components/home/HomeTrustStrip';
import { getCachedHomeCatalog, getCachedHomeCategories, getCachedHomeReviews } from '@/modules/produits/lib/cached-queries';
import { notesPourProduit } from '@/modules/produits/lib/product-ratings';
import { CATEGORIE_IMAGE_DEFAUT } from '@/modules/produits/lib/category-showcase';

const TRUST_ITEMS = [
  { icon: Truck, title: 'Livraison rapide', desc: '24 à 48h à Conakry.' },
  { icon: Lock, title: 'Paiement sécurisé', desc: 'Orange Money, MTN MoMo & CinetPay.' },
  { icon: RotateCcw, title: 'Produits authentiques', desc: 'Sélection premium garantie.' },
  { icon: Headphones, title: 'Support 7j/7', desc: 'Messagerie & WhatsApp.' },
];

const TRUST_ROW = [
  { icon: ShieldCheck, title: 'Qualité garantie', desc: 'Produits vérifiés' },
  { icon: Sparkles, title: 'Meilleurs prix', desc: 'Promos régulières' },
  { icon: BadgeCheck, title: 'Avis vérifiés', desc: 'Achats confirmés' },
  { icon: Percent, title: 'Offres exclusives', desc: 'Codes promo & flash' },
];

const PAYMENT_METHODS = ['Orange Money', 'MTN MoMo', 'CinetPay', 'Paiement à la livraison'];

export default async function HomePage() {
  const [{ featured, latest, statsPromos, flash, notesProduits, promoBanniere }, categoriesVitrine, { avisClients, totalAvis }] =
    await Promise.all([
      getCachedHomeCatalog(),
      getCachedHomeCategories(),
      getCachedHomeReviews(),
    ]);

  const featuredProducts = featured.produits;
  const latestProducts = latest.produits;
  const displayFeatured = featuredProducts.length > 0 ? featuredProducts : latestProducts;
  const displayLatest = latestProducts.slice(0, 4);

  const storyImage =
    promoBanniere[0]?.src ??
    displayFeatured[0]?.images[0] ??
    categoriesVitrine[0]?.image ??
    CATEGORIE_IMAGE_DEFAUT;

  const heroFeatured = displayFeatured[0]
    ? {
        nom: displayFeatured[0].nom,
        slug: displayFeatured[0].slug,
        image: displayFeatured[0].images[0] ?? '',
        prix: Number(displayFeatured[0].prixPromo ?? displayFeatured[0].prix),
        categorie: displayFeatured[0].categorie.nom,
      }
    : null;

  return (
    <div className="animate-fadeIn bg-cream">
      <HomeHero categories={categoriesVitrine} featured={heroFeatured} />

      <HomeTrustStrip items={TRUST_ITEMS} />

      <div className="pt-6 md:pt-8">
        <HomePromoFlashBand stats={statsPromos} flash={flash} />
      </div>

      <section className="container-kabishop py-16 md:py-24">
        <HomeSectionHeader
          eyebrow="Collections"
          title="Acheter par catégorie"
          description={
            categoriesVitrine.length > 0
              ? `${categoriesVitrine.length} univers parfums, huiles peau et crèmes — trouvez votre routine.`
              : 'Parfums, huiles pour la peau et crèmes corporelles pour prendre soin de vous.'
          }
          href="/produits"
          linkLabel="Toutes les catégories"
        />
        <HomeCategoryShowcase categories={categoriesVitrine} />
      </section>

      <section className="section-band-white">
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
            <div className="products-grid">
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
                );
              })}
            </div>
          )}
        </div>
      </section>

      <HomePromoSection
        categories={categoriesVitrine}
        statsPromos={statsPromos}
        promoBanniere={promoBanniere}
      />

      {displayLatest.length > 0 && (
        <section className="section-band section-band-cream">
          <div className="container-kabishop">
            <HomeSectionHeader
              eyebrow="Nouveautés"
              title="Derniers arrivages"
              description="Les dernières références ajoutées à la boutique."
              href="/produits"
              linkLabel="Voir les nouveautés"
            />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {displayLatest.map((p) => {
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
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section className="section-band-white overflow-hidden">
        <div className="container-kabishop">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="relative aspect-[4/3] rounded-2xl md:rounded-3xl overflow-hidden shadow-xl ring-1 ring-beige-border/40 group">
              <Image
                src={storyImage}
                alt="KabiShop — parfums et soins du corps"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover transition duration-700 group-hover:scale-105"
                unoptimized={storyImage.startsWith('/')}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-olive mb-3">
                Notre histoire
              </p>
              <h2 className="font-serif text-2xl md:text-4xl font-bold text-zinc-900 leading-tight">
                L&apos;excellence olfactive, livrée à Conakry
              </h2>
              <p className="mt-5 text-sm md:text-base text-zinc-600 leading-relaxed">
                KabiShop sélectionne pour vous des parfums, des huiles pour la peau et des crèmes
                corporelles — authentiques, soigneusement choisis et livrés rapidement. Paiement
                sécurisé, suivi en temps réel et une équipe à votre écoute 7j/7.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-4">
                {TRUST_ROW.map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-3 rounded-xl bg-cream/80 p-3 ring-1 ring-beige-border/50">
                    <Icon className="h-5 w-5 text-olive shrink-0 mt-0.5" strokeWidth={1.5} />
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">{title}</p>
                      <p className="text-xs text-zinc-500">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/produits"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-olive px-7 py-3.5 text-sm font-semibold text-white hover:bg-olive-dark transition shadow-md shadow-olive/20"
              >
                Découvrir la boutique
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container-kabishop py-16 md:py-24">
        <HomeSectionHeader
          eyebrow="Avis clients"
          title="Ils nous font confiance"
          description={
            totalAvis > 0
              ? `${totalAvis} avis vérifiés — achats confirmés après livraison.`
              : 'Notes authentiques liées à des commandes livrées.'
          }
          align="center"
        />
        <HomeTestimonials avis={avisClients} />
      </section>

      <section className="border-t border-beige-border/60 bg-white py-10 md:py-12">
        <div className="container-kabishop text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-400 mb-6">
            Paiements acceptés
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
            {PAYMENT_METHODS.map((name) => (
              <span
                key={name}
                className="rounded-full border border-beige-border bg-cream px-4 py-2 text-xs md:text-sm font-medium text-zinc-700"
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
