/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['hadona.id'],
    unoptimized: false
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb'
    }
  },
  output: 'standalone'
}

module.exports = nextConfig
