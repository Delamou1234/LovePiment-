/** Normalise un numéro guinéen vers le format international sans « + » (ex. 224620000000). */
export function normaliserTelephoneGuinee(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;

  if (digits.startsWith('224')) {
    return digits.length >= 12 ? digits.slice(0, 12) : null;
  }

  if (digits.length === 9) {
    return `224${digits}`;
  }

  if (digits.length === 10 && digits.startsWith('0')) {
    return `224${digits.slice(1)}`;
  }

  if (digits.length >= 9 && digits.length <= 11) {
    return `224${digits.slice(-9)}`;
  }

  return null;
}

/** Format E.164 avec « + » pour Twilio. */
export function formatE164(phoneInternational: string): string {
  return phoneInternational.startsWith('+') ? phoneInternational : `+${phoneInternational}`;
}
