import { prisma } from '@/shared/lib/prisma';

export type BiPeriode = '7j' | '30j' | '90j' | '12m';

const STATUTS_CA = ['PAYEE', 'EN_PREPARATION', 'EXPEDIEE', 'LIVREE'] as const;

type CommandeCaLigne = { createdAt: Date; montantTotal: unknown };

export type BiRapport = {
  periode: BiPeriode;
  genereLe: string;
  chiffreAffaires: {
    total: number;
    commandes: number;
    panierMoyen: number;
    evolutionPct: number | null;
    parJour: { date: string; montant: number; commandes: number }[];
    parMois: { mois: string; montant: number; commandes: number }[];
  };
  topProduits: {
    productId: string;
    nom: string;
    slug: string;
    image: string | null;
    categorie: string;
    quantiteVendue: number;
    chiffreAffaires: number;
  }[];
  clients: {
    inscrits: number;
    commandesInvite: number;
    clientsActifs: number;
    tauxFidelite: number;
    panierMoyen: number;
    topClients: {
      id: string | null;
      nom: string;
      email: string | null;
      commandes: number;
      totalDepense: number;
    }[];
    repartitionVilles: { ville: string; commandes: number }[];
  };
  previsions: {
    moyenneJournaliere: number;
    tendancePct: number | null;
    prevision7j: number;
    prevision30j: number;
    historique7j: { date: string; reel: number; prevision: number }[];
  };
  powerBi: {
    configure: boolean;
    embedUrl: string | null;
    reportUrl: string | null;
  };
};

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

function joursEntre(debut: Date, fin: Date): number {
  return Math.max(1, Math.ceil((fin.getTime() - debut.getTime()) / 86400000));
}

function grouperCaParJour(
  commandes: { createdAt: Date; montantTotal: unknown }[],
): Map<string, { montant: number; commandes: number }> {
  const map = new Map<string, { montant: number; commandes: number }>();
  for (const c of commandes) {
    const key = c.createdAt.toISOString().slice(0, 10);
    const cur = map.get(key) ?? { montant: 0, commandes: 0 };
    cur.montant += Number(c.montantTotal);
    cur.commandes += 1;
    map.set(key, cur);
  }
  return map;
}

function remplirSerieJours(
  depuis: Date,
  fin: Date,
  parJourMap: Map<string, { montant: number; commandes: number }>,
) {
  const rows: { date: string; montant: number; commandes: number }[] = [];
  const cursor = new Date(depuis);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(fin);
  end.setHours(0, 0, 0, 0);

  while (cursor <= end) {
    const key = cursor.toISOString().slice(0, 10);
    const v = parJourMap.get(key) ?? { montant: 0, commandes: 0 };
    rows.push({ date: key, montant: v.montant, commandes: v.commandes });
    cursor.setDate(cursor.getDate() + 1);
  }

  return rows;
}

export class BiAdminService {
  async genererRapport(periode: BiPeriode = '30j'): Promise<BiRapport> {
    const depuis = periodeEnDate(periode);
    const now = new Date();
    const dureeJours = joursEntre(depuis, now);

    const periodePrecedenteFin = new Date(depuis);
    periodePrecedenteFin.setMilliseconds(-1);
    const periodePrecedenteDebut = new Date(depuis);
    periodePrecedenteDebut.setDate(periodePrecedenteDebut.getDate() - dureeJours);

    const filtreCa = {
      statut: { in: [...STATUTS_CA] },
      createdAt: { gte: depuis },
    };

    const [
      commandesPeriode,
      commandesPeriodePrecedente,
      orderItems,
      clientsInscrits,
      commandesInvite,
      commandesClients,
    ] = await Promise.all([
      prisma.order.findMany({
        where: filtreCa,
        select: { id: true, createdAt: true, montantTotal: true, clientVille: true, customerId: true, clientNom: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.order.aggregate({
        _sum: { montantTotal: true },
        where: {
          statut: { in: [...STATUTS_CA] },
          createdAt: { gte: periodePrecedenteDebut, lt: depuis },
        },
      }),
      prisma.orderItem.findMany({
        where: { ordre: filtreCa },
        select: {
          quantite: true,
          prixUnitaire: true,
          variante: {
            select: {
              produit: {
                select: {
                  id: true,
                  nom: true,
                  slug: true,
                  images: true,
                  categorie: { select: { nom: true } },
                },
              },
            },
          },
        },
      }),
      prisma.customer.count(),
      prisma.order.count({
        where: { ...filtreCa, customerId: null },
      }),
      prisma.order.findMany({
        where: { ...filtreCa, customerId: { not: null } },
        select: {
          customerId: true,
          montantTotal: true,
          customer: { select: { id: true, nom: true, email: true } },
        },
      }),
    ]);

    const caTotal = commandesPeriode.reduce(
      (s: number, c: CommandeCaLigne) => s + Number(c.montantTotal),
      0,
    );
    const caPrecedent = Number(commandesPeriodePrecedente._sum.montantTotal ?? 0);
    const evolutionPct =
      caPrecedent > 0 ? Math.round(((caTotal - caPrecedent) / caPrecedent) * 1000) / 10 : null;

    const parJourMap = grouperCaParJour(commandesPeriode);
    const parJour = remplirSerieJours(depuis, now, parJourMap);

    const parMoisMap = new Map<string, { montant: number; commandes: number }>();
    for (const c of commandesPeriode) {
      const key = c.createdAt.toISOString().slice(0, 7);
      const cur = parMoisMap.get(key) ?? { montant: 0, commandes: 0 };
      cur.montant += Number(c.montantTotal);
      cur.commandes += 1;
      parMoisMap.set(key, cur);
    }
    const parMois = Array.from(parMoisMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mois, v]) => ({ mois, montant: v.montant, commandes: v.commandes }));

    const produitsMap = new Map<
      string,
      { nom: string; slug: string; image: string | null; categorie: string; qty: number; ca: number }
    >();
    for (const item of orderItems) {
      const p = item.variante.produit;
      const cur = produitsMap.get(p.id) ?? {
        nom: p.nom,
        slug: p.slug,
        image: p.images[0] ?? null,
        categorie: p.categorie.nom,
        qty: 0,
        ca: 0,
      };
      cur.qty += item.quantite;
      cur.ca += item.quantite * Number(item.prixUnitaire);
      produitsMap.set(p.id, cur);
    }
    const topProduits = Array.from(produitsMap.entries())
      .map(([productId, v]) => ({
        productId,
        nom: v.nom,
        slug: v.slug,
        image: v.image,
        categorie: v.categorie,
        quantiteVendue: v.qty,
        chiffreAffaires: v.ca,
      }))
      .sort((a, b) => b.quantiteVendue - a.quantiteVendue)
      .slice(0, 10);

    const clientsMap = new Map<
      string,
      { id: string; nom: string; email: string; commandes: number; total: number }
    >();
    for (const c of commandesClients) {
      if (!c.customerId || !c.customer) continue;
      const cur = clientsMap.get(c.customerId) ?? {
        id: c.customer.id,
        nom: c.customer.nom,
        email: c.customer.email,
        commandes: 0,
        total: 0,
      };
      cur.commandes += 1;
      cur.total += Number(c.montantTotal);
      clientsMap.set(c.customerId, cur);
    }
    const topClients = Array.from(clientsMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 8)
      .map((c) => ({
        id: c.id,
        nom: c.nom,
        email: c.email,
        commandes: c.commandes,
        totalDepense: c.total,
      }));

    const clientsActifs = clientsMap.size;
    const clientsFideles = Array.from(clientsMap.values()).filter((c) => c.commandes > 1).length;
    const tauxFidelite =
      clientsActifs > 0 ? Math.round((clientsFideles / clientsActifs) * 1000) / 10 : 0;

    const villesMap = new Map<string, number>();
    for (const c of commandesPeriode) {
      const ville = c.clientVille?.trim() || 'Non renseigné';
      villesMap.set(ville, (villesMap.get(ville) ?? 0) + 1);
    }
    const repartitionVilles = Array.from(villesMap.entries())
      .map(([ville, commandes]) => ({ ville, commandes }))
      .sort((a, b) => b.commandes - a.commandes)
      .slice(0, 6);

    const panierMoyen =
      commandesPeriode.length > 0
        ? Math.round(caTotal / commandesPeriode.length)
        : 0;

    const last30 = new Date();
    last30.setDate(last30.getDate() - 30);
    const commandes30j: CommandeCaLigne[] = await prisma.order.findMany({
      where: {
        statut: { in: [...STATUTS_CA] },
        createdAt: { gte: last30 },
      },
      select: { createdAt: true, montantTotal: true },
    });
    const ca30j = commandes30j.reduce(
      (s: number, c: CommandeCaLigne) => s + Number(c.montantTotal),
      0,
    );
    const moyenneJournaliere = Math.round(ca30j / 30);

    const last7 = commandes30j.filter(
      (c) => c.createdAt >= new Date(Date.now() - 7 * 86400000),
    );
    const prev7 = commandes30j.filter((c) => {
      const t = c.createdAt.getTime();
      return t >= Date.now() - 14 * 86400000 && t < Date.now() - 7 * 86400000;
    });
    const caLast7 = last7.reduce(
      (s: number, c: CommandeCaLigne) => s + Number(c.montantTotal),
      0,
    );
    const caPrev7 = prev7.reduce(
      (s: number, c: CommandeCaLigne) => s + Number(c.montantTotal),
      0,
    );
    const tendancePct =
      caPrev7 > 0 ? Math.round(((caLast7 - caPrev7) / caPrev7) * 1000) / 10 : null;

    const historique7j: BiRapport['previsions']['historique7j'] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const key = d.toISOString().slice(0, 10);
      const reel = parJourMap.get(key)?.montant ?? 0;
      historique7j.push({ date: key, reel, prevision: moyenneJournaliere });
    }

    const embedUrl = process.env.NEXT_PUBLIC_POWER_BI_EMBED_URL?.trim() || null;
    const reportUrl = process.env.NEXT_PUBLIC_POWER_BI_REPORT_URL?.trim() || null;

    return {
      periode,
      genereLe: now.toISOString(),
      chiffreAffaires: {
        total: caTotal,
        commandes: commandesPeriode.length,
        panierMoyen,
        evolutionPct,
        parJour,
        parMois,
      },
      topProduits,
      clients: {
        inscrits: clientsInscrits,
        commandesInvite,
        clientsActifs,
        tauxFidelite,
        panierMoyen,
        topClients,
        repartitionVilles,
      },
      previsions: {
        moyenneJournaliere,
        tendancePct,
        prevision7j: moyenneJournaliere * 7,
        prevision30j: moyenneJournaliere * 30,
        historique7j,
      },
      powerBi: {
        configure: Boolean(embedUrl || reportUrl),
        embedUrl,
        reportUrl,
      },
    };
  }
}

export const biAdminService = new BiAdminService();
