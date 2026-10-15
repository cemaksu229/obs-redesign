import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// base: './' sayesinde uygulama GitHub Pages'in alt klasöründe de çalışır.
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Pusula — Öğrenci Bilgi Sistemi',
        short_name: 'Pusula',
        description: 'Ders programı, ders kaydı, notlar ve mezuniyet durumu tek yerde.',
        lang: 'tr',
        theme_color: '#14306b',
        background_color: '#f5f7fb',
        display: 'standalone',
        start_url: './',
        scope: './',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,woff2}'] },
    }),
  ],
})
