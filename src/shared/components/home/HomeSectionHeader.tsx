import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface HomeSectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
  align?: 'left' | 'center';
}

export function HomeSectionHeader({
  eyebrow,
  title,
  description,
  href,
  linkLabel = 'Voir tout',
  align = 'left',
}: HomeSectionHeaderProps) {
  const centered = align === 'center';

  return (
    <div
      className={`mb-8 md:mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between ${
        centered ? 'text-center md:text-center md:flex-col md:items-center' : ''
      }`}
    >
      <div className={centered ? 'max-w-xl mx-auto' : 'max-w-2xl'}>
        {eyebrow && (
          <div className={`flex items-center gap-3 mb-3 ${centered ? 'justify-center' : ''}`}>
            <span className="h-px w-8 bg-olive/40 hidden sm:block" aria-hidden />
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-olive">
              {eyebrow}
            </p>
            {!centered && <span className="h-px flex-1 max-w-16 bg-olive/20 hidden md:block" aria-hidden />}
          </div>
        )}
        <h2 className="font-serif text-2xl md:text-3xl lg:text-[2.125rem] font-bold text-zinc-900 tracking-tight leading-tight">
          {title}
        </h2>
        {description && (
          <p className="mt-3 text-sm md:text-[15px] text-zinc-500 leading-relaxed">{description}</p>
        )}
      </div>
      {href && !centered && (
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 rounded-full border border-beige-border bg-white px-5 py-2.5 text-sm font-semibold text-zinc-800 hover:border-olive/30 hover:text-olive transition shrink-0 group shadow-sm"
        >
          {linkLabel}
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </Link>
      )}
      {href && centered && (
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 rounded-full border border-beige-border bg-white px-5 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-cream transition shadow-sm"
        >
          {linkLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
