/** Contact boutique — appels, WhatsApp, e-mail */

const WHATSAPP_RAW = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() || '224629403019';

const PHONE_DISPLAY =
  process.env.NEXT_PUBLIC_CONTACT_PHONE?.trim() || '+224 629 40 30 19';

export const SHOP_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || 'samakedelamou858@gmail.com';

export function normaliserNumeroAppel(numero: string): string {
  return numero.replace(/[\s\-().]/g, '').replace(/^\+/, '');
}

export function getShopWhatsAppDigits(): string {
  return normaliserNumeroAppel(WHATSAPP_RAW);
}

export function getShopPhoneDisplay(): string {
  return PHONE_DISPLAY;
}

export function getShopPhoneDigits(): string {
  const fromEnv = process.env.NEXT_PUBLIC_CONTACT_PHONE?.trim();
  if (fromEnv) return normaliserNumeroAppel(fromEnv);
  return getShopWhatsAppDigits();
}

/** Lien `tel:` pour lancer un appel depuis mobile ou ordinateur */
export function getShopTelHref(numero?: string): string {
  const digits = normaliserNumeroAppel(numero ?? getShopPhoneDigits());
  return digits ? `tel:+${digits}` : '#';
}

export function getShopWhatsAppHref(message?: string): string {
  const num = getShopWhatsAppDigits();
  const base = `https://wa.me/${num}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
