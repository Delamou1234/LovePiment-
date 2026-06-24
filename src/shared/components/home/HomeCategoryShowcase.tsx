import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import type { CategorieVitrine } from '@/modules/produits/lib/category-showcase';
import { CATEGORIE_IMAGE_DEFAUT } from '@/modules/produits/lib/category-showcase';

type Props = {
  categories: CategorieVitrine[];
};

export function HomeCategoryShowcase({ categories }: Props) {
  if (categories.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#F2D4DC] bg-white/60 px-6 py-12 text-center">
        <p className="text-sm text-zinc-600">
          Aucune catégorie active.{' '}
          <Link href="/admin/categories" className="font-medium text-[#9B1B2E] hover:underline">
            Ajoutez-en dans l&apos;administration
          </Link>
          .
        </p>
      </div>
    );
  }

  const [featured, ...rest] = categories;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-10">
      <Link
        href={featured.href}
        className="group relative md:col-span-2 lg:col-span-2 lg:row-span-2 aspect-[16/10] lg:aspect-auto lg:min-h-[440px] rounded-2xl md:rounded-3xl overflow-hidden shadow-md"
      >
        <Image
          src={featured.image || CATEGORIE_IMAGE_DEFAUT}
          alt={featured.nom}
          fill
          sizes="(max-width: 1024px) 100vw, 66vw"
          className="object-cover transition duration-700 group-hover:scale-105"
          unoptimized={featured.image.startsWith('/')}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
        <div className="absolute inset-0 p-8 md:p-10 flex flex-col justify-end">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-white/70 mb-2">
            Collection phare
          </span>
          <h3 className="font-serif text-2xl md:text-3xl font-bold text-white">{featured.nom}</h3>
          <p className="text-sm text-white/75 mt-2 leading-relaxed">{featured.desc}</p>
          <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-white group-hover:gap-2 transition-all">
            Explorer <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </Link>

      <div className="md:col-span-2 lg:col-span-1 lg:row-span-2 grid grid-cols-2 lg:grid-cols-1 gap-6 md:gap-8 lg:gap-10">
        {rest.slice(0, 2).map((cat) => (
          <CategoryCard key={cat.slug} cat={cat} />
        ))}
      </div>

      <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8 lg:gap-10">
        {rest.slice(2).map((cat) => (
          <CategoryCard key={cat.slug} cat={cat} tall />
        ))}
      </div>
    </div>
  );
}

function CategoryCard({ cat, tall = false }: { cat: CategorieVitrine; tall?: boolean }) {
  return (
    <Link
      href={cat.href}
      className={`group relative rounded-2xl md:rounded-3xl overflow-hidden shadow-md ${
        tall ? 'aspect-[16/7] sm:aspect-[16/6]' : 'aspect-[16/10] lg:aspect-[16/9] lg:min-h-[220px]'
      }`}
    >
      <Image
        src={cat.image || CATEGORIE_IMAGE_DEFAUT}
        alt={cat.nom}
        fill
        sizes="(max-width: 640px) 100vw, 33vw"
        className="object-cover transition duration-700 group-hover:scale-105"
        unoptimized={cat.image.startsWith('/')}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
      <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end">
        <h3 className="font-serif text-lg md:text-xl font-bold text-white">{cat.nom}</h3>
        <p className="text-xs md:text-sm text-white/70 mt-1.5 leading-relaxed">{cat.desc}</p>
      </div>
      <span className="absolute top-5 right-5 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition">
        <ArrowUpRight className="h-4 w-4" />
      </span>
    </Link>
  );
}
