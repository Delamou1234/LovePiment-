import {
  DESCRIPTIONS_STATUT,
  LIBELLES_STATUT,
} from '@/shared/lib/delivery-tracking';
import { getAppUrl } from '@/shared/lib/app-url';
import type { OrderNotificationContext } from '../types';

function prenom(nom: string): string {
  return nom.trim().split(/\s+/)[0] || 'Client';
}

function lienSuivi(suiviToken: string): string {
  return `${getAppUrl()}/suivi?token=${suiviToken}`;
}

function formatMontant(montant: number): string {
  return `${montant.toLocaleString('fr-FR')} GN`;
}

export function messageCommandeCreee(ctx: OrderNotificationContext): string {
  const paiement =
    ctx.modePaiement === 'CINETPAY'
      ? 'Paiement en ligne en cours — vous serez notifié(e) dès confirmation.'
      : 'Paiement à la livraison à Conakry.';

  return [
    `Bonjour ${prenom(ctx.clientNom)},`,
    '',
    'Votre commande Love Piment& est bien enregistrée.',
    'Notre équipe prend votre dossier en charge et vous tiendra informée à chaque étape.',
    '',
    `Montant : ${formatMontant(ctx.montantTotal)}`,
    `Livraison : ${ctx.clientVille}`,
    paiement,
    '',
    'Suivez votre commande :',
    lienSuivi(ctx.suiviToken),
    '',
    'Love Piment& · Conakry',
  ].join('\n');
}

export function messageChangementStatut(ctx: OrderNotificationContext): string {
  const libelle = LIBELLES_STATUT[ctx.statut];
  const description = DESCRIPTIONS_STATUT[ctx.statut];
  const detail = ctx.statutMessage?.trim();

  const lines = [
    `Bonjour ${prenom(ctx.clientNom)},`,
    '',
    `Mise à jour de votre commande Love Piment&`,
    `Statut : ${libelle}`,
    description,
  ];

  if (detail && !detail.startsWith('Notification client')) {
    lines.push(detail);
  }

  if (ctx.carrierNom) {
    lines.push(`Transporteur : ${ctx.carrierNom}`);
  }

  if (ctx.numeroSuivi) {
    lines.push(`N° suivi : ${ctx.numeroSuivi}`);
  }

  lines.push('', `Suivi en direct :`, lienSuivi(ctx.suiviToken), '', 'Merci pour votre confiance !');

  return lines.join('\n');
}

export function messagePaiementConfirme(ctx: OrderNotificationContext): string {
  return [
    `Bonjour ${prenom(ctx.clientNom)},`,
    '',
    'Votre paiement Love Piment& est confirmé.',
    `Montant : ${formatMontant(ctx.montantTotal)}`,
    'Nous préparons votre colis.',
    '',
    lienSuivi(ctx.suiviToken),
    '',
    'Love Piment& · Conakry',
  ].join('\n');
}
