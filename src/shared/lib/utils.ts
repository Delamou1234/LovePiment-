import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utilitaire pour combiner des classes Tailwind sans conflit.
 * Utilisé par tous les composants shadcn/ui et composants custom.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formate un prix en francs guinéens (GNF)
 */
export function formatPrix(montant: number | string | { toNumber?: () => number }): string {
  const num = typeof montant === 'object' && montant.toNumber
    ? montant.toNumber()
    : Number(montant);

  return new Intl.NumberFormat('fr-GN', {
    style: 'currency',
    currency: 'GNF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Génère un slug depuis un texte
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Tronque un texte à un nombre de caractères donné
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '…';
}

/**
 * Retourne la première image d'un produit ou un placeholder
 */
export function getProduitImage(images: string[], index = 0): string {
  return images[index] ?? '/images/placeholder-product.jpg';
}

/**
 * Formate une date en français
 */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}
