import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://qcscanner.hadona.id'),
  title: 'Quality Control Scanner - Hadona',
  description: 'Scan landing pages for Google Ads compliance. Validate your landing pages against Google Ads requirements with AI-powered analysis.',
  keywords: ['Google Ads', 'Landing Page', 'Quality Control', 'Scanner', 'Compliance', 'Ads Policy'],
  authors: [{ name: 'Hadona' }],
  creator: 'Hadona',
  publisher: 'Hadona',
  icons: {
    icon: '/logo/logo-hadona.png',
    apple: '/logo/logo-hadona.png',
  },
  openGraph: {
    title: 'Quality Control Scanner - Hadona',
    description: 'Scan landing pages for Google Ads compliance',
    url: 'https://qcscanner.hadona.id',
    siteName: 'QC Scanner',
    images: [{
      url: '/logo/logo-hadona.png',
    }],
    locale: 'id_ID',
    type: 'website',
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
