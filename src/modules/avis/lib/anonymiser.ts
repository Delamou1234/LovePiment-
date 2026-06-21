/** Anonymise « Mamadou Diallo » → « Mamadou D. » */
export function anonymiserNomClient(nom: string): string {
  const parts = nom.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'Client';
  if (parts.length === 1) return parts[0];
  const initial = parts[parts.length - 1].charAt(0).toUpperCase();
  return `${parts[0]} ${initial}.`;
}
