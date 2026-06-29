import { prisma } from '@/shared/lib/prisma';
import { COMMUNES_CONAKRY_REFERENCE } from '@/shared/lib/communes-conakry';

export class ReferenceDataService {
  /** Union des communes de référence + communes livreurs + villes clients (commandes). */
  async listCommunes(): Promise<string[]> {
    const [courierRows, orderRows] = await Promise.all([
      prisma.courier.findMany({
        where: { commune: { not: null } },
        select: { commune: true },
        distinct: ['commune'],
      }),
      prisma.order.findMany({
        select: { clientVille: true },
        distinct: ['clientVille'],
      }),
    ]);

    const set = new Set<string>(COMMUNES_CONAKRY_REFERENCE);
    for (const row of courierRows) {
      const v = row.commune?.trim();
      if (v) set.add(v);
    }
    for (const row of orderRows) {
      const v = row.clientVille?.trim();
      if (v) set.add(v);
    }

    const sorted = Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'));
    if (!sorted.includes('Autre')) sorted.push('Autre');
    return sorted;
  }
}

export const referenceDataService = new ReferenceDataService();
