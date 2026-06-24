import { prisma } from '@/shared/lib/prisma';

export type ClientAdminDto = {
  id: string;
  email: string;
  nom: string;
  telephone: string | null;
  viaGoogle: boolean;
  commandes: number;
  montantTotal: number;
  derniereCommande: string | null;
  inscritLe: string;
  pointsFidelite: number;
  adressePreferee: string | null;
  villePreferee: string | null;
};

export class ClientAdminService {
  async listerClients(): Promise<ClientAdminDto[]> {
    const customers = await prisma.customer.findMany({
      select: {
        id: true,
        email: true,
        nom: true,
        telephone: true,
        googleId: true,
        createdAt: true,
        pointsFidelite: true,
        adressePreferee: true,
        villePreferee: true,
        commandes: {
          select: {
            montantTotal: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return customers.map((c) => {
      const montantTotal = c.commandes.reduce((acc, o) => acc + Number(o.montantTotal), 0);
      const derniere = c.commandes[0]?.createdAt ?? null;

      return {
        id: c.id,
        email: c.email,
        nom: c.nom,
        telephone: c.telephone,
        viaGoogle: Boolean(c.googleId),
        commandes: c.commandes.length,
        montantTotal,
        derniereCommande: derniere?.toISOString() ?? null,
        inscritLe: c.createdAt.toISOString(),
        pointsFidelite: c.pointsFidelite,
        adressePreferee: c.adressePreferee,
        villePreferee: c.villePreferee,
      };
    });
  }
}

export const clientAdminService = new ClientAdminService();
