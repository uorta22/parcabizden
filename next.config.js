/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['*.replit.dev', '*.sisko.replit.dev'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'parcabizden.com.tr',
      },
      {
        protocol: 'https',
        hostname: 'api.parcabizden.com.tr',
      },
      {
        protocol: 'https',
        hostname: 'www.auto-data.net',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        source: '/data/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, s-maxage=604800' },
        ],
      },
      {
        source: '/brands/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=604800, immutable' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
