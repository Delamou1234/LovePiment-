const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const PARRAINAGE_SESSION_KEY = 'kabishop_parrain_pending';

export function genererCodeParrainage(): string {
  let suffix = '';
  for (let i = 0; i < 6; i += 1) {
    suffix += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `KABI${suffix}`;
}

export function normaliserCodeParrainage(code: string): string {
  return code.trim().toUpperCase();
}

export function cheminInscriptionParrainage(code: string): string {
  return `/inscription?parrain=${encodeURIComponent(normaliserCodeParrainage(code))}`;
}
