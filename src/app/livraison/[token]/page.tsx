import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { deliveryNavigationService } from '@/modules/livraison/services/delivery-navigation.service';
import { DeliveryNavigationView } from '@/modules/livraison/components/DeliveryNavigationView';
import { getCourierSession } from '@/shared/lib/auth/session';

export const metadata: Metadata = {
  title: 'Navigation livraison',
  robots: { index: false, follow: false },
};

type Params = Promise<{ token: string }>;

export default async function LivraisonNavigationPage({ params }: { params: Params }) {
  const session = await getCourierSession();
  const { token } = await params;

  if (!session?.id) {
    redirect(`/connexion?redirect=${encodeURIComponent(`/livraison/${token}`)}`);
  }

  const livraison = await deliveryNavigationService.obtenirParTokenPourLivreur(
    token,
    session.id,
  );
  if (!livraison) notFound();

  return (
    <div className="min-h-screen bg-cream py-8 px-4">
      <div className="container-kabishop max-w-2xl">
        <DeliveryNavigationView token={token} initialData={livraison} />
      </div>
    </div>
  );
}
