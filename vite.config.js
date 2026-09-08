import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // Habilita el service worker también con `npm run dev`, para poder
      // probar el modo offline sin tener que hacer build + preview.
      devOptions: { enabled: true },
      manifest: {
        name: 'SRM Telsa Transformadores',
        short_name: 'SRM Telsa',
        description: 'Sistema de gestión de Sanremo de México — ventas, compras, producción, almacén y transformadores.',
        lang: 'es-MX',
        theme_color: '#0f3d27',
        background_color: '#0f3d27',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precachea el shell de la app (JS/CSS/HTML/íconos) para que abra
        // sin conexión. Los datos en sí (Firestore) ya se cachean solos
        // via persistentLocalCache en src/lib/firebase.js — aquí no se
        // intercepta esa red, solo los estáticos de la app.
        globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            // Fuentes de Google Fonts: cache-first, sobreviven sin red.
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
})
