import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/shared/lib/auth/session';

/** POST /api/auth/logout */
export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}
