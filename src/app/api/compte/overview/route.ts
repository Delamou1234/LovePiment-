import { NextResponse } from 'next/server';
import { customerAuthRepository } from '@/modules/auth/repository/customer-auth.repository';
import { customerProfileService } from '@/modules/compte/services/customer-profile.service';
import { customerDashboardService } from '@/modules/compte/services/customer-dashboard.service';
import { serialiserWishlistItems } from '@/modules/compte/lib/serialize-wishlist';
import { avisService } from '@/modules/avis/services/review.service';
import { getCustomerSessionWithCourierFallback } from '@/shared/lib/auth/customer-from-courier';
import { assurerSessionLivreurPourClient } from '@/modules/livraison/services/courier-customer.service';
import { cachePrivate } from '@/shared/lib/http-cache';

/** GET /api/compte/overview — profil + commandes + favoris + adresses + avis (1 requête). */
export async function GET() {
  const session = await getCustomerSessionWithCourierFallback();
  if (!session?.id) {
    return NextResponse.json({ message: 'Connexion requise' }, { status: 401 });
  }

  const [profil, commandes, wishlistRows, adresses, eligibles] = await Promise.all([
    customerProfileService.obtenirProfil(session.id),
    customerProfileService.listerCommandes(session.id),
    customerAuthRepository.listerWishlist(session.id),
    customerAuthRepository.listerAdresses(session.id),
    avisService.listerEligibles(session.id),
  ]);

  if (!profil) {
    return NextResponse.json({ message: 'Compte introuvable' }, { status: 401 });
  }

  const wishlist = serialiserWishlistItems(wishlistRows);

  const dashboard = await customerDashboardService.obtenirTableauDeBord(
    session.id,
    wishlist.length,
    eligibles.length,
  );

  const livreur = await assurerSessionLivreurPourClient(session.id);

  return NextResponse.json(
    {
      profil,
      commandes,
      wishlist,
      adresses: adresses.map((a) => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
      })),
      avisEligibles: eligibles,
      dashboard,
      livreur,
    },
    { headers: cachePrivate(0) },
  );
}
