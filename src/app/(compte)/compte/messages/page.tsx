import type { Metadata } from 'next';
import { CompteMessagesPageContent } from '@/modules/compte/components/CompteMessagesPageContent';

export const metadata: Metadata = {
  title: 'Messagerie — KabiShop',
  description: 'Contactez l\'équipe KabiShop par chat, WhatsApp ou Messenger.',
  robots: { index: false, follow: false },
};

export default function CompteMessagesPage() {
  return <CompteMessagesPageContent />;
}
