import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://qcscanner.hadona.id'),
  title: 'Scanner QC Landing Page - Hadona',
  description: 'Scan landing page untuk kepatuhan Google Ads. Validasikan landing page Anda terhadap persyaratan Google Ads dengan analisis berbasis AI.',
  keywords: ['Google Ads', 'Landing Page', 'Quality Control', 'Scanner', 'Kepatuhan', 'Kebijakan Iklan', 'Validasi Landing Page', 'Google Ads Policy'],
  authors: [{ name: 'Hadona' }],
  creator: 'Hadona',
  publisher: 'Hadona',
  alternates: {
    canonical: 'https://qcscanner.hadona.id',
  },
  icons: {
    icon: [
      { url: '/icon.png', sizes: '512x512', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' }
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '512x512', type: 'image/png' }
    ],
  },
  openGraph: {
    title: 'Scanner QC Landing Page - Hadona',
    description: 'Scan landing page untuk kepatuhan Google Ads',
    url: 'https://qcscanner.hadona.id',
    siteName: 'QC Scanner',
    images: [{
      url: '/logo/logo-hadona.png',
      width: 512,
      height: 512,
      alt: 'QC Scanner Logo - Hadona',
    }],
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Scanner QC Landing Page - Hadona',
    description: 'Scan landing page untuk kepatuhan Google Ads. Validasikan landing page Anda dengan analisis AI.',
    images: ['/logo/logo-hadona.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add your verification codes here
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.2/font/bootstrap-icons.css" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
