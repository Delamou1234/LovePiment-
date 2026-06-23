import { prisma } from '@/shared/lib/prisma';

export class PasswordResetRepository {
  async supprimerActifsPourClient(customerId: string) {
    await prisma.passwordResetToken.deleteMany({
      where: { customerId, usedAt: null },
    });
  }

  async creer(customerId: string, codeHash: string, expiresAt: Date) {
    return prisma.passwordResetToken.create({
      data: { customerId, codeHash, expiresAt },
    });
  }

  async trouverValideParEmailEtCode(email: string, codeHash: string) {
    return prisma.passwordResetToken.findFirst({
      where: {
        codeHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
        customer: { email: email.trim().toLowerCase() },
      },
      include: { customer: true },
    });
  }

  async marquerVerifie(id: string) {
    return prisma.passwordResetToken.update({
      where: { id },
      data: { verifiedAt: new Date() },
    });
  }

  async marquerUtilise(id: string) {
    return prisma.passwordResetToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }
}

export const passwordResetRepository = new PasswordResetRepository();
