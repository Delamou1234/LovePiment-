import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import type { CategorieVitrine } from '@/modules/produits/lib/category-showcase';

const FALLBACK_CATEGORIES = [
  { nom: 'Stimulateurs', slug: 'sextoys', image: '/images/love-piment-secret.png' },
  { nom: 'Suceurs', slug: 'sextoys', image: '/images/love-piment-secret.png' },
  { nom: 'Boules de geisha', slug: 'accessoires', image: '/images/love-piment-secret.png' },
  { nom: 'Lubrifiants', slug: 'lubrifiants', image: '/images/love-piment-secret.png' },
  { nom: 'Huiles de massage', slug: 'bien-etre-intime', image: '/images/love-piment-secret.png' },
  { nom: 'Lingerie', slug: 'lingerie', image: '/images/love-piment-secret.png' },
  { nom: 'Cadeaux couple', slug: 'cadeaux-couple', image: '/images/love-piment-secret.png' },
];

export function LandingCategories({ categories }: { categories: CategorieVitrine[] }) {
  const items =
    categories.length > 0
      ? categories.slice(0, 7).map((c) => ({ nom: c.nom, slug: c.slug, image: c.image }))
      : FALLBACK_CATEGORIES;

  return (
    <section className="bg-white py-14 md:py-16">
      <div className="container-shop">
        <h2 className="text-center font-serif text-2xl font-bold text-zinc-900 md:text-3xl">
          Nos{' '}
          <span className="text-olive underline decoration-olive/30 decoration-2 underline-offset-4">
            Catégories
          </span>
        </h2>

        <div className="mt-10 flex gap-6 overflow-x-auto pb-2 scrollbar-hide md:mt-12 md:justify-center md:overflow-visible">
          {items.map((cat) => (
            <Link
              key={cat.nom}
              href={`/produits?categorie=${cat.slug}`}
              className="group flex w-[8.75rem] shrink-0 flex-col items-center text-center"
            >
              <div className="lp-cat-circle relative transition group-hover:scale-105">
                <Image
                  src={cat.image}
                  alt={cat.nom}
                  fill
                  sizes="140px"
                  className="object-cover p-3"
                  unoptimized={cat.image.startsWith('/')}
                />
              </div>
              <p className="mt-3 text-sm font-semibold text-zinc-900">{cat.nom}</p>
              <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-olive">
                Voir plus
                <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
