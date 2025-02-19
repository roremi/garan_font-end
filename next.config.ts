// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost','https://localhost:5001','img.vietqr.io'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://localhost:5001/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
