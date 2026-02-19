/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
    ],
  },
}

module.exports = nextConfig
