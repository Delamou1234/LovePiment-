import { prisma } from '@/shared/lib/prisma';
import { adminStatsService, type AdminDashboardStats } from './admin-stats.service';
import { biAdminService, type BiPeriode } from './bi.service';
import { avisService } from '@/modules/avis/services/review.service';
import { STORE_SETTINGS_ID } from './store-settings.service';

const STATUTS_CA = ['PAYEE', 'EN_PREPARATION', 'EXPEDIEE', 'LIVREE'] as const;

export type DashboardOverview = {
  periode: BiPeriode;
  genereLe: string;
  stats: AdminDashboardStats;
  kpis: {
    ventesTotales: number;
    ventesEvolutionPct: number | null;
    commandes: number;
    commandesEvolutionPct: number | null;
    nouveauxClients: number;
    nouveauxClientsEvolutionPct: number | null;
    panierMoyen: number;
    panierMoyenEvolutionPct: number | null;
    visites: number;
    visitesEvolutionPct: number | null;
  };
  ventesParJour: { date: string; montant: number; label: string }[];
  ventesParCategorie: { nom: string; montant: number; pct: number; color: string }[];
  commandesRecentes: {
    id: string;
    clientNom: string;
    montantTotal: number;
    statut: string;
    createdAt: string;
  }[];
  topProduits: {
    productId: string;
    nom: string;
    image: string | null;
    categorie: string;
    quantiteVendue: number;
    stock: number;
    chiffreAffaires: number;
  }[];
  avisRecents: {
    id: string;
    clientNom: string;
    note: number;
    commentaire: string;
    productNom: string;
    createdAt: string;
  }[];
  activite: {
    visitesAujourdhui: number;
    nouvellesInscriptions: number;
    commandesAujourdhui: number;
    produitsAjoutes: number;
  };
  commandesEnAttente: {
    id: string;
    clientNom: string;
    montantTotal: number;
    createdAt: string;
    minutesAttente: number;
    estPremiereCommande: boolean;
  }[];
};

const CATEGORY_COLORS = ['#e91e8c', '#a855f7', '#f59e0b', '#22c55e', '#3b82f6', '#94a3b8'];

function periodeEnDate(periode: BiPeriode): Date {
  const d = new Date();
  if (periode === '12m') {
    d.setFullYear(d.getFullYear() - 1);
  } else {
    const jours = periode === '7j' ? 7 : periode === '30j' ? 30 : 90;
    d.setDate(d.getDate() - jours);
  }
  d.setHours(0, 0, 0, 0);
  return d;
}

function evolutionPct(actuel: number, precedent: number): number | null {
  if (precedent <= 0) return null;
  return Math.round(((actuel - precedent) / precedent) * 1000) / 10;
}

function formatJourLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
}

export class DashboardOverviewService {
  async obtenir(periode: BiPeriode = '7j'): Promise<DashboardOverview> {
    const depuis = periodeEnDate(periode);
    const now = new Date();
    const dureeMs = now.getTime() - depuis.getTime();
    const periodePrecedenteFin = new Date(depuis);
    const periodePrecedenteDebut = new Date(depuis.getTime() - dureeMs);

    const debutJour = new Date();
    debutJour.setHours(0, 0, 0, 0);

    const [
      stats,
      bi,
      commandesRecentes,
      avisRows,
      visitesPeriode,
      visitesPrecedentes,
      nouveauxClients,
      nouveauxClientsPrecedents,
      commandesPeriode,
      commandesPrecedentes,
      produitsAjoutesAujourdhui,
      orderItemsCategories,
      stocksParProduit,
      caPrecedentAgg,
      commandesPrecedentesCa,
      settingsRow,
    ] = await Promise.all([
      adminStatsService.obtenirDashboard(),
      biAdminService.genererRapport(periode),
      prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          clientNom: true,
          montantTotal: true,
          statut: true,
          createdAt: true,
        },
      }),
      avisService.listerAdmin('APPROUVE'),
      prisma.analyticsEvent.count({
        where: { type: 'PAGE_VIEW', createdAt: { gte: depuis } },
      }),
      prisma.analyticsEvent.count({
        where: {
          type: 'PAGE_VIEW',
          createdAt: { gte: periodePrecedenteDebut, lt: periodePrecedenteFin },
        },
      }),
      prisma.customer.count({ where: { createdAt: { gte: depuis } } }),
      prisma.customer.count({
        where: {
          createdAt: { gte: periodePrecedenteDebut, lt: periodePrecedenteFin },
        },
      }),
      prisma.order.count({ where: { createdAt: { gte: depuis } } }),
      prisma.order.count({
        where: {
          createdAt: { gte: periodePrecedenteDebut, lt: periodePrecedenteFin },
        },
      }),
      prisma.product.count({ where: { createdAt: { gte: debutJour } } }),
      prisma.orderItem.findMany({
        where: {
          ordre: {
            statut: { in: [...STATUTS_CA] },
            createdAt: { gte: depuis },
          },
        },
        select: {
          quantite: true,
          prixUnitaire: true,
          variante: {
            select: {
              produit: {
                select: {
                  id: true,
                  categorie: { select: { nom: true } },
                },
              },
            },
          },
        },
      }),
      prisma.productVariant.groupBy({
        by: ['productId'],
        _sum: { stock: true },
      }),
      prisma.order.aggregate({
        _sum: { montantTotal: true },
        where: {
          statut: { in: [...STATUTS_CA] },
          createdAt: { gte: periodePrecedenteDebut, lt: periodePrecedenteFin },
        },
      }),
      prisma.order.count({
        where: {
          statut: { in: [...STATUTS_CA] },
          createdAt: { gte: periodePrecedenteDebut, lt: periodePrecedenteFin },
        },
      }),
      prisma.storeSettings.findUnique({
        where: { id: STORE_SETTINGS_ID },
        select: { alerteCommandeMinutes: true },
      }),
    ]);

    const alerteMin = settingsRow?.alerteCommandeMinutes ?? 60;
    const seuilAttente = new Date(Date.now() - alerteMin * 60 * 1000);
    const commandesEnAttenteRaw = await prisma.order.findMany({
      where: {
        statut: { in: ['EN_ATTENTE', 'PAYEE', 'EN_PREPARATION'] },
        courierId: null,
        createdAt: { lte: seuilAttente },
      },
      orderBy: { createdAt: 'asc' },
      take: 8,
      select: {
        id: true,
        clientNom: true,
        montantTotal: true,
        createdAt: true,
        estPremiereCommande: true,
      },
    });

    const stockMap = new Map(stocksParProduit.map((s) => [s.productId, s._sum.stock ?? 0]));

    const catMap = new Map<string, number>();
    for (const item of orderItemsCategories) {
      const produit = item.variante.produit;
      const nom = produit.categorie.nom;
      const ca = item.quantite * Number(item.prixUnitaire);
      catMap.set(nom, (catMap.get(nom) ?? 0) + ca);
    }
    const totalCat = Array.from(catMap.values()).reduce((s, v) => s + v, 0);
    const ventesParCategorie = Array.from(catMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([nom, montant], i) => ({
        nom,
        montant,
        pct: totalCat > 0 ? Math.round((montant / totalCat) * 1000) / 10 : 0,
        color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
      }));

    const ventesParJour = bi.chiffreAffaires.parJour.map((row) => ({
      date: row.date,
      montant: row.montant,
      label: formatJourLabel(row.date),
    }));

    const caPrecedent = Number(caPrecedentAgg._sum.montantTotal ?? 0);
    const panierPrecedent =
      commandesPrecedentesCa > 0 ? Math.round(caPrecedent / commandesPrecedentesCa) : 0;
    const nouvellesInscriptionsAujourdhui = await prisma.customer.count({
      where: { createdAt: { gte: debutJour } },
    });

    return {
      periode,
      genereLe: now.toISOString(),
      stats,
      kpis: {
        ventesTotales: bi.chiffreAffaires.total,
        ventesEvolutionPct: bi.chiffreAffaires.evolutionPct,
        commandes: bi.chiffreAffaires.commandes,
        commandesEvolutionPct: evolutionPct(commandesPeriode, commandesPrecedentes),
        nouveauxClients,
        nouveauxClientsEvolutionPct: evolutionPct(nouveauxClients, nouveauxClientsPrecedents),
        panierMoyen: bi.chiffreAffaires.panierMoyen,
        panierMoyenEvolutionPct: evolutionPct(bi.chiffreAffaires.panierMoyen, panierPrecedent),
        visites: visitesPeriode,
        visitesEvolutionPct: evolutionPct(visitesPeriode, visitesPrecedentes),
      },
      ventesParJour,
      ventesParCategorie,
      commandesRecentes: commandesRecentes.map((c) => ({
        id: c.id,
        clientNom: c.clientNom,
        montantTotal: Number(c.montantTotal),
        statut: c.statut,
        createdAt: c.createdAt.toISOString(),
      })),
      topProduits: bi.topProduits.slice(0, 5).map((p) => ({
        productId: p.productId,
        nom: p.nom,
        image: p.image,
        categorie: p.categorie,
        quantiteVendue: p.quantiteVendue,
        stock: stockMap.get(p.productId) ?? 0,
        chiffreAffaires: p.chiffreAffaires,
      })),
      avisRecents: avisRows.slice(0, 4).map((a) => ({
        id: a.id,
        clientNom: a.clientNom,
        note: a.note,
        commentaire: a.commentaire,
        productNom: a.productNom,
        createdAt: a.createdAt,
      })),
      activite: {
        visitesAujourdhui: stats.visitesAujourdhui,
        nouvellesInscriptions: nouvellesInscriptionsAujourdhui,
        commandesAujourdhui: stats.commandesAujourdhui,
        produitsAjoutes: produitsAjoutesAujourdhui,
      },
      commandesEnAttente: commandesEnAttenteRaw.map((c) => ({
        id: c.id,
        clientNom: c.clientNom,
        montantTotal: Number(c.montantTotal),
        createdAt: c.createdAt.toISOString(),
        minutesAttente: Math.floor((Date.now() - c.createdAt.getTime()) / 60_000),
        estPremiereCommande: c.estPremiereCommande,
      })),
    };
  }
}

export const dashboardOverviewService = new DashboardOverviewService();
