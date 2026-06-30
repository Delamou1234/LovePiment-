const isProd = process.env.NODE_ENV === 'production';

/** En-têtes HTTP de durcissement (boutique e-commerce). */
export const SECURITY_HEADERS: { key: string; value: string }[] = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(self), geolocation=(self), payment=(self)',
  },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  ...(isProd
    ? [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload',
        },
      ]
    : []),
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com",
      "font-src 'self' data:",
      "connect-src 'self' https://api.orange.com https://webpayment.orange-money.com https://webpayment-qualif.orange-money.com https://www.google-analytics.com https://region1.google-analytics.com",
      "frame-src 'self' https://webpayment.orange-money.com https://webpayment-qualif.orange-money.com",
      "form-action 'self' https://webpayment.orange-money.com https://webpayment-qualif.orange-money.com",
      "base-uri 'self'",
      "worker-src 'self'",
      "frame-ancestors 'none'",
    ].join('; '),
  },
];
