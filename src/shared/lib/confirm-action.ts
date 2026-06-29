export type ActionConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
};

type ConfirmHandler = (options: ActionConfirmOptions) => Promise<boolean>;

let confirmHandler: ConfirmHandler | null = null;

export function registerConfirmAction(handler: ConfirmHandler | null) {
  confirmHandler = handler;
}

export async function confirmAction(options: ActionConfirmOptions): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (confirmHandler) return confirmHandler(options);
  return window.confirm(`${options.title}\n\n${options.message}`);
}

export function confirmPanierVider(): Promise<boolean> {
  return confirmAction({
    title: 'Vider le panier ?',
    message: 'Tous les articles seront retirés de votre panier sur cet appareil.',
    confirmLabel: 'Vider le panier',
    cancelLabel: 'Annuler',
    variant: 'danger',
  });
}

export function confirmPanierRetirer(nomProduit: string): Promise<boolean> {
  return confirmAction({
    title: 'Retirer cet article ?',
    message: `« ${nomProduit} » sera supprimé de votre panier.`,
    confirmLabel: 'Retirer',
    cancelLabel: 'Garder',
    variant: 'danger',
  });
}

export function confirmDeliveryCopy(
  clientNom: string,
  paiementEspeces?: boolean,
): ActionConfirmOptions {
  if (paiementEspeces === true) {
    return {
      title: 'Confirmer la livraison',
      message: `Le client ${clientNom} a payé en espèces. Confirmez-vous que le colis a bien été remis ?`,
      confirmLabel: 'Oui, colis livré',
    };
  }
  if (paiementEspeces === false) {
    return {
      title: 'Signaler livraison sans paiement',
      message: `Confirmez-vous que le colis a été remis à ${clientNom} sans encaissement espèces ? L'administration sera notifiée.`,
      confirmLabel: 'Confirmer',
      variant: 'danger',
    };
  }
  return {
    title: 'Confirmer la livraison',
    message: `Confirmez-vous que le colis a bien été remis à ${clientNom} ?`,
    confirmLabel: 'Oui, colis livré',
  };
}

export function confirmPickupCopy(clientNom: string): ActionConfirmOptions {
  return {
    title: 'Colis récupéré ?',
    message: `Confirmez que vous avez bien récupéré le colis de ${clientNom} avant de partir en livraison.`,
    confirmLabel: 'Oui, c\'est bon',
    cancelLabel: 'Pas encore',
  };
}
