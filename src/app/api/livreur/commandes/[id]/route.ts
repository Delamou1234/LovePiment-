import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { courierOrderService } from '@/modules/livraison/services/courier-order.service';
import { getCourierSession } from '@/shared/lib/auth/session';

type Params = Promise<{ id: string }>;

const livrerSchema = z.object({});

export async function GET(_request: NextRequest, { params }: { params: Params }) {
  const session = await getCourierSession();
  if (!session?.id) {
    return NextResponse.json({ message: 'Connexion requise' }, { status: 401 });
  }

  const { id } = await params;
  const commande = await courierOrderService.obtenirPourLivreur(session.id, id);
  if (!commande) {
    return NextResponse.json({ message: 'Commande introuvable' }, { status: 404 });
  }

  return NextResponse.json({ commande });
}

export async function POST(request: NextRequest, { params }: { params: Params }) {
  const session = await getCourierSession();
  if (!session?.id) {
    return NextResponse.json({ message: 'Connexion requise' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = livrerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: 'Données invalides' }, { status: 400 });
  }

  try {
    const order = await courierOrderService.marquerLivree(session.id, id);
    if (!order) {
      return NextResponse.json(
        { message: 'Commande introuvable ou non assignée à votre compte' },
        { status: 403 },
      );
    }

    return NextResponse.json({
      ok: true,
      statut: order.statut,
      statutPaiement: order.statutPaiement,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Livraison impossible';
    return NextResponse.json({ message }, { status: 400 });
  }
}
