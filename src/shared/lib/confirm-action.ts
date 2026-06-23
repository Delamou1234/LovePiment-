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
