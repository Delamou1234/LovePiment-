import { getAppUrl } from '@/shared/lib/app-url';
import { getContactEmail, getAdminEmail } from '@/shared/lib/email/env';
import { sendEmail } from '@/shared/lib/email/mailer';

export async function notifierAdminNouvelleCommande(order: {
  id: string;
  clientNom: string;
  clientTelephone: string;
  clientAdresse: string;
  clientVille: string;
  clientCommune?: string | null;
  montantTotal: unknown;
  modePaiement: string;
  estPremiereCommande?: boolean;
}) {
  const to = getContactEmail() ?? getAdminEmail();
  if (!to) return;

  const baseUrl = getAppUrl();
  const montant = Number(order.montantTotal).toLocaleString('fr-FR');
  const subject = `Nouvelle commande Love Piment& — ${order.clientNom}`;
  const html = `
    <p>Une nouvelle commande vient d'être passée.</p>
    <ul>
      <li><strong>Client :</strong> ${order.clientNom}</li>
      <li><strong>Téléphone :</strong> ${order.clientTelephone}</li>
      <li><strong>Adresse :</strong> ${order.clientAdresse}${order.clientCommune ? `, ${order.clientCommune}` : ''}, ${order.clientVille}</li>
      <li><strong>Montant :</strong> ${montant} GN</li>
      <li><strong>Paiement :</strong> ${order.modePaiement}</li>
      ${order.estPremiereCommande ? '<li><strong>🎁 Première commande client</strong></li>' : ''}
    </ul>
    <p><a href="${baseUrl}/admin/commandes">Affecter un livreur →</a></p>
  `;
  const text = [
    'Nouvelle commande Love Piment&',
    `Client : ${order.clientNom}`,
    `Tél : ${order.clientTelephone}`,
    `Adresse : ${order.clientAdresse}, ${order.clientVille}`,
    `Montant : ${montant} GN`,
    `${baseUrl}/admin/commandes`,
  ].join('\n');

  try {
    await sendEmail({ to, subject, html, text });
  } catch (err) {
    console.warn('[AdminOrderAlert] E-mail non envoyé:', err);
  }
}
