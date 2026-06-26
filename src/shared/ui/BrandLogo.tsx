import Link from 'next/link';
import { cn } from '@/lib/utils';

const SIZE_CLASS = {
  sm: 'brand-wordmark--sm',
  md: 'brand-wordmark--md',
  lg: 'brand-wordmark--lg',
} as const;

type BrandLogoProps = {
  href?: string;
  onClick?: () => void;
  size?: keyof typeof SIZE_CLASS;
  /** `light` = fond sombre (header, footer). `dark` = fond clair (compte). */
  variant?: 'light' | 'dark';
  /** Sous-titre sous le wordmark (ex. page d'accueil). */
  tagline?: string;
  className?: string;
};

export function BrandWordmark({
  size = 'md',
  variant = 'light',
  tagline,
  className,
}: {
  size?: keyof typeof SIZE_CLASS;
  variant?: 'light' | 'dark';
  tagline?: string;
  className?: string;
}) {
  return (
    <span className={cn('brand-wordmark-wrap', className)}>
      <span
        className={cn('brand-wordmark', SIZE_CLASS[size], `brand-wordmark--${variant}`)}
        aria-hidden
      >
        <span className="brand-wordmark-love">Love</span>
        <span className="brand-wordmark-piment">
          Piment<span className="brand-wordmark-amp">&</span>
          <span className="brand-wordmark-heart" aria-hidden>
            ♥
          </span>
        </span>
      </span>
      {tagline ? <span className="brand-wordmark-tagline">{tagline}</span> : null}
    </span>
  );
}

export function BrandLogo({
  href = '/',
  onClick,
  size = 'md',
  variant = 'light',
  tagline,
  className = '',
}: BrandLogoProps) {
  const wordmark = (
    <BrandWordmark size={size} variant={variant} tagline={tagline} className={className} />
  );

  if (!href) return wordmark;

  return (
    <Link
      href={href}
      onClick={onClick}
      className="brand-wordmark-link inline-flex shrink-0 items-center"
      aria-label="Love Piment& — Accueil"
    >
      {wordmark}
    </Link>
  );
}
