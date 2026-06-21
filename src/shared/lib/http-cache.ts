/** En-têtes Cache-Control pour réponses publiques (CDN + navigateur). */
export function cachePublic(seconds: number, staleSeconds = seconds * 2) {
  return {
    'Cache-Control': `public, s-maxage=${seconds}, stale-while-revalidate=${staleSeconds}`,
  };
}

export function cachePrivate(seconds: number) {
  return {
    'Cache-Control': `private, max-age=${seconds}`,
  };
}

export function noStore() {
  return {
    'Cache-Control': 'no-store, max-age=0',
  };
}
