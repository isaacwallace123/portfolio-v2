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
};

module.exports = nextConfig;