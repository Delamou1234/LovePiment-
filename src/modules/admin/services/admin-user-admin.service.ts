import { prisma } from '@/shared/lib/prisma';
import { hashPassword } from '@/shared/lib/auth/password';

export type AdminUserDto = {
  id: string;
  email: string;
  nom: string;
  actif: boolean;
  createdAt: string;
  updatedAt: string;
};

export class AdminUserAdminService {
  async lister(): Promise<AdminUserDto[]> {
    const rows = await prisma.adminUser.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        nom: true,
        actif: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
  }

  async creer(input: { email: string; password: string; nom: string }) {
    const email = input.email.trim().toLowerCase();
    const existant = await prisma.adminUser.findUnique({ where: { email } });
    if (existant) {
      throw new Error('Cet e-mail est déjà utilisé par un administrateur.');
    }

    return prisma.adminUser.create({
      data: {
        email,
        nom: input.nom.trim(),
        passwordHash: hashPassword(input.password),
        actif: true,
      },
      select: { id: true, email: true, nom: true, actif: true },
    });
  }

  async mettreAJour(
    id: string,
    input: { nom?: string; actif?: boolean; password?: string },
    currentAdminId: string,
  ) {
    const cible = await prisma.adminUser.findUnique({ where: { id } });
    if (!cible) throw new Error('Administrateur introuvable.');

    if (input.actif === false && id === currentAdminId) {
      throw new Error('Vous ne pouvez pas désactiver votre propre compte.');
    }

    if (input.actif === false) {
      const actifs = await prisma.adminUser.count({ where: { actif: true, id: { not: id } } });
      if (actifs === 0) {
        throw new Error('Impossible de désactiver le dernier administrateur actif.');
      }
    }

    return prisma.adminUser.update({
      where: { id },
      data: {
        ...(input.nom !== undefined ? { nom: input.nom.trim() } : {}),
        ...(input.actif !== undefined ? { actif: input.actif } : {}),
        ...(input.password ? { passwordHash: hashPassword(input.password) } : {}),
      },
      select: { id: true, email: true, nom: true, actif: true },
    });
  }

  async obtenirVueEnsemble() {
    const [clients, livreurs, admins, adminsActifs] = await Promise.all([
      prisma.customer.count(),
      prisma.courier.count(),
      prisma.adminUser.count(),
      prisma.adminUser.count({ where: { actif: true } }),
    ]);
    return { clients, livreurs, admins, adminsActifs };
  }
}

export const adminUserAdminService = new AdminUserAdminService();
