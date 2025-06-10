import type { NextConfig } from 'next';

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '1mb', // Example value
      allowedOrigins: ['*'], // Example value
    }, // if you use them
  },
  // ✅ This allows embedding in iframes and prevents headers from blocking it
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'ALLOWALL', // Allow embedding in iframes
        },
        {
          key: 'Access-Control-Allow-Origin',
          value: '*', // Replace with 'https://your-wordpress-domain.com' if needed
        },
        {
          key: 'Access-Control-Allow-Credentials',
          value: 'true',
        },
        {
          key: 'Access-Control-Allow-Headers',
          value: 'Content-Type',
        },
        {
          key: 'Access-Control-Allow-Methods',
          value: 'GET, POST, OPTIONS',
        },
      ],
    },
  ],
};

export default nextConfig;
