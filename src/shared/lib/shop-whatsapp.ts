import { getShopWhatsAppHref } from '@/shared/lib/shop-contact';

export function messageWhatsAppCommande(data: {
  orderId?: string;
  clientNom?: string;
  montantTotal?: number;
}): string {
  const parts = ['Bonjour Love Piment&,'];
  if (data.orderId) {
    parts.push(`j’ai une question sur ma commande #${data.orderId.slice(0, 8).toUpperCase()}.`);
  } else {
    parts.push('j’ai une question sur ma commande.');
  }
  if (data.clientNom) parts.push(`(${data.clientNom})`);
  if (data.montantTotal != null) {
    parts.push(`Montant : ${data.montantTotal.toLocaleString('fr-FR')} GN.`);
  }
  return parts.join(' ');
}

export function messageWhatsAppSuivi(data: {
  suiviToken: string;
  clientNom?: string;
}): string {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  return [
    'Bonjour,',
    `je souhaite des informations sur ma livraison.`,
    data.clientNom ? `Client : ${data.clientNom}.` : '',
    base ? `Suivi : ${base}/suivi/${data.suiviToken}` : '',
  ]
    .filter(Boolean)
    .join(' ');
}

export function lienWhatsAppCommande(data: Parameters<typeof messageWhatsAppCommande>[0]) {
  return getShopWhatsAppHref(messageWhatsAppCommande(data));
}

export function lienWhatsAppSuivi(data: Parameters<typeof messageWhatsAppSuivi>[0]) {
  return getShopWhatsAppHref(messageWhatsAppSuivi(data));
}
