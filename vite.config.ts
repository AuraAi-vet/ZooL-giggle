import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'stats.html',
      title: 'ZooL Bundle Visualizer',
      template: 'treemap', // sunburst, treemap, network, raw, list
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  define: {
    'process.env.GOOGLE_MAPS_PLATFORM_KEY': JSON.stringify(process.env.GOOGLE_MAPS_PLATFORM_KEY || '')
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    strictPort: true,
  },
});
