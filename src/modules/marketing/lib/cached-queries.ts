import { unstable_cache } from 'next/cache';
import { aproposService } from '@/modules/marketing/services/apropos.service';
import { newsletterService } from '@/modules/marketing/services/newsletter.service';
import {
  formaterBadgeClientesHero,
  obtenirClientesSatisfaitesHero,
} from '@/modules/marketing/services/home-hero.service';

/** Badge hero accueil — clientes satisfaites (cache 5 min). */
export const getCachedHeroBadge = unstable_cache(
  async () => {
    const count = await obtenirClientesSatisfaitesHero();
    return {
      count,
      label: formaterBadgeClientesHero(count),
    };
  },
  ['home-hero-badge'],
  { revalidate: 300, tags: ['orders', 'reviews', 'home-hero'] },
);

/** Configuration page À propos — cache 120 s. */
export const getCachedAproposConfig = unstable_cache(
  () => aproposService.getPublicConfig(),
  ['apropos-config'],
  { revalidate: 120, tags: ['apropos'] },
);

/** Configuration bannière newsletter — cache 120 s. */
export const getCachedNewsletterConfig = unstable_cache(
  () => newsletterService.getPublicConfig(),
  ['newsletter-config'],
  { revalidate: 120, tags: ['newsletter'] },
);
