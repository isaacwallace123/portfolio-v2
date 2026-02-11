/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  telemetry: {
    enabled: false,
  },

  swcMinify: true,

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

module.exports = nextConfig;