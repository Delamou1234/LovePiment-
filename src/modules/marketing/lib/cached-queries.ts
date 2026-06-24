import { unstable_cache } from 'next/cache';
import { newsletterService } from '@/modules/marketing/services/newsletter.service';

/** Configuration bannière newsletter — cache 120 s. */
export const getCachedNewsletterConfig = unstable_cache(
  () => newsletterService.getPublicConfig(),
  ['newsletter-config'],
  { revalidate: 120, tags: ['newsletter'] },
);
