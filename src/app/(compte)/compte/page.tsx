import type { Metadata } from 'next';
import { ComptePageContent } from '@/modules/compte/components/ComptePageContent';

export const metadata: Metadata = {
  title: 'Mon compte — Love Piment&',
  description: 'Gérez votre profil, vos préférences et consultez vos commandes Love Piment&.',
  robots: { index: false, follow: false },
};

export default function ComptePage() {
  return <ComptePageContent />;
}
