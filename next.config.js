/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['hadona.id', 'qcscanner.hadona.id'],
    unoptimized: false
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb'
    }
  },
  output: 'standalone',
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
              "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
              "img-src 'self' data: https: blob: https://*.supabase.co https://qcscanner.hadona.id https://hadona.id https://*.hadona.id https://*.vercel.app https://cdn.jsdelivr.net",
              "font-src 'self' https://cdn.jsdelivr.net data:",
              "connect-src 'self' https://*.supabase.co https://supabase.co https://qcscanner.hadona.id https://hadona.id https://*.hadona.id https://*.vercel.app wss://*.supabase.co wss://supabase.co",
              "frame-src 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests"
            ].join('; ')
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig
