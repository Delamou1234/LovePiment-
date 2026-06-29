import { buildOrderConfirmationEmail } from '@/modules/commandes/email/order-confirmation.template';
import { storeSettingsService } from '@/modules/admin/services/store-settings.service';
import { sendEmail } from '@/shared/lib/email/mailer';

export async function envoyerEmailConfirmationClient(order: {
  id: string;
  clientNom: string;
  clientEmail?: string | null;
  clientAdresse: string;
  clientVille: string;
  clientCommune?: string | null;
  creneauLivraison?: string | null;
  montantTotal: unknown;
  modePaiement: string;
  suiviToken: string;
  estPremiereCommande?: boolean;
  customer?: { email: string } | null;
}) {
  const to = order.clientEmail ?? order.customer?.email;
  if (!to?.includes('@')) return false;

  const livraison = await storeSettingsService.getLivraisonConfig();
  const { subject, html, text } = buildOrderConfirmationEmail({
    clientNom: order.clientNom,
    orderId: order.id,
    montantTotal: Number(order.montantTotal),
    modePaiement: order.modePaiement,
    clientAdresse: order.clientAdresse,
    clientVille: order.clientVille,
    clientCommune: order.clientCommune,
    creneauLivraison: order.creneauLivraison,
    suiviToken: order.suiviToken,
    delaiLabel: livraison.delaiLabel,
    estPremiereCommande: order.estPremiereCommande,
  });

  try {
    await sendEmail({ to, subject, html, text });
    return true;
  } catch (err) {
    console.warn('[OrderClientEmail] Non envoyé:', err);
    return false;
  }
}
