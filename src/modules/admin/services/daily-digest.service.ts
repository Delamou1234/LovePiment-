import { prisma } from '@/shared/lib/prisma';
import { biAdminService } from '@/modules/admin/services/bi.service';
import { buildDailyDigestEmail } from '@/modules/admin/email/daily-digest.template';
import { getAdminEmail, getAppBaseUrl, getCronTimezone } from '@/shared/lib/email/env';
import { sendEmail } from '@/shared/lib/email/mailer';

const STATUTS_CA = ['PAYEE', 'EN_PREPARATION', 'EXPEDIEE', 'LIVREE'] as const;
const STOCK_FAIBLE_SEUIL = 5;

export type DailyDigestData = {
  dateLabel: string;
  caJour: number;
  commandesJour: number;
  panierMoyenJour: number;
  visitesJour: number;
  ca7j: number;
  commandes7j: number;
  evolutionCa7jPct: number | null;
  topProduits: {
    nom: string;
    quantiteVendue: number;
    chiffreAffaires: number;
  }[];
  commandesEnAttente: number;
  messagesNonLus: number;
  stockFaible: number;
  nouveauxClients: number;
  prevision7j: number;
  adminUrl: string;
  biUrl: string;
};

function debutJour(timezone: string): Date {
  const dateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  // Africa/Conakry = UTC+0 ; la date locale correspond à minuit UTC
  return new Date(`${dateStr}T00:00:00.000Z`);
}

function labelJour(timezone: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: timezone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());
}

export class DailyDigestService {
  async collecter(): Promise<DailyDigestData> {
    const timezone = getCronTimezone();
    const depuis = debutJour(timezone);
    const baseUrl = getAppBaseUrl();

    const filtreJour = {
      statut: { in: [...STATUTS_CA] },
      createdAt: { gte: depuis },
    };

    const [
      commandesJour,
      visitesJour,
      commandesEnAttente,
      messagesAgg,
      variantesStock,
      nouveauxClients,
      orderItemsJour,
      rapport7j,
    ] = await Promise.all([
      prisma.order.findMany({
        where: filtreJour,
        select: { montantTotal: true },
      }),
      prisma.analyticsEvent.count({
        where: { type: 'PAGE_VIEW', createdAt: { gte: depuis } },
      }),
      prisma.order.count({ where: { statut: 'EN_ATTENTE' } }),
      prisma.conversation.aggregate({ _sum: { nonLuVendeur: true } }),
      prisma.productVariant.findMany({ select: { stock: true } }),
      prisma.customer.count({ where: { createdAt: { gte: depuis } } }),
      prisma.orderItem.findMany({
        where: { ordre: filtreJour },
        select: {
          quantite: true,
          prixUnitaire: true,
          variante: {
            select: { produit: { select: { nom: true } } },
          },
        },
      }),
      biAdminService.genererRapport('7j'),
    ]);

    const caJour = commandesJour.reduce((s, c) => s + Number(c.montantTotal), 0);
    const commandesJourCount = commandesJour.length;
    const panierMoyenJour =
      commandesJourCount > 0 ? Math.round(caJour / commandesJourCount) : 0;

    const produitsMap = new Map<string, { nom: string; qty: number; ca: number }>();
    for (const item of orderItemsJour) {
      const nom = item.variante.produit.nom;
      const cur = produitsMap.get(nom) ?? { nom, qty: 0, ca: 0 };
      cur.qty += item.quantite;
      cur.ca += item.quantite * Number(item.prixUnitaire);
      produitsMap.set(nom, cur);
    }
    const topProduits = Array.from(produitsMap.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5)
      .map((p) => ({
        nom: p.nom,
        quantiteVendue: p.qty,
        chiffreAffaires: p.ca,
      }));

    const stockFaible = variantesStock.filter((v) => v.stock <= STOCK_FAIBLE_SEUIL).length;

    return {
      dateLabel: labelJour(timezone),
      caJour,
      commandesJour: commandesJourCount,
      panierMoyenJour,
      visitesJour,
      ca7j: rapport7j.chiffreAffaires.total,
      commandes7j: rapport7j.chiffreAffaires.commandes,
      evolutionCa7jPct: rapport7j.chiffreAffaires.evolutionPct,
      topProduits,
      commandesEnAttente,
      messagesNonLus: messagesAgg._sum.nonLuVendeur ?? 0,
      stockFaible,
      nouveauxClients,
      prevision7j: rapport7j.previsions.prevision7j,
      adminUrl: `${baseUrl}/admin`,
      biUrl: `${baseUrl}/admin/bi`,
    };
  }

  async envoyer(): Promise<{ sent: boolean; to: string | null; error?: string }> {
    const to = getAdminEmail();
    if (!to) {
      return { sent: false, to: null, error: 'ADMIN_EMAIL non configuré' };
    }

    try {
      const data = await this.collecter();
      const { subject, html, text } = buildDailyDigestEmail(data);
      await sendEmail({ to, subject, html, text });
      return { sent: true, to };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur envoi e-mail';
      console.error('[DailyDigest]', message);
      return { sent: false, to, error: message };
    }
  }
}

export const dailyDigestService = new DailyDigestService();
