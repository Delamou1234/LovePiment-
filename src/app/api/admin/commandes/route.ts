import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/prisma';
import { trackingService } from '@/modules/livraison/services/tracking.service';
import { orderService } from '@/modules/commandes/services/order.service';
import type { FiltresCommandes } from '@/modules/commandes/types';
import type { FiltreCommandeAdmin } from '@/modules/admin/lib/order-status-labels';
import { adminUnauthorized, requireAdmin } from '@/modules/admin/lib/require-admin';

function filtresDepuisParam(filtre: FiltreCommandeAdmin): FiltresCommandes {
  switch (filtre) {
    case 'payee':
      return { statutPaiement: 'REUSSIE' };
    case 'non_payee':
      return { statutPaiementNot: 'REUSSIE', statutNotIn: ['ANNULEE'] };
    case 'livree':
      return { statut: 'LIVREE' };
    case 'non_livree':
      return { statutNotIn: ['LIVREE', 'ANNULEE'] };
    case 'en_cours':
      return { statutIn: ['PAYEE', 'EN_PREPARATION', 'EXPEDIEE'] };
    case 'annulee':
      return { statut: 'ANNULEE' };
    default:
      return {};
  }
}

async function obtenirResume() {
  const [total, livree, annulee, payee, nonPayee, nonLivree, enCours] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { statut: 'LIVREE' } }),
    prisma.order.count({ where: { statut: 'ANNULEE' } }),
    prisma.order.count({ where: { statutPaiement: 'REUSSIE' } }),
    prisma.order.count({
      where: { statutPaiement: { not: 'REUSSIE' }, statut: { not: 'ANNULEE' } },
    }),
    prisma.order.count({ where: { statut: { notIn: ['LIVREE', 'ANNULEE'] } } }),
    prisma.order.count({
      where: { statut: { in: ['PAYEE', 'EN_PREPARATION', 'EXPEDIEE'] } },
    }),
  ]);

  return { total, livree, annulee, payee, nonPayee, nonLivree, enCours };
}

/** GET /api/admin/commandes */
export async function GET(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) return adminUnauthorized();

  const params = request.nextUrl.searchParams;
  const filtre = (params.get('filtre') ?? 'toutes') as FiltreCommandeAdmin;
  const page = Math.max(1, Number(params.get('page') ?? 1) || 1);
  const limit = Math.min(100, Math.max(10, Number(params.get('limit') ?? 50) || 50));

  const filtres = filtresDepuisParam(filtre);
  const clientId = params.get('clientId')?.trim();
  if (clientId) {
    filtres.customerId = clientId;
  }
  const [{ commandes, pagination }, resume] = await Promise.all([
    orderService.listerCommandes(filtres, { page, limit }),
    obtenirResume(),
  ]);

  const enriched = await Promise.all(
    commandes.map(async (c) => {
      const suivi = await trackingService.obtenirSuiviParId(c.id);
      return {
        id: c.id,
        clientNom: c.clientNom,
        clientTelephone: c.clientTelephone,
        clientAdresse: c.clientAdresse,
        clientVille: c.clientVille,
        statut: c.statut,
        modePaiement: c.modePaiement,
        statutPaiement: c.statutPaiement,
        montantTotal: Number(c.montantTotal),
        createdAt: c.createdAt.toISOString(),
        livreeLe: c.livreeLe?.toISOString() ?? null,
        itemsCount: c.items.length,
        courierId: c.courierId ?? null,
        courierNom: c.courier?.nom ?? null,
        deliveryRunId: c.deliveryRunId ?? null,
        deliveryRunLabel: c.deliveryRun?.label ?? null,
        ordreLivraison: c.ordreLivraison ?? null,
        assignedAt: c.assignedAt?.toISOString() ?? null,
        livreurPaiementRecu: c.livreurPaiementRecu ?? null,
        penaliteLivreurGn: c.penaliteLivreurGn != null ? Number(c.penaliteLivreurGn) : null,
        primeLivreurGn: c.primeLivreurGn != null ? Number(c.primeLivreurGn) : null,
        estPremiereCommande: c.estPremiereCommande ?? false,
        clientCommune: c.clientCommune ?? null,
        creneauLivraison: c.creneauLivraison ?? null,
        notesAdmin: c.notesAdmin ?? null,
        clientLatitude: c.clientLatitude != null ? Number(c.clientLatitude) : null,
        clientLongitude: c.clientLongitude != null ? Number(c.clientLongitude) : null,
        suiviToken: suivi?.suiviToken,
        suiviResume: suivi?.livraisonLibelle,
        satisfaction: suivi?.satisfaction ?? null,
      };
    }),
  );

  return NextResponse.json({ commandes: enriched, pagination, resume, filtre });
}
