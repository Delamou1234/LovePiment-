import type { Metadata } from 'next';
import { CompteMessagesPageContent } from '@/modules/compte/components/CompteMessagesPageContent';

export const metadata: Metadata = {
  title: 'Messagerie — Love Piment&',
  description: 'Contactez l\'équipe Love Piment& par chat, WhatsApp ou Messenger.',
  robots: { index: false, follow: false },
};

export default function CompteMessagesPage() {
  return <CompteMessagesPageContent />;
}
