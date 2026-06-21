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
      className={`mb-8 md:mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between ${
        centered ? 'text-center md:text-center md:flex-col md:items-center' : ''
      }`}
    >
      <div className={centered ? 'max-w-xl' : 'max-w-2xl'}>
        {eyebrow && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#4a5240] mb-2">
            {eyebrow}
          </p>
        )}
        <h2 className="font-serif text-2xl md:text-3xl lg:text-[2rem] font-bold text-zinc-900 tracking-tight">
          {title}
        </h2>
        {description && (
          <p className="mt-2 text-sm md:text-[15px] text-zinc-500 leading-relaxed">{description}</p>
        )}
      </div>
      {href && !centered && (
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#4a5240] hover:text-[#3d4534] transition shrink-0 group"
        >
          {linkLabel}
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </Link>
      )}
      {href && centered && (
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#ebe4d8] bg-white px-5 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-[#faf7f2] transition"
        >
          {linkLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
