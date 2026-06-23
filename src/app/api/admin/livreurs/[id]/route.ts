import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  courierAuthRepository,
  courierRepository,
} from '@/modules/livraison/repository/courier.repository';
import { adminUnauthorized, requireAdmin } from '@/modules/admin/lib/require-admin';

type Params = Promise<{ id: string }>;

const patchSchema = z.object({
  nom: z.string().min(2).max(120).optional(),
  telephone: z.string().min(8).max(30).optional(),
  whatsapp: z.string().max(30).optional().nullable(),
  typeEngin: z.enum(['MOTO', 'VOITURE', 'VELO', 'AUTRE']).optional(),
  immatriculation: z.string().max(40).optional().nullable(),
  numeroCni: z.string().max(40).optional().nullable(),
  quartierBase: z.string().max(120).optional().nullable(),
  commune: z.string().max(80).optional().nullable(),
  contactUrgenceNom: z.string().max(120).optional().nullable(),
  contactUrgenceTel: z.string().max(30).optional().nullable(),
  permisConduire: z.string().max(40).optional().nullable(),
  verifie: z.boolean().optional(),
  actif: z.boolean().optional(),
  notesAdmin: z.string().max(500).optional().nullable(),
  password: z.string().min(6).optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  const admin = await requireAdmin();
  if (!admin) return adminUnauthorized();

  const { id } = await params;
  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: 'Données invalides' }, { status: 400 });
  }

  const livreur = await courierRepository.mettreAJour(id, parsed.data);
  return NextResponse.json({ livreur: { id: livreur.id, nom: livreur.nom, actif: livreur.actif } });
}

export async function DELETE(_request: NextRequest, { params }: { params: Params }) {
  const admin = await requireAdmin();
  if (!admin) return adminUnauthorized();

  const { id } = await params;
  await courierRepository.mettreAJour(id, { actif: false });
  return NextResponse.json({ ok: true });
}
