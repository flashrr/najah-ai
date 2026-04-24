import type { Metadata, Viewport } from 'next'
import './globals.css'

// ── PWA + mobile viewport ─────────────────────────────────────────────────────
// Export viewport separately — Next.js 14 App Router requires this, it is
// NOT part of the metadata object. Without this, mobile browsers use their
// default viewport (980px wide) and the entire layout will be zoomed out.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  themeColor: '#4f46e5',
}

export const metadata: Metadata = {
  title:       'Najah AI — Learn Smarter',
  description: 'Personalized AI-powered learning platform for Moroccan 3ème collège students.',
  manifest:    '/manifest.webmanifest',
  appleWebApp: {
    capable:           true,
    statusBarStyle:    'default',
    title:             'Najah AI',
  },
  icons: {
    icon:  [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      {/*
        min-h-screen / flex / flex-col live here so the landing page can drop
        its outer <div> wrapper entirely. <header>, <main>, <footer> become
        direct children of <body> — eliminating the <header>-in-<div> tree
        position that was triggering the hydration mismatch.
      */}
      <body className="min-h-screen bg-white flex flex-col">{children}</body>
    </html>
  )
}
