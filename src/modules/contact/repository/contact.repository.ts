import { prisma } from '@/shared/lib/prisma';
import type { ContactStatusKey, CreerContactDto } from '../types';

export class ContactRepository {
  async creer(dto: CreerContactDto) {
    return prisma.contactMessage.create({
      data: {
        nom: dto.nom,
        email: dto.email,
        telephone: dto.telephone,
        sujet: dto.sujet,
        message: dto.message,
        customerId: dto.customerId,
      },
    });
  }

  async lister(limit = 50) {
    return prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async compterNonLus() {
    return prisma.contactMessage.count({ where: { statut: 'NOUVEAU' } });
  }

  async trouverParId(id: string) {
    return prisma.contactMessage.findUnique({ where: { id } });
  }

  async mettreAJourStatut(id: string, statut: ContactStatusKey) {
    return prisma.contactMessage.update({
      where: { id },
      data: {
        statut,
        traiteLe: statut === 'TRAITE' ? new Date() : undefined,
      },
    });
  }
}

export const contactRepository = new ContactRepository();
