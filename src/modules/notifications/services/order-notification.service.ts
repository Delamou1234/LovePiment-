import { LIBELLES_STATUT } from '@/shared/lib/delivery-tracking';
import { getAppUrl } from '@/shared/lib/app-url';
import {
  getNotificationChannels,
  getWhatsAppTemplateName,
  isTwilioConfigured,
  isWhatsAppCloudConfigured,
} from '../lib/config';
import {
  messageChangementStatut,
  messageCommandeCreee,
  messagePaiementConfirme,
} from '../lib/messages';
import { normaliserTelephoneGuinee } from '../lib/phone';
import { twilioSmsProvider } from '../providers/sms-twilio.provider';
import { whatsAppCloudProvider } from '../providers/whatsapp-cloud.provider';
import type { OrderNotificationContext, SendResult } from '../types';

const LOG_PREFIX = '[OrderNotification]';

export class OrderNotificationService {
  private dispatch(ctx: OrderNotificationContext, message: string): void {
    void this.envoyer(ctx, message).catch((err) => {
      console.error(LOG_PREFIX, err);
    });
  }

  notifyOrderCreated(ctx: OrderNotificationContext): void {
    this.dispatch(ctx, messageCommandeCreee(ctx));
  }

  notifyStatusChange(ctx: OrderNotificationContext): void {
    this.dispatch(ctx, messageChangementStatut(ctx));
  }

  notifyPaymentConfirmed(ctx: OrderNotificationContext): void {
    this.dispatch(ctx, messagePaiementConfirme(ctx));
  }

  async envoyer(ctx: OrderNotificationContext, message: string): Promise<SendResult> {
    const phone = normaliserTelephoneGuinee(ctx.clientTelephone);
    if (!phone) {
      console.warn(`${LOG_PREFIX} Numéro invalide : ${ctx.clientTelephone}`);
      return { success: false, error: 'Numéro de téléphone invalide' };
    }

    const channels = getNotificationChannels();
    const errors: string[] = [];

    for (const channel of channels) {
      const result = await this.envoyerVia(channel, phone, message, ctx);
      if (result.success) {
        console.info(
          `${LOG_PREFIX} ✓ ${result.channel} → ${phone} (commande ${ctx.orderId.slice(-8)})`,
        );
        return result;
      }
      if (result.error) errors.push(`${channel}: ${result.error}`);
    }

    console.warn(`${LOG_PREFIX} Échec envoi → ${phone}`, errors.join(' | '));
    return { success: false, error: errors.join(' | ') || 'Aucun canal disponible' };
  }

  private async envoyerVia(
    channel: 'whatsapp' | 'sms' | 'log',
    phone: string,
    message: string,
    ctx: OrderNotificationContext,
  ): Promise<SendResult> {
    switch (channel) {
      case 'whatsapp': {
        if (!isWhatsAppCloudConfigured()) {
          return { success: false, error: 'WhatsApp Cloud non configuré' };
        }

        const templateName = getWhatsAppTemplateName();
        if (templateName) {
          const templateResult = await whatsAppCloudProvider.envoyerTemplateStatut({
            to: phone,
            clientNom: ctx.clientNom,
            statutLibelle: LIBELLES_STATUT[ctx.statut],
            suiviUrl: `${getAppUrl()}/suivi?token=${ctx.suiviToken}`,
          });
          if (templateResult.success) return templateResult;
        }

        return whatsAppCloudProvider.envoyerTexte({ to: phone, body: message });
      }

      case 'sms': {
        if (!isTwilioConfigured()) {
          return { success: false, error: 'Twilio non configuré' };
        }
        return twilioSmsProvider.envoyer({ to: phone, body: message });
      }

      case 'log':
      default:
        console.info(`${LOG_PREFIX} [LOG] → ${phone}\n${message}`);
        return { success: true, channel: 'log' };
    }
  }
}

export const orderNotificationService = new OrderNotificationService();

export function buildNotificationContext(
  order: {
    id: string;
    suiviToken: string;
    clientNom: string;
    clientTelephone: string;
    clientVille: string;
    montantTotal: unknown;
    statut: OrderNotificationContext['statut'];
    modePaiement: OrderNotificationContext['modePaiement'];
    numeroSuivi?: string | null;
    carrier?: { nom: string } | null;
  },
  extras?: { statutMessage?: string },
): OrderNotificationContext {
  return {
    orderId: order.id,
    suiviToken: order.suiviToken,
    clientNom: order.clientNom,
    clientTelephone: order.clientTelephone,
    clientVille: order.clientVille,
    montantTotal: Number(order.montantTotal),
    statut: order.statut,
    modePaiement: order.modePaiement,
    numeroSuivi: order.numeroSuivi ?? null,
    carrierNom: order.carrier?.nom ?? null,
    statutMessage: extras?.statutMessage,
  };
}
