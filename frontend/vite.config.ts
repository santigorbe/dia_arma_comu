import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { shouldCachePublicRead } from './src/pwa/cachePolicy';

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
            urlPattern: ({ url, request }) => shouldCachePublicRead(url, request.method),
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
    proxy: {
      '/api': 'http://localhost:3000',
      '/health': 'http://localhost:3000'
    }
  },
  test: {
    environment: 'jsdom',
    globals: true
  }
});
