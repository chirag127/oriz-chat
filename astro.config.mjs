// @ts-check
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import VitePWA from '@vite-pwa/astro'

export default defineConfig({
  site: 'https://chat.oriz.in',
  output: 'static',
  integrations: [
    react(),
    sitemap(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null,
      includeAssets: ['favicon.svg', 'robots.txt', 'icons/*.svg'],
      manifest: {
        name: 'oriz Chat',
        short_name: 'Chat',
        id: '/',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        lang: 'en',
        dir: 'ltr',
        categories: ['productivity'],
        description:
          'Free multi-turn AI chat in your browser — model picker, markdown, presets, history, export. 100% client-side.',
        background_color: '#070912',
        theme_color: '#070912',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-256.png', sizes: '256x256', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-384.png', sizes: '384x384', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: '/icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
        screenshots: [
          {
            src: '/screenshots/desktop.png',
            sizes: '1280x800',
            type: 'image/png',
            form_factor: 'wide',
            label: 'oriz Chat on desktop',
          },
          {
            src: '/screenshots/mobile.png',
            sizes: '390x844',
            type: 'image/png',
            label: 'oriz Chat on mobile',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{html,css,js,svg,png,ico,txt,webmanifest,woff,woff2}'],
        navigateFallback: '/',
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/([a-z0-9-]+\.)?(pollinations\.ai|deepinfra\.com|puter\.com|g4f\.dev)\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'oriz-chat-ai',
              networkTimeoutSeconds: 20,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
})
