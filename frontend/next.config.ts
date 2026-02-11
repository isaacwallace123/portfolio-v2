import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  experimental: {
    optimizePackageImports: ['lucide-react', '@tiptap/react'],
  },

  // Rewrite legacy /icons/* paths to the uploads API route
  async rewrites() {
    return [
      {
        source: '/icons/:path*',
        destination: '/api/uploads/icons/:path*',
      },
    ];
  },
};

export default withNextIntl(nextConfig);
