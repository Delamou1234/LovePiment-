import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { courierAuthRepository, courierRepository } from '@/modules/livraison/repository/courier.repository';
import { adminUnauthorized, requireAdmin } from '@/modules/admin/lib/require-admin';

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  nom: z.string().min(2).max(120),
  telephone: z.string().min(8).max(30),
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
  notesAdmin: z.string().max(500).optional().nullable(),
});

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return adminUnauthorized();

  const livreurs = await courierRepository.lister();
  return NextResponse.json({
    livreurs: livreurs.map((l) => ({
      id: l.id,
      email: l.email,
      nom: l.nom,
      telephone: l.telephone,
      whatsapp: l.whatsapp,
      typeEngin: l.typeEngin,
      immatriculation: l.immatriculation,
      numeroCni: l.numeroCni,
      quartierBase: l.quartierBase,
      commune: l.commune,
      contactUrgenceNom: l.contactUrgenceNom,
      contactUrgenceTel: l.contactUrgenceTel,
      permisConduire: l.permisConduire,
      photoUrl: l.photoUrl,
      verifie: l.verifie,
      actif: l.actif,
      notesAdmin: l.notesAdmin,
      penalitesCumuleesGn: Number(l.penalitesCumuleesGn),
      commandesEnCours: l._count.commandes,
      createdAt: l.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return adminUnauthorized();

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: 'Données invalides' }, { status: 400 });
  }

  const existing = await courierAuthRepository.trouverParEmail(parsed.data.email);
  if (existing) {
    return NextResponse.json({ message: 'E-mail déjà utilisé' }, { status: 409 });
  }

  const livreur = await courierRepository.creer(parsed.data);

  let emailEnvoye = true;
  try {
    const { envoyerEmailBienvenueLivreur } = await import(
      '@/modules/livraison/services/courier-welcome.service'
    );
    await envoyerEmailBienvenueLivreur({
      nom: livreur.nom,
      email: livreur.email,
      password: parsed.data.password,
      telephone: livreur.telephone,
      commune: livreur.commune,
      typeEngin: livreur.typeEngin,
    });
  } catch (err) {
    emailEnvoye = false;
    console.warn('[CourierWelcome] E-mail non envoyé:', err);
  }

  return NextResponse.json(
    {
      livreur: { id: livreur.id, email: livreur.email, nom: livreur.nom },
      emailEnvoye,
      ...(emailEnvoye
        ? {}
        : {
            avertissement:
              'Compte créé mais l\'e-mail n\'a pas pu être envoyé. Vérifiez la configuration SMTP.',
          }),
    },
    { status: 201 },
  );
}
