/** Normalise un numéro guinéen (9 chiffres, commence par 6). */
export function normaliserTelephoneGuinee(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  let local = digits;
  if (local.startsWith('224')) local = local.slice(3);
  if (local.length === 9 && /^6\d{8}$/.test(local)) return local;
  return null;
}

/** Format local affiché : 6XX XX XX XX */
export function formaterTelephoneGuinee(raw: string): string {
  const n = normaliserTelephoneGuinee(raw);
  if (!n) return raw.trim();
  return n.replace(/(\d{3})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4');
}

/** MSISDN pour Orange Money (préfixe 224). */
export function msisdnOrangeGuinee(raw: string): string | null {
  const local = normaliserTelephoneGuinee(raw);
  if (!local) return null;
  return `224${local}`;
}

export function validerTelephoneGuinee(raw: string): boolean {
  return normaliserTelephoneGuinee(raw) !== null;
}
