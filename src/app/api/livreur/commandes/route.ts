import { NextResponse } from 'next/server';
import { courierAuthRepository } from '@/modules/livraison/repository/courier.repository';
import { courierOrderService } from '@/modules/livraison/services/courier-order.service';
import { getCourierSession } from '@/shared/lib/auth/session';

export async function GET() {
  const session = await getCourierSession();
  if (!session?.id) {
    return NextResponse.json({ message: 'Connexion requise' }, { status: 401 });
  }

  const courier = await courierAuthRepository.trouverParId(session.id);
  if (!courier) {
    return NextResponse.json({ message: 'Compte introuvable' }, { status: 404 });
  }

  const { tournees, livraisonsIsoles } =
    await courierOrderService.listerTourneesPourLivreur(session.id);

  return NextResponse.json({
    profil: {
      id: courier.id,
      nom: courier.nom,
      email: courier.email,
      telephone: courier.telephone,
      commune: courier.commune,
      typeEngin: courier.typeEngin,
      penalitesCumuleesGn: Number(courier.penalitesCumuleesGn),
    },
    tournees,
    livraisonsIsoles,
  });
}
