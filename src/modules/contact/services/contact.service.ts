import { contactRepository } from '../repository/contact.repository';
import { buildContactNotificationEmail } from '../email/contact-notification.template';
import {
  labelSujet,
  type ContactMessageResume,
  type ContactStatusKey,
  type CreerContactDto,
} from '../types';
import { getAdminEmail, getAppBaseUrl } from '@/shared/lib/email/env';
import { sendEmail } from '@/shared/lib/email/mailer';

function serialiser(row: {
  id: string;
  nom: string;
  email: string;
  telephone: string | null;
  sujet: CreerContactDto['sujet'];
  message: string;
  statut: ContactStatusKey;
  createdAt: Date;
  traiteLe: Date | null;
}): ContactMessageResume {
  return {
    id: row.id,
    nom: row.nom,
    email: row.email,
    telephone: row.telephone,
    sujet: row.sujet,
    sujetLabel: labelSujet(row.sujet),
    message: row.message,
    statut: row.statut,
    createdAt: row.createdAt.toISOString(),
    traiteLe: row.traiteLe?.toISOString() ?? null,
  };
}

export class ContactService {
  async envoyerMessage(dto: CreerContactDto): Promise<ContactMessageResume> {
    const message = await contactRepository.creer({
      ...dto,
      email: dto.email.trim().toLowerCase(),
      nom: dto.nom.trim(),
      telephone: dto.telephone?.trim() || undefined,
      message: dto.message.trim(),
    });

    const adminEmail = getAdminEmail();
    if (adminEmail) {
      try {
        const baseUrl = getAppBaseUrl();
        const { subject, html, text } = buildContactNotificationEmail({
          nom: message.nom,
          email: message.email,
          telephone: message.telephone,
          sujet: message.sujet,
          message: message.message,
          adminUrl: `${baseUrl}/admin/contact`,
        });
        await sendEmail({ to: adminEmail, subject, html, text });
      } catch (err) {
        console.warn('[Contact] Notification e-mail non envoyée:', err);
      }
    }

    return serialiser(message);
  }

  async listerMessages(): Promise<ContactMessageResume[]> {
    const rows = await contactRepository.lister();
    return rows.map(serialiser);
  }

  async compterNonLus(): Promise<number> {
    return contactRepository.compterNonLus();
  }

  async mettreAJourStatut(id: string, statut: ContactStatusKey): Promise<ContactMessageResume | null> {
    const existing = await contactRepository.trouverParId(id);
    if (!existing) return null;
    const updated = await contactRepository.mettreAJourStatut(id, statut);
    return serialiser(updated);
  }
}

export const contactService = new ContactService();
