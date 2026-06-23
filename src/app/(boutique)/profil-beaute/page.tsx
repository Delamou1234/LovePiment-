import type { Metadata } from 'next';
import { BeautyProfilePage } from '@/modules/ia/components/BeautyProfilePage';

export const metadata: Metadata = {
  title: 'Profil beauté — KabiShop',
  description:
    'Personnalisez vos recommandations KabiShop grâce à notre quiz beauté : type de peau, préférences parfum et budget.',
};

export default function ProfilBeautePage() {
  return <BeautyProfilePage />;
}
