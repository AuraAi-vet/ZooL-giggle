import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 5000000
      },
      manifest: {
        name: 'ZooL Internal',
        short_name: 'ZooL',
        description: 'Veterinary management app',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'https://placehold.co/192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'https://placehold.co/512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Check if the module is in node_modules
          if (id.includes('node_modules')) {
            // You can split specific packages or just return a general 'vendor' chunk
            if (id.includes('react')) {
              return 'vendor';
            }
          }
        }
      }
    }
  }
})
  define: {
    'process.env.GOOGLE_MAPS_PLATFORM_KEY': JSON.stringify(process.env.GOOGLE_MAPS_PLATFORM_KEY || '')
  },
  server: {
    port: parseInt(process.env.PORT || '3000'),
    host: '0.0.0.0',
    strictPort: true,
  },
  preview: {
    port: parseInt(process.env.PORT || '3000'),
    host: '0.0.0.0',
    strictPort: true,
  },
});
