import { User } from 'lucide-react';
import { couleurAvatar, initialesNom } from '@/modules/compte/types';

export type AvatarSize = 'xl' | 'lg' | 'md' | 'sm' | 'xs';

const SIZE_CLASSES: Record<AvatarSize, string> = {
  xl: 'h-28 w-28 text-3xl ring-[5px]',
  lg: 'h-24 w-24 text-2xl ring-[5px]',
  md: 'h-16 w-16 text-lg ring-4',
  sm: 'h-10 w-10 text-sm ring-2',
  xs: 'h-8 w-8 text-xs ring-2',
};

const ICON_SIZES: Record<AvatarSize, string> = {
  xl: 'h-10 w-10',
  lg: 'h-9 w-9',
  md: 'h-7 w-7',
  sm: 'h-5 w-5',
  xs: 'h-4 w-4',
};

type Props = {
  name: string;
  avatarUrl?: string | null;
  avatarCouleur?: string;
  size?: AvatarSize;
  className?: string;
  ringClassName?: string;
  /** Afficher les initiales au lieu de l'icône utilisateur si pas de photo */
  fallbackInitials?: boolean;
};

export function CustomerAvatar({
  name,
  avatarUrl,
  avatarCouleur = 'olive',
  size = 'md',
  className = '',
  ringClassName = 'ring-white',
  fallbackInitials = false,
}: Props) {
  const dim = SIZE_CLASSES[size];
  const ring = ringClassName;
  const base = `${dim} rounded-full shadow-lg ${ring} ${className}`;

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name}
        className={`${base} object-cover bg-beige`}
      />
    );
  }

  if (fallbackInitials) {
    const bg = couleurAvatar(avatarCouleur);
    return (
      <div
        className={`${base} flex items-center justify-center font-bold text-white`}
        style={{ backgroundColor: bg }}
        aria-hidden
      >
        {initialesNom(name) || '?'}
      </div>
    );
  }

  return (
    <div
      className={`${base} flex items-center justify-center bg-cream text-zinc-400`}
      aria-hidden
    >
      <User className={ICON_SIZES[size]} strokeWidth={1.5} />
    </div>
  );
}
