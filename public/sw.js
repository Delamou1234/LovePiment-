/* Love Piment& — Service Worker (PWA client, mode hors ligne partiel) */
const CACHE_VERSION = 'lovepiment-pwa-v4';
const CACHE_NAME = `lovepiment-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  '/offline',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png',
];

function isSkippablePath(pathname) {
  return (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/livreur')
  );
}

/** Fichiers statiques Next.js (CSS, JS, polices) — priorité cache pour l'affichage hors ligne. */
function isNextStaticAsset(pathname) {
  return pathname.startsWith('/_next/static/') || pathname.startsWith('/_next/image');
}

function isStaticAsset(pathname) {
  return (
    pathname.startsWith('/icons/') ||
    /\.(?:css|js|mjs|png|svg|webp|ico|woff2?|ttf|otf)$/i.test(pathname)
  );
}

function isRscRequest(request) {
  const accept = request.headers.get('accept') ?? '';
  return accept.includes('text/x-component') || accept.includes('application/vnd.nextjs.rsc');
}

/** Extrait les URL CSS/JS/polices référencées dans le HTML (pages Next.js). */
function extractAssetUrlsFromHtml(html, baseOrigin) {
  const urls = new Set();
  const patterns = [
    /<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["']/gi,
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']stylesheet["']/gi,
    /<link[^>]+rel=["']preload["'][^>]+as=["']style["'][^>]+href=["']([^"']+)["']/gi,
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']preload["'][^>]+as=["']style["']/gi,
    /<script[^>]+src=["']([^"']+)["']/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const href = match[1];
      if (!href || href.startsWith('data:')) continue;
      try {
        const absolute = new URL(href, baseOrigin);
        if (absolute.origin === baseOrigin) {
          urls.add(absolute.pathname + absolute.search);
        }
      } catch {
        /* ignore invalid URL */
      }
    }
  }

  return [...urls];
}

async function precacheUrls(cache, urls) {
  await Promise.allSettled(
    urls.map(async (url) => {
      const request = new Request(url, { method: 'GET' });
      const existing = await cache.match(request);
      if (existing) return;
      const response = await fetch(request);
      if (response.ok) {
        await cache.put(request, response);
      }
    }),
  );
}

async function precacheLinkedAssetsFromHtml(html, baseOrigin) {
  const urls = extractAssetUrlsFromHtml(html, baseOrigin);
  const staticUrls = urls.filter(
    (url) =>
      url.includes('/_next/static/') ||
      /\.css(?:\?|$)/i.test(url) ||
      /\.(?:woff2?|ttf|otf)(?:\?|$)/i.test(url),
  );
  if (staticUrls.length === 0) return;
  const cache = await caches.open(CACHE_NAME);
  await precacheUrls(cache, staticUrls);
}

async function cachePut(cache, request, response) {
  if (response.ok) {
    await cache.put(request, response.clone());
  }
  return response;
}

async function networkFirstNavigation(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    await cachePut(cache, request, response);

    const contentType = response.headers.get('content-type') ?? '';
    if (response.ok && contentType.includes('text/html')) {
      const html = await response.clone().text();
      void precacheLinkedAssetsFromHtml(html, self.location.origin);
    }

    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    const offline = await cache.match('/offline');
    if (offline) return offline;
    return new Response('Hors ligne', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}

async function cacheFirstAsset(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    return cachePut(cache, request, response);
  } catch {
    return new Response('', { status: 504, statusText: 'Hors ligne' });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => cachePut(cache, request, response))
    .catch(() => null);
  return cached || network || new Response('', { status: 504, statusText: 'Hors ligne' });
}

async function precacheShellPages(cache) {
  await Promise.allSettled(
    PRECACHE_URLS.map(async (url) => {
      try {
        const response = await fetch(url);
        if (!response.ok) return;
        await cache.put(url, response.clone());
        const contentType = response.headers.get('content-type') ?? '';
        if (contentType.includes('text/html')) {
          const html = await response.text();
          await precacheLinkedAssetsFromHtml(html, self.location.origin);
        }
      } catch {
        /* hors ligne ou serveur indisponible à l'installation */
      }
    }),
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await precacheShellPages(cache);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (isSkippablePath(url.pathname)) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  /* CSS, JS, polices Next.js : cache d'abord pour rester stylé hors ligne */
  if (isNextStaticAsset(url.pathname) || isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirstAsset(request));
    return;
  }

  if (isRscRequest(request) || url.pathname.startsWith('/_next/')) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
