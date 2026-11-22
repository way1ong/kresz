import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'
import pkg from './package.json' with { type: 'json' }

// BASE_PATH задає GitHub Actions (для GitHub Pages це "/<назва-репо>/").
// Локально застосунок працює з кореня "/".
const base = normalizeBase(process.env.BASE_PATH)

function normalizeBase(value: string | undefined): string {
  if (!value || value === '/') return '/'
  return `/${value.replace(/^\/+|\/+$/g, '')}/`
}

export default defineConfig({
  base,
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  // Увесь контент навмисно лежить в одному бандлі: він однаково кешується цілком для офлайну.
  build: { chunkSizeWarningLimit: 2000 },
  plugins: [
    react(),
    VitePWA({
      // Нову версію користувач вмикає сам кнопкою «Оновити» (див. PwaToast).
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'KRESZ B – HU/UA tréner',
        short_name: 'KRESZ B',
        description: 'Felkészülés a B kategóriás KRESZ-vizsgára – offline, magyarul és ukránul.',
        lang: 'hu',
        // Відносні шляхи: маніфест працює під будь-яким base path.
        start_url: '.',
        scope: '.',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f4f6fa',
        theme_color: '#1f4fbf',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Увесь застосунок (разом із питаннями в JS-бандлі) кешується наперед → повний офлайн.
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        cleanupOutdatedCaches: true,
        navigateFallback: 'index.html',
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
