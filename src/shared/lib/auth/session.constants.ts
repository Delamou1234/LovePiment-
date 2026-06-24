/** Constantes session — sans dépendance Node (compatible Edge middleware). */

/** Ancien cookie unique (lecture seule, migration automatique). */
export const LEGACY_SESSION_COOKIE = 'lovepiment_session';

export const CUSTOMER_SESSION_COOKIE = 'lovepiment_customer_session';
export const ADMIN_SESSION_COOKIE = 'lovepiment_admin_session';
export const COURIER_SESSION_COOKIE = 'lovepiment_courier_session';

/** @deprecated Préférer CUSTOMER_SESSION_COOKIE / ADMIN_SESSION_COOKIE */
export const SESSION_COOKIE = LEGACY_SESSION_COOKIE;

/** Durée de vie maximale : 30 jours */
export const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 30;

/** Renouveler si moins de 7 jours restants (session glissante). */
export const SESSION_REFRESH_THRESHOLD_SEC = 60 * 60 * 24 * 7;

export const ALL_SESSION_COOKIES = [
  CUSTOMER_SESSION_COOKIE,
  ADMIN_SESSION_COOKIE,
  COURIER_SESSION_COOKIE,
  LEGACY_SESSION_COOKIE,
] as const;
