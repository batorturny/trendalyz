import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Trendalyz — Social Media Analytics',
    short_name: 'Trendalyz',
    description: 'Multi-platform social media riport és analitika dashboard',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#1a1a1e',
    theme_color: '#1a1a1e',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
