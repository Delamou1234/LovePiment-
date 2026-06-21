import {
  getWhatsAppApiVersion,
  getWhatsAppTemplateName,
} from '../lib/config';
import type { SendResult } from '../types';

type SendTextParams = {
  to: string;
  body: string;
};

type SendTemplateParams = {
  to: string;
  clientNom: string;
  statutLibelle: string;
  suiviUrl: string;
};

export class WhatsAppCloudProvider {
  private readonly token: string;
  private readonly phoneNumberId: string;

  constructor() {
    this.token = process.env.WHATSAPP_CLOUD_TOKEN?.trim() ?? '';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() ?? '';
  }

  get configured(): boolean {
    return Boolean(this.token && this.phoneNumberId);
  }

  async envoyerTexte(params: SendTextParams): Promise<SendResult> {
    if (!this.configured) {
      return { success: false, error: 'WhatsApp Cloud API non configurée' };
    }

    try {
      const version = getWhatsAppApiVersion();
      const res = await fetch(
        `https://graph.facebook.com/${version}/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: params.to,
            type: 'text',
            text: {
              preview_url: true,
              body: params.body,
            },
          }),
        },
      );

      const data = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        return {
          success: false,
          error: data.error?.message ?? `WhatsApp HTTP ${res.status}`,
        };
      }

      return { success: true, channel: 'whatsapp' };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erreur WhatsApp',
      };
    }
  }

  async envoyerTemplateStatut(params: SendTemplateParams): Promise<SendResult> {
    const templateName = getWhatsAppTemplateName();
    if (!this.configured || !templateName) {
      return { success: false, error: 'Template WhatsApp non configuré' };
    }

    try {
      const version = getWhatsAppApiVersion();
      const res = await fetch(
        `https://graph.facebook.com/${version}/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: params.to,
            type: 'template',
            template: {
              name: templateName,
              language: { code: 'fr' },
              components: [
                {
                  type: 'body',
                  parameters: [
                    { type: 'text', text: params.clientNom.split(/\s+/)[0] || 'Client' },
                    { type: 'text', text: params.statutLibelle },
                    { type: 'text', text: params.suiviUrl },
                  ],
                },
              ],
            },
          }),
        },
      );

      const data = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        return {
          success: false,
          error: data.error?.message ?? `WhatsApp template HTTP ${res.status}`,
        };
      }

      return { success: true, channel: 'whatsapp' };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erreur template WhatsApp',
      };
    }
  }
}

export const whatsAppCloudProvider = new WhatsAppCloudProvider();
