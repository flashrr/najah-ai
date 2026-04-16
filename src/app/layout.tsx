import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Najah AI — Learn Smarter',
  description: 'Personalized AI-powered learning platform for Moroccan 3ème collège students.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
