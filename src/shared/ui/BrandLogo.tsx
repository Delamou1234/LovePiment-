import Image from 'next/image';
import Link from 'next/link';

export const BRAND_LOGO_SRC = '/images/logo.png';

const SIZES = {
  sm: { width: 96, height: 38, className: 'h-8 w-auto sm:h-9' },
  md: { width: 128, height: 50, className: 'h-10 w-auto sm:h-11' },
  lg: { width: 160, height: 64, className: 'h-12 w-auto sm:h-14' },
} as const;

type BrandLogoProps = {
  href?: string;
  onClick?: () => void;
  size?: keyof typeof SIZES;
  className?: string;
  priority?: boolean;
};

export function BrandLogo({
  href = '/',
  onClick,
  size = 'md',
  className = '',
  priority = false,
}: BrandLogoProps) {
  const { width, height, className: sizeClass } = SIZES[size];

  const image = (
    <Image
      src={BRAND_LOGO_SRC}
      alt="Love Piment&"
      width={width}
      height={height}
      priority={priority}
      className={`object-contain object-left ${sizeClass} ${className}`.trim()}
    />
  );

  if (!href) return image;

  return (
    <Link href={href} onClick={onClick} className="inline-flex shrink-0 items-center">
      {image}
    </Link>
  );
}
