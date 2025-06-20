import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Optimize for iframe embedding and performance
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'ALLOWALL',
        },
        {
          key: 'Content-Security-Policy',
          value: 'frame-ancestors *;',
        },
        {
          key: 'Access-Control-Allow-Origin',
          value: '*',
        },
        {
          key: 'Access-Control-Allow-Methods',
          value: 'GET, POST, OPTIONS, PUT, DELETE',
        },
        {
          key: 'Access-Control-Allow-Headers',
          value: 'Content-Type, Authorization, X-Requested-With',
        },
      ],
    },
    {
      source: '/api/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'no-cache, no-store, must-revalidate',
        },
      ],
    },
    {
      source: '/_next/static/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ],
  
  // Enable compression
  compress: true,
  
  // Optimize images
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['react-hot-toast', 'clsx'],
  },
  
  // Bundle analyzer for production builds
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config: any) => {
      config.plugins.push(
        new (require('@next/bundle-analyzer'))({
          enabled: true,
        })
      );
      return config;
    },
  }),
};

export default nextConfig;
