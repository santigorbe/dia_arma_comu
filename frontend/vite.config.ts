import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false,
      workbox: {
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            // Inlined on purpose: workbox serializes this function into sw.js, so imports are out of scope there.
            // Keep in sync with src/pwa/cachePolicy.ts.
            urlPattern: ({ url, request }) =>
              request.method === 'GET' &&
              ['/api/public/content', '/api/public/schedule', '/api/public/map'].includes(url.pathname),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'public-read-cache',
              expiration: { maxEntries: 30, maxAgeSeconds: 86_400 }
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    allowedHosts: ['comunicaciones.ciber.ea.mil.ar', 'dia-del-arma-de-comunicaciones.flinvent.net', 'dia-web'],
    proxy: {
      '/api': 'http://localhost:3000',
      '/health': 'http://localhost:3000'
    }
  },
  preview: {
    port: 5173,
    proxy: {
      '/api': process.env.API_PROXY_TARGET ?? 'http://localhost:3000',
      '/health': process.env.API_PROXY_TARGET ?? 'http://localhost:3000'
    },
    allowedHosts: ['comunicaciones.ciber.ea.mil.ar', 'dia-del-arma-de-comunicaciones.flinvent.net', 'dia-web']
  },
  test: {
    environment: 'jsdom',
    globals: true
  }
});
