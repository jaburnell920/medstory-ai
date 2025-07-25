/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      allowedOrigins: ['*'],
    },
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ];
  },
  webpack(config) {
    return config;
  },
  // Allow server to be accessed from any host
  serverRuntimeConfig: {
    PROJECT_ROOT: __dirname,
  },
  publicRuntimeConfig: {
    staticFolder: '/static',
  },
  // Next.js doesn't use this configuration directly in next.config.js
  // We'll set these values when starting the server
};

module.exports = nextConfig;