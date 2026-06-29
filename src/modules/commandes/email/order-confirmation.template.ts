import { getAppUrl } from '@/shared/lib/app-url';

export type OrderConfirmationEmailData = {
  clientNom: string;
  orderId: string;
  montantTotal: number;
  modePaiement: string;
  clientAdresse: string;
  clientVille: string;
  clientCommune?: string | null;
  creneauLivraison?: string | null;
  suiviToken: string;
  delaiLabel?: string | null;
  estPremiereCommande?: boolean;
};

const CRENEAU_LABELS: Record<string, string> = {
  MATIN: 'Matin (9h – 13h)',
  APRES_MIDI: 'Après-midi (14h – 19h)',
  FLEXIBLE: 'Créneau flexible',
};

export function buildOrderConfirmationEmail(data: OrderConfirmationEmailData) {
  const baseUrl = getAppUrl();
  const suiviUrl = `${baseUrl}/suivi/${data.suiviToken}`;
  const montant = data.montantTotal.toLocaleString('fr-FR');
  const paiement =
    data.modePaiement === 'PAIEMENT_LIVRAISON'
      ? 'Paiement en espèces à la livraison'
      : 'Paiement Mobile Money (CinetPay)';
  const creneau = data.creneauLivraison
    ? CRENEAU_LABELS[data.creneauLivraison] ?? data.creneauLivraison
    : null;
  const adresseLigne = [data.clientAdresse, data.clientCommune, data.clientVille]
    .filter(Boolean)
    .join(', ');

  const subject = `Commande confirmée — Love Piment& (${montant} GN)`;

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><title>${subject}</title></head>
<body style="font-family:Georgia,serif;background:#fdf8f4;color:#1a1a1a;margin:0;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;padding:32px;border:1px solid #f0e6dc">
    <p style="color:#9B1B2E;font-weight:bold;font-size:12px;letter-spacing:0.08em;text-transform:uppercase">Love Piment&</p>
    <h1 style="font-size:22px;margin:8px 0 16px">Merci ${data.clientNom} !</h1>
    <p style="line-height:1.6;color:#444">Votre commande est bien enregistrée. Notre équipe la prépare avec soin.</p>
    ${
      data.estPremiereCommande
        ? '<p style="background:#f5f0e8;border-radius:12px;padding:12px 16px;color:#5c4a32;font-size:14px">🎁 <strong>Première commande</strong> — merci de nous faire confiance ! Nous suivons votre colis de près.</p>'
        : ''
    }
    <table style="width:100%;margin:20px 0;font-size:14px;border-collapse:collapse">
      <tr><td style="padding:6px 0;color:#888">Référence</td><td style="text-align:right;font-weight:bold">#${data.orderId.slice(0, 8).toUpperCase()}</td></tr>
      <tr><td style="padding:6px 0;color:#888">Montant</td><td style="text-align:right;font-weight:bold">${montant} GN</td></tr>
      <tr><td style="padding:6px 0;color:#888">Paiement</td><td style="text-align:right">${paiement}</td></tr>
      <tr><td style="padding:6px 0;color:#888">Livraison</td><td style="text-align:right">${adresseLigne}</td></tr>
      ${creneau ? `<tr><td style="padding:6px 0;color:#888">Créneau</td><td style="text-align:right">${creneau}</td></tr>` : ''}
      <tr><td style="padding:6px 0;color:#888">Délai estimé</td><td style="text-align:right">${data.delaiLabel ?? '24–48 h'}</td></tr>
    </table>
    ${
      data.modePaiement === 'PAIEMENT_LIVRAISON'
        ? `<p style="background:#fff8e6;border-radius:12px;padding:12px 16px;font-size:13px;color:#7a5c00">💵 Préparez <strong>${montant} GN</strong> en espèces pour le livreur.</p>`
        : ''
    }
    <p style="text-align:center;margin:28px 0">
      <a href="${suiviUrl}" style="display:inline-block;background:#9B1B2E;color:#fff;text-decoration:none;padding:14px 28px;border-radius:999px;font-weight:bold;font-size:14px">Suivre ma commande</a>
    </p>
    <p style="font-size:12px;color:#888;line-height:1.5;text-align:center">Une question ? Répondez à cet e-mail ou contactez-nous sur WhatsApp depuis le site.</p>
  </div>
</body>
</html>`;

  const text = [
    `Merci ${data.clientNom} !`,
    `Commande #${data.orderId.slice(0, 8).toUpperCase()} — ${montant} GN`,
    `Paiement : ${paiement}`,
    `Adresse : ${adresseLigne}`,
    creneau ? `Créneau : ${creneau}` : '',
    `Suivi : ${suiviUrl}`,
  ]
    .filter(Boolean)
    .join('\n');

  return { subject, html, text };
}
