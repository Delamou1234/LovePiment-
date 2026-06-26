import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  images: {
    qualities: [75, 85, 90],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
    ],
  },
  // Next.js 16 build (Vercel) uses Turbopack by default; webpack reste pour `npm run dev`.
  turbopack: {},
  webpack: (config, { dev }) => {
    if (dev) {
      // Limite la pression mémoire du cache webpack en local (Windows / longues sessions dev)
      config.cache = { type: 'memory', maxGenerations: 1 };
    }
    return config;
  },
};

export default nextConfig;
