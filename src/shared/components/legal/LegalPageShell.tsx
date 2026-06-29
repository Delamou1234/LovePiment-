import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export type LegalNavItem = { href: string; label: string; active?: boolean };

type Props = {
  title: string;
  description: string;
  nav: LegalNavItem[];
  children: React.ReactNode;
};

export function LegalPageShell({ title, description, nav, children }: Props) {
  return (
    <div className="animate-fadeIn bg-white">
      <div className="container-shop py-10 md:py-14 max-w-3xl">
        <nav className="flex items-center gap-1.5 text-xs text-zinc-500 mb-6" aria-label="Fil d'Ariane">
          <Link href="/" className="hover:text-[#9B1B2E] transition font-medium">
            Accueil
          </Link>
          <ChevronRight className="h-3 w-3 opacity-40" aria-hidden />
          <span className="text-zinc-800 font-semibold">{title}</span>
        </nav>

        <header className="mb-8 space-y-2">
          <h1 className="text-2xl md:text-3xl font-black text-zinc-950 tracking-tight">{title}</h1>
          <p className="text-sm text-zinc-500 leading-relaxed">{description}</p>
          <p className="text-xs text-zinc-400">
            Dernière mise à jour :{' '}
            {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </header>

        <nav
          className="mb-8 flex flex-wrap gap-2"
          aria-label="Pages légales"
        >
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                item.active
                  ? 'bg-[#9B1B2E] text-white'
                  : 'border border-[#F2D4DC] text-zinc-600 hover:border-[#9B1B2E]/40 hover:text-[#9B1B2E]'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <article className="legal-prose space-y-6 text-sm text-zinc-700 leading-relaxed">{children}</article>
      </div>
    </div>
  );
}

export const LEGAL_NAV = [
  { href: '/mentions-legales', label: 'Mentions légales' },
  { href: '/cgv', label: 'CGV' },
  { href: '/confidentialite', label: 'Confidentialité' },
] as const;
