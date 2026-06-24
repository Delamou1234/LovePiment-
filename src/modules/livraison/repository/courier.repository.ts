import { prisma } from '@/shared/lib/prisma';
import { hashPassword, verifyPassword } from '@/shared/lib/auth/password';
import type { CourierVehicleType } from '@prisma/client';

export class CourierAuthRepository {
  async trouverParEmail(email: string) {
    return prisma.courier.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
  }

  async trouverParId(id: string) {
    return prisma.courier.findUnique({ where: { id } });
  }

  async verifierConnexion(email: string, password: string) {
    const courier = await this.trouverParEmail(email);
    if (!courier?.actif || !courier.passwordHash) return null;
    if (!verifyPassword(password, courier.passwordHash)) return null;
    return courier;
  }
}

export class CourierRepository {
  async trouverParId(id: string) {
    return prisma.courier.findUnique({ where: { id } });
  }

  async lister(actifOnly = false) {
    return prisma.courier.findMany({
      where: actifOnly ? { actif: true, verifie: true } : undefined,
      orderBy: { nom: 'asc' },
      include: {
        _count: {
          select: {
            commandes: {
              where: { statut: { in: ['PAYEE', 'EN_PREPARATION', 'EXPEDIEE'] } },
            },
          },
        },
      },
    });
  }

  async creer(data: {
    email: string;
    password: string;
    nom: string;
    telephone: string;
    whatsapp?: string | null;
    typeEngin?: CourierVehicleType;
    immatriculation?: string | null;
    numeroCni?: string | null;
    quartierBase?: string | null;
    commune?: string | null;
    contactUrgenceNom?: string | null;
    contactUrgenceTel?: string | null;
    permisConduire?: string | null;
    photoUrl?: string | null;
    verifie?: boolean;
    notesAdmin?: string | null;
  }) {
    return prisma.courier.create({
      data: {
        email: data.email.trim().toLowerCase(),
        passwordHash: hashPassword(data.password),
        nom: data.nom.trim(),
        telephone: data.telephone.trim(),
        whatsapp: data.whatsapp?.trim() || null,
        typeEngin: data.typeEngin ?? 'MOTO',
        immatriculation: data.immatriculation?.trim() || null,
        numeroCni: data.numeroCni?.trim() || null,
        quartierBase: data.quartierBase?.trim() || null,
        commune: data.commune?.trim() || null,
        contactUrgenceNom: data.contactUrgenceNom?.trim() || null,
        contactUrgenceTel: data.contactUrgenceTel?.trim() || null,
        permisConduire: data.permisConduire?.trim() || null,
        photoUrl: data.photoUrl?.trim() || null,
        verifie: data.verifie ?? false,
        notesAdmin: data.notesAdmin?.trim() || null,
      },
    });
  }

  async mettreAJour(
    id: string,
    data: Partial<{
      nom: string;
      telephone: string;
      whatsapp: string | null;
      typeEngin: CourierVehicleType;
      immatriculation: string | null;
      numeroCni: string | null;
      quartierBase: string | null;
      commune: string | null;
      contactUrgenceNom: string | null;
      contactUrgenceTel: string | null;
      permisConduire: string | null;
      photoUrl: string | null;
      verifie: boolean;
      actif: boolean;
      notesAdmin: string | null;
      password: string;
    }>,
  ) {
    const { password, ...rest } = data;
    return prisma.courier.update({
      where: { id },
      data: {
        ...rest,
        ...(password ? { passwordHash: hashPassword(password) } : {}),
      },
    });
  }
}

export const courierAuthRepository = new CourierAuthRepository();
export const courierRepository = new CourierRepository();
