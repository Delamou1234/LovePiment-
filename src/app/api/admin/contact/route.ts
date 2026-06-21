import { NextResponse } from 'next/server';
import { contactService } from '@/modules/contact/services/contact.service';
import { adminUnauthorized, requireAdmin } from '@/modules/admin/lib/require-admin';

/** GET /api/admin/contact */
export async function GET() {
  const user = await requireAdmin();
  if (!user) return adminUnauthorized();

  const [messages, nonLus] = await Promise.all([
    contactService.listerMessages(),
    contactService.compterNonLus(),
  ]);

  return NextResponse.json({ messages, nonLus });
}
