import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      build: {
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (id.includes('node_modules')) {
                if (id.includes('react') || id.includes('react-dom')) return 'react-vendor';
                if (id.includes('firebase')) return 'firebase';
                if (id.includes('lucide-react') || id.includes('framer-motion') || id.includes('recharts') || id.includes('sonner')) return 'ui-vendor';
                if (id.includes('@google/model-viewer')) return 'web-components';
                return 'vendor';
              }
            }
          }
        }
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['favicon.ico', 'ruru-avatar.png.png'],
          manifest: {
            name: 'ZooL Pet Care',
            short_name: 'ZooL',
            description: 'Your AI-powered veterinary companion & booking navigator.',
            theme_color: '#0B192C',
            background_color: '#F5F5F0',
            display: 'standalone',
            orientation: 'portrait-primary',
            icons: [
              {
                src: '/ruru-avatar.png.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any maskable'
              },
              {
                src: '/ruru-avatar.png.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any maskable'
              }
            ]
          },
          workbox: {
            maximumFileSizeToCacheInBytes: 15000000, // 15MB
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/[a-c]\.tile\.openstreetmap\.org\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'osm-tiles-cache',
                  expiration: {
                    maxEntries: 500,
                    maxAgeSeconds: 30 * 24 * 60 * 60 // 30 Days
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              },
              {
                urlPattern: /^https:\/\/cdnjs\.cloudflare\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'leaflet-assets',
                  expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 30 * 24 * 60 * 60 // 30 Days
                  }
                }
              }
            ]
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GOOGLE_MAPS_PLATFORM_KEY': JSON.stringify(env.GOOGLE_MAPS_PLATFORM_KEY || env.VITE_GOOGLE_MAPS_API_KEY || '')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './vitest.setup.ts'
      }
    };
});
