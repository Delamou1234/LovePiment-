import type { Metadata } from 'next';
import { BeautyProfilePage } from '@/modules/ia/components/BeautyProfilePage';

export const metadata: Metadata = {
  title: 'Profil intime — Love Piment&',
  description:
    'Personnalisez vos recommandations Love Piment& : préférences, envies et budget pour une expérience sur mesure.',
};

export default function ProfilBeautePage() {
  return <BeautyProfilePage />;
}
