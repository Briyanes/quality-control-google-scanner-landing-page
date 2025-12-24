import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Quality Control Scanner - Hadona',
  description: 'Scan landing pages for Google Ads compliance. Validate your landing pages against Google Ads requirements with AI-powered analysis.',
  keywords: ['Google Ads', 'Landing Page', 'Quality Control', 'Scanner', 'Compliance', 'Ads Policy'],
  icons: {
    icon: '/logo/logo-hadona.png',
    apple: '/logo/logo-hadona.png',
  },
  openGraph: {
    title: 'Quality Control Scanner - Hadona',
    description: 'Scan landing pages for Google Ads compliance',
    url: 'https://qc-scanner.hadona.id',
    siteName: 'QC Scanner',
    images: [{
      url: '/logo/logo-hadona.png',
    }],
    locale: 'id_ID',
    type: 'website',
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
