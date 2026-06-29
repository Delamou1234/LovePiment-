import { NextResponse } from 'next/server';
import { trackingService } from '@/modules/livraison/services/tracking.service';
import { adminUnauthorized, requireAdmin } from '@/modules/admin/lib/require-admin';

/** GET /api/admin/notifications — avis clients + prises en charge livreur */
export async function GET() {
  const user = await requireAdmin();
  if (!user) return adminUnauthorized();

  const notifications = await trackingService.listerNotificationsAdmin(20);
  return NextResponse.json({ notifications });
}
