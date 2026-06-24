import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminSearchService } from '@/modules/admin/services/admin-search.service';
import { adminUnauthorized, requireAdmin } from '@/modules/admin/lib/require-admin';

const schema = z.object({
  q: z.string().trim().min(2, 'Minimum 2 caractères').max(80),
});

/** GET /api/admin/recherche?q= — recherche rapide commandes, clients, produits */
export async function GET(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) return adminUnauthorized();

  const q = request.nextUrl.searchParams.get('q') ?? '';
  const validation = schema.safeParse({ q });

  if (!validation.success) {
    return NextResponse.json(
      { commandes: [], clients: [], produits: [], query: q.trim(), tookMs: 0 },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  }

  const results = await adminSearchService.rechercher(validation.data.q);

  return NextResponse.json(results, {
    headers: { 'Cache-Control': 'private, max-age=5' },
  });
}
