/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // experimental: {
  //   forceSwcTransforms: true,
  // },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=self, microphone=self, geolocation=none'
          }
        ]
      }
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/socket',
        destination: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'
      }
    ];
  },
  webpack: (config, { dev, isServer }) => {
    // Optimize build
    if (!dev && !isServer) {
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        'simple-peer': {
          test: /[\\/]node_modules[\\/](simple-peer)[\\/]/,
          name: 'simple-peer',
          priority: 10,
          chunks: 'all'
        }
      };
    }
    return config;
  }
};

export default nextConfig;
