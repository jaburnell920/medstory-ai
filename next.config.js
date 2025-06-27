/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    serverActions: true,
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
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
  },
};

module.exports = nextConfig;