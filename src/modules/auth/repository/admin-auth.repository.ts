import { prisma } from '@/shared/lib/prisma';
import { verifyPassword } from '@/shared/lib/auth/password';

export class AdminAuthRepository {
  async trouverParEmail(email: string) {
    return prisma.adminUser.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
  }

  async trouverParId(id: string) {
    return prisma.adminUser.findUnique({ where: { id } });
  }

  async verifierConnexion(email: string, password: string) {
    const admin = await this.trouverParEmail(email);
    if (!admin?.actif || !admin.passwordHash) return null;
    if (!verifyPassword(password, admin.passwordHash)) return null;
    return admin;
  }
}

export const adminAuthRepository = new AdminAuthRepository();
