export type OrangeMoneyWebhookFields = {
  status?: string;
  notif_token?: string;
  order_id?: string;
  amount?: string | number;
  subscriber_msisdn?: string;
};

function lireChamp(source: Record<string, unknown>, ...cles: string[]): string | undefined {
  for (const cle of cles) {
    const valeur = source[cle];
    if (typeof valeur === 'string' && valeur.trim()) return valeur.trim();
    if (typeof valeur === 'number' && Number.isFinite(valeur)) return String(valeur);
  }
  return undefined;
}

/** Normalise le payload webhook Orange (JSON plat ou imbriqué). */
export function extraireChampsWebhook(payload: unknown): OrangeMoneyWebhookFields | null {
  if (!payload || typeof payload !== 'object') return null;

  const racine = payload as Record<string, unknown>;
  const imbrique =
    racine.data && typeof racine.data === 'object'
      ? (racine.data as Record<string, unknown>)
      : null;

  const sources = [racine, imbrique].filter(Boolean) as Record<string, unknown>[];

  let status: string | undefined;
  let notif_token: string | undefined;
  let order_id: string | undefined;
  let amount: string | number | undefined;
  let subscriber_msisdn: string | undefined;

  for (const source of sources) {
    status ??= lireChamp(source, 'status', 'Status', 'payment_status');
    notif_token ??= lireChamp(source, 'notif_token', 'notifToken', 'notification_token');
    order_id ??= lireChamp(source, 'order_id', 'orderId', 'orderID');
    subscriber_msisdn ??= lireChamp(
      source,
      'subscriber_msisdn',
      'subscriberMsisdn',
      'msisdn',
      'payer_msisdn',
    );
    const montantBrut = source.amount ?? source.Amount ?? source.montant;
    if (amount == null && (typeof montantBrut === 'string' || typeof montantBrut === 'number')) {
      amount = montantBrut;
    }
  }

  return { status, notif_token, order_id, amount, subscriber_msisdn };
}
