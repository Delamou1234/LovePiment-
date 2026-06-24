import { NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/prisma';

type Params = Promise<{ id: string }>;

const ENGIN_LABELS: Record<string, string> = {
  MOTO: 'Moto',
  VOITURE: 'Voiture',
  VELO: 'Vélo',
  AUTRE: 'Autre',
};

function courierCardRef(id: string) {
  return `LP-${id.slice(-8).toUpperCase()}`;
}

/** GET /api/public/livreurs/[id] — vérification publique carte livreur */
export async function GET(_request: Request, { params }: { params: Params }) {
  const { id } = await params;

  const livreur = await prisma.courier.findUnique({
    where: { id },
    select: {
      id: true,
      nom: true,
      photoUrl: true,
      typeEngin: true,
      commune: true,
      verifie: true,
      actif: true,
    },
  });

  if (!livreur) {
    return NextResponse.json({ message: 'Carte introuvable' }, { status: 404 });
  }

  return NextResponse.json({
    livreur: {
      id: livreur.id,
      nom: livreur.nom,
      photoUrl: livreur.photoUrl,
      typeEngin: ENGIN_LABELS[livreur.typeEngin] ?? livreur.typeEngin,
      commune: livreur.commune,
      verifie: livreur.verifie,
      actif: livreur.actif,
      reference: courierCardRef(livreur.id),
      valide: livreur.actif && livreur.verifie,
    },
  });
}
