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
  server: {
    port: 3000,
    host: '0.0.0.0',
    strictPort: true,
  },
});
