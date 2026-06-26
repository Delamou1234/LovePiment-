import { prisma } from '@/shared/lib/prisma';
import { reviewService } from '@/modules/commandes/services/review.service';

/** Nombre affiché sur le badge hero (commandes livrées + avis satisfaits). */
export async function obtenirClientesSatisfaitesHero(): Promise<number> {
  const [commandesLivrees, avisSatisfaits] = await Promise.all([
    prisma.order.count({ where: { statut: 'LIVREE' } }),
    reviewService.compterAvisSatisfaits(),
  ]);

  return Math.max(commandesLivrees, avisSatisfaits);
}

/** Ex. 1247 → « +1200 », 87 → « +87 » */
export function formaterBadgeClientesHero(count: number): string {
  const valeur = Math.max(0, count);
  if (valeur === 0) return '+1000';
  if (valeur >= 1000) return `+${Math.floor(valeur / 100) * 100}`;
  if (valeur >= 100) return `+${Math.floor(valeur / 10) * 10}`;
  return `+${valeur}`;
}
