import type { NotificationChannel } from '../types';

export function getNotificationChannels(): NotificationChannel[] {
  const raw = process.env.NOTIFICATION_CHANNELS?.trim();
  if (!raw) {
    return ['whatsapp', 'sms', 'log'];
  }

  const parsed = raw
    .split(',')
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean) as NotificationChannel[];

  return parsed.length > 0 ? parsed : ['log'];
}

export function isWhatsAppCloudConfigured(): boolean {
  return Boolean(
    process.env.WHATSAPP_CLOUD_TOKEN?.trim() &&
      process.env.WHATSAPP_PHONE_NUMBER_ID?.trim(),
  );
}

export function isTwilioConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
      process.env.TWILIO_AUTH_TOKEN?.trim() &&
      process.env.TWILIO_SMS_FROM?.trim(),
  );
}

export function getWhatsAppApiVersion(): string {
  return process.env.WHATSAPP_API_VERSION?.trim() || 'v21.0';
}

export function getWhatsAppTemplateName(): string | null {
  const name = process.env.WHATSAPP_TEMPLATE_ORDER_STATUS?.trim();
  return name || null;
}
