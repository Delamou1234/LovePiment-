import { prisma } from '@/shared/lib/prisma';
import { hashPassword, verifyPassword } from '@/shared/lib/auth/password';
import { genererCodeParrainage } from '@/modules/marketing/lib/referral-code';
import type { MettreAJourProfilDto } from '@/modules/compte/types';
import { AVATAR_COULEURS } from '@/modules/compte/types';

const COULEURS_VALIDES = new Set<string>(AVATAR_COULEURS.map((c) => c.id));

export class CustomerAuthRepository {
  async trouverParEmail(email: string) {
    return prisma.customer.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
  }

  async trouverParId(id: string) {
    return prisma.customer.findUnique({ where: { id } });
  }

  async mettreAJourProfil(id: string, data: MettreAJourProfilDto) {
    const update: Record<string, string | null> = {};

    if (data.nom !== undefined) update.nom = data.nom.trim();
    if (data.telephone !== undefined) {
      update.telephone = data.telephone?.trim() || null;
    }
    if (data.adressePreferee !== undefined) {
      update.adressePreferee = data.adressePreferee?.trim() || null;
    }
    if (data.villePreferee !== undefined) {
      update.villePreferee = data.villePreferee?.trim() || null;
    }
    if (data.avatarCouleur !== undefined && COULEURS_VALIDES.has(data.avatarCouleur)) {
      update.avatarCouleur = data.avatarCouleur;
    }

    return prisma.customer.update({
      where: { id },
      data: update,
    });
  }

  async mettreAJourAvatarUrl(id: string, avatarUrl: string | null) {
    return prisma.customer.update({
      where: { id },
      data: { avatarUrl },
    });
  }

  async changerMotDePasse(id: string, ancien: string, nouveau: string): Promise<'ok' | 'invalid' | 'no_password'> {
    const customer = await this.trouverParId(id);
    if (!customer?.passwordHash) return 'no_password';
    if (!verifyPassword(ancien, customer.passwordHash)) return 'invalid';

    await prisma.customer.update({
      where: { id },
      data: { passwordHash: hashPassword(nouveau) },
    });
    return 'ok';
  }

  async trouverDerniereCommande(customerId: string) {
    return prisma.order.findFirst({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      select: {
        clientAdresse: true,
        clientVille: true,
      },
    });
  }

  async statsClient(customerId: string) {
    const agg = await prisma.order.aggregate({
      where: {
        customerId,
        statut: { in: ['PAYEE', 'EN_PREPARATION', 'EXPEDIEE', 'LIVREE'] },
      },
      _sum: { montantTotal: true },
      _count: { id: true },
    });
    return {
      commandes: agg._count.id,
      totalDepense: Number(agg._sum.montantTotal ?? 0),
    };
  }

  async listerCommandesClient(customerId: string, limit = 20) {
    return prisma.order.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        statut: true,
        montantTotal: true,
        createdAt: true,
        suiviToken: true,
        _count: { select: { items: true } },
      },
    });
  }

  async creer(data: { email: string; password: string; nom: string; telephone?: string }) {
    return prisma.customer.create({
      data: {
        email: data.email.trim().toLowerCase(),
        passwordHash: hashPassword(data.password),
        nom: data.nom.trim(),
        telephone: data.telephone?.trim(),
        codeParrainage: genererCodeParrainage(),
      },
    });
  }

  async verifierConnexion(email: string, password: string) {
    const customer = await this.trouverParEmail(email);
    if (!customer?.passwordHash || !verifyPassword(password, customer.passwordHash)) {
      return null;
    }
    return customer;
  }

  async trouverParGoogleId(googleId: string) {
    return prisma.customer.findUnique({ where: { googleId } });
  }

  async trouverOuCreerViaGoogle(data: {
    googleId: string;
    email: string;
    nom: string;
    avatarUrl?: string;
  }) {
    return this.trouverOuCreerViaProvider('googleId', data.googleId, data);
  }

  async trouverOuCreerViaFacebook(data: {
    facebookId: string;
    email: string;
    nom: string;
    avatarUrl?: string;
  }) {
    return this.trouverOuCreerViaProvider('facebookId', data.facebookId, data);
  }

  async trouverOuCreerViaApple(data: { appleId: string; email: string; nom: string }) {
    return this.trouverOuCreerViaProvider('appleId', data.appleId, data);
  }

  private async trouverOuCreerViaProvider(
    field: 'googleId' | 'facebookId' | 'appleId',
    providerId: string,
    data: { email: string; nom: string; avatarUrl?: string },
  ) {
    const email = data.email.trim().toLowerCase();

    const byProvider = await prisma.customer.findFirst({
      where: { [field]: providerId },
    });
    if (byProvider) {
      if (data.avatarUrl && byProvider.avatarUrl !== data.avatarUrl) {
        return prisma.customer.update({
          where: { id: byProvider.id },
          data: { avatarUrl: data.avatarUrl, nom: data.nom || byProvider.nom },
        });
      }
      return byProvider;
    }

    const byEmail = await this.trouverParEmail(email);
    if (byEmail) {
      return prisma.customer.update({
        where: { id: byEmail.id },
        data: {
          [field]: providerId,
          avatarUrl: data.avatarUrl ?? byEmail.avatarUrl,
          nom: byEmail.nom || data.nom,
        },
      });
    }

    return prisma.customer.create({
      data: {
        email,
        [field]: providerId,
        nom: data.nom,
        avatarUrl: data.avatarUrl,
        passwordHash: null,
        codeParrainage: genererCodeParrainage(),
      },
    });
  }

  async listerAdresses(customerId: string) {
    return prisma.customerAddress.findMany({
      where: { customerId },
      orderBy: [{ parDefaut: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async creerAdresse(
    customerId: string,
    data: { label?: string; adresse: string; ville: string; telephone?: string; parDefaut?: boolean },
  ) {
    if (data.parDefaut) {
      await prisma.customerAddress.updateMany({
        where: { customerId },
        data: { parDefaut: false },
      });
    }
    return prisma.customerAddress.create({
      data: {
        customerId,
        label: data.label?.trim() || null,
        adresse: data.adresse.trim(),
        ville: data.ville.trim(),
        telephone: data.telephone?.trim() || null,
        parDefaut: data.parDefaut ?? false,
      },
    });
  }

  async mettreAJourAdresse(
    customerId: string,
    addressId: string,
    data: {
      label?: string | null;
      adresse?: string;
      ville?: string;
      telephone?: string | null;
      parDefaut?: boolean;
    },
  ) {
    const existing = await prisma.customerAddress.findFirst({
      where: { id: addressId, customerId },
    });
    if (!existing) return null;

    if (data.parDefaut) {
      await prisma.customerAddress.updateMany({
        where: { customerId },
        data: { parDefaut: false },
      });
    }

    return prisma.customerAddress.update({
      where: { id: addressId },
      data: {
        ...(data.label !== undefined && { label: data.label?.trim() || null }),
        ...(data.adresse !== undefined && { adresse: data.adresse.trim() }),
        ...(data.ville !== undefined && { ville: data.ville.trim() }),
        ...(data.telephone !== undefined && { telephone: data.telephone?.trim() || null }),
        ...(data.parDefaut !== undefined && { parDefaut: data.parDefaut }),
      },
    });
  }

  async supprimerAdresse(customerId: string, addressId: string) {
    const existing = await prisma.customerAddress.findFirst({
      where: { id: addressId, customerId },
    });
    if (!existing) return false;
    await prisma.customerAddress.delete({ where: { id: addressId } });
    return true;
  }

  async listerWishlist(customerId: string) {
    return prisma.wishlistItem.findMany({
      where: { customerId },
      include: {
        product: {
          include: {
            categorie: true,
            variantes: {
              where: { stock: { gt: 0 } },
              take: 1,
              orderBy: { stock: 'desc' },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listerWishlistProductIds(customerId: string) {
    const rows = await prisma.wishlistItem.findMany({
      where: { customerId },
      select: { productId: true },
    });
    return rows.map((r) => r.productId);
  }

  async ajouterWishlist(customerId: string, productId: string) {
    return prisma.wishlistItem.upsert({
      where: { customerId_productId: { customerId, productId } },
      create: { customerId, productId },
      update: {},
    });
  }

  async retirerWishlist(customerId: string, productId: string) {
    const deleted = await prisma.wishlistItem.deleteMany({
      where: { customerId, productId },
    });
    return deleted.count > 0;
  }
}

export const customerAuthRepository = new CustomerAuthRepository();
