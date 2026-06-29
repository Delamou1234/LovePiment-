import type { Metadata } from 'next';
import { FaqPageContent } from '@/shared/components/FaqPageContent';

export const metadata: Metadata = {
  title: 'FAQ — Questions fréquentes',
  description: 'Livraison, paiement, suivi de commande et fidélité Love Piment&.',
};

export default function FaqPage() {
  return <FaqPageContent />;
}
