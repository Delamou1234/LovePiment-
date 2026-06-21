import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { trackingService } from '@/modules/livraison/services/tracking.service';
import { OrderTrackingView } from '@/shared/components/OrderTrackingView';
import { notFound } from 'next/navigation';

type Params = Promise<{ token: string }>;

export default async function SuiviCommandePage({ params }: { params: Params }) {
  const { token } = await params;
  const suivi = await trackingService.obtenirSuiviParToken(token);

  if (!suivi) notFound();

  return (
    <div className="container-kabishop py-8 max-w-2xl animate-fadeIn">
      <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-6">
        <Link href="/" className="hover:text-zinc-900 transition font-medium">
          Accueil
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/suivi" className="hover:text-zinc-900 transition font-medium">
          Suivi
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-zinc-800 font-bold">Commande</span>
      </div>

      <OrderTrackingView token={token} initialData={suivi} />
    </div>
  );
}
