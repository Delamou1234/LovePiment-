export type LogoutRole = 'customer' | 'admin' | 'courier';

const TITLES: Record<LogoutRole, string> = {
  customer: 'Se déconnecter ?',
  admin: "Quitter l'espace admin ?",
  courier: "Quitter l'espace livreur ?",
};

const MESSAGES: Record<LogoutRole, string> = {
  customer: 'Vous devrez vous reconnecter pour accéder à votre compte et vos commandes.',
  admin: 'Vous serez redirigé vers la boutique. Vos modifications non enregistrées peuvent être perdues.',
  courier: 'Vous devrez vous reconnecter pour voir vos tournées et livraisons assignées.',
};

type ConfirmHandler = (role: LogoutRole) => Promise<boolean>;

let confirmHandler: ConfirmHandler | null = null;

export function registerConfirmLogout(handler: ConfirmHandler | null) {
  confirmHandler = handler;
}

export function getLogoutDialogCopy(role: LogoutRole) {
  return { title: TITLES[role], message: MESSAGES[role] };
}

export async function confirmLogout(role: LogoutRole = 'customer'): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (confirmHandler) return confirmHandler(role);
  return window.confirm(`${TITLES[role]}\n\n${MESSAGES[role]}`);
}
