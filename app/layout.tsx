import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://qcscanner.hadona.id'),
  title: {
    default: 'QC Scanner - Validasi Landing Page Google Ads',
    template: '%s | QC Scanner',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/icon.png',
  },
  description: 'Scan landing page untuk kepatuhan Google Ads. Validasikan landing page Anda terhadap persyaratan Google Ads dengan analisis berbasis AI yang cepat dan akurat.',
  keywords: [
    'Google Ads',
    'Landing Page',
    'Quality Control',
    'Scanner',
    'Kepatuhan',
    'Kebijakan Iklan',
    'Validasi Landing Page',
    'Google Ads Policy',
    'Hadona',
    'Digital Media',
  ],
  authors: [{ name: 'Hadona Digital Media' }],
  creator: 'Hadona Digital Media',
  publisher: 'Hadona Digital Media',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: 'https://qcscanner.hadona.id',
  },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: 'https://qcscanner.hadona.id',
    siteName: 'qcscanner.hadona.id',
    title: 'QC Scanner - Validasi Landing Page untuk Kepatuhan Google Ads',
    description: 'Scan landing page untuk kepatuhan Google Ads. Validasikan landing page Anda terhadap persyaratan Google Ads dengan analisis berbasis AI.',
    images: [
      {
        url: '/icon.png',
        width: 512,
        height: 512,
        alt: 'QC Scanner - Validasi Kepatuhan Landing Page Google Ads',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'QC Scanner - Validasi Landing Page Google Ads',
    description: 'Scan landing page untuk kepatuhan Google Ads. Validasikan landing page Anda terhadap persyaratan Google Ads dengan analisis berbasis AI.',
    images: ['/icon.png'],
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
    // Add Google Search Console verification if available
    // google: 'your-google-verification-code',
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
