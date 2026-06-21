import { formatE164 } from '../lib/phone';
import type { SendResult } from '../types';

export class TwilioSmsProvider {
  private readonly accountSid: string;
  private readonly authToken: string;
  private readonly from: string;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID?.trim() ?? '';
    this.authToken = process.env.TWILIO_AUTH_TOKEN?.trim() ?? '';
    this.from = process.env.TWILIO_SMS_FROM?.trim() ?? '';
  }

  get configured(): boolean {
    return Boolean(this.accountSid && this.authToken && this.from);
  }

  async envoyer(params: { to: string; body: string }): Promise<SendResult> {
    if (!this.configured) {
      return { success: false, error: 'Twilio SMS non configuré' };
    }

    try {
      const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');
      const body = new URLSearchParams({
        To: formatE164(params.to),
        From: this.from,
        Body: params.body,
      });

      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: body.toString(),
        },
      );

      const data = (await res.json()) as { message?: string; error_message?: string };
      if (!res.ok) {
        return {
          success: false,
          error: data.message ?? data.error_message ?? `Twilio HTTP ${res.status}`,
        };
      }

      return { success: true, channel: 'sms' };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erreur SMS',
      };
    }
  }
}

export const twilioSmsProvider = new TwilioSmsProvider();
