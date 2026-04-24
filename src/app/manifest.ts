import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Najah AI — Learn Smarter',
    short_name: 'Najah AI',
    description: 'Personalized AI learning for Moroccan 3ème collège students',
    start_url: '/student/dashboard',
    display: 'standalone',
    background_color: '#f9fafb',
    theme_color: '#4f46e5',
    orientation: 'portrait-primary',
    categories: ['education'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-192-maskable.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
