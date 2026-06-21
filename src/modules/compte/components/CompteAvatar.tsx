import { CustomerAvatar } from '@/shared/components/CustomerAvatar';
import type { CustomerProfile } from '@/modules/compte/types';

export function CompteAvatar({
  profil,
  size = 'lg',
}: {
  profil: CustomerProfile;
  size?: 'xl' | 'lg' | 'md' | 'sm' | 'xs';
}) {
  return (
    <CustomerAvatar
      name={profil.nom}
      avatarUrl={profil.avatarUrl}
      avatarCouleur={profil.avatarCouleur}
      size={size}
    />
  );
}
