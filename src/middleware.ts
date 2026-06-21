import { authMiddleware } from '@/shared/lib/auth/middleware';

export function middleware(request: import('next/server').NextRequest) {
  return authMiddleware(request);
}

export const config = {
  matcher: ['/commande', '/commande/:path*', '/connexion', '/inscription'],
};
