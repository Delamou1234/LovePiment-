import Link from 'next/link';
import { Home } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  className?: string;
  /** `admin` = back-office blanc · `boutique` = espaces client / livreur */
  variant?: 'admin' | 'boutique';
};

export function DashboardHomeButton({ className, variant = 'boutique' }: Props) {
  const isAdmin = variant === 'admin';

  return (
    <Link
      href="/"
      className={cn(
        'inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold shadow-sm transition',
        isAdmin
          ? 'border-zinc-200 bg-white text-zinc-700 hover:border-[#e91e8c]/40 hover:text-[#9B1B2E]'
          : 'border-beige-border bg-white text-zinc-700 hover:border-olive/35 hover:text-olive',
        className,
      )}
      title="Retour à l'accueil de la boutique"
    >
      <Home className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
      <span>Accueil</span>
    </Link>
  );
}
