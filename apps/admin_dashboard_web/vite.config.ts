import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { host: '0.0.0.0', port: 3000, allowedHosts: ['3000-igc9jh9sru88wad0t5ke3-16b0f6dc.sg2.manus.computer'] },
  preview: { host: '0.0.0.0', port: 3000 },
  build: {
    // MapLibre intentionally loads only with the lazy /map route.
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/recharts/') || id.includes('/node_modules/victory-vendor/') || id.includes('/node_modules/recharts-scale/') || id.includes('/node_modules/react-smooth/')) return 'charts';
          if (id.includes('/node_modules/maplibre-gl/') || id.includes('/node_modules/@maplibre/')) return 'map-vendor';
          if (id.includes('/node_modules/react/') || id.includes('/node_modules/react-dom/') || id.includes('/node_modules/react-router/')) return 'react-vendor';
        },
      },
    },
  },
});
