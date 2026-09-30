import { defineConfig } from 'vitest/config';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const securityHeaders = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://tile.openstreetmap.org",
    "font-src 'self' data:",
    "connect-src 'self' https://tile.openstreetmap.org",
    "worker-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests'
  ].join('; '),
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'geolocation=(), camera=(), microphone=(), payment=()',
  'Cross-Origin-Opener-Policy': 'same-origin'
};

// Hashed build assets are immutable; everything else (index.html, sw.js, manifest) must revalidate.
const cacheControl: Plugin = {
  name: 'cache-control',
  configurePreviewServer(server) {
    server.middlewares.use((req, res, next) => {
      const immutable = req.url?.startsWith('/assets/');
      const original = res.setHeader.bind(res);
      res.setHeader = (name, value) => original(name, name.toLowerCase() === 'cache-control' ? (immutable ? 'public, max-age=31536000, immutable' : 'no-cache') : value);
      next();
    });
  }
};

export default defineConfig({
  plugins: [
    react(),
    cacheControl,
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
    headers: securityHeaders,
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
