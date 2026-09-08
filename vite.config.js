import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/Clash-of-Clans-Exp-Simulator/',
  plugins: [
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'CoC XP Farming Simulator',
        short_name: 'CoC XP Sim',
        description: 'Calculate how long it takes to reach your target XP level in Clash of Clans.',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#0a0c14',
        theme_color: '#FFD700',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts' }
          },
          {
            urlPattern: /^https:\/\/cdnjs\.cloudflare\.com\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'cdnjs' }
          }
        ]
      }
    })
  ]
});
