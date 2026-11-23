import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'PrepCIT — Unofficial 2026 TOPCIT Simulator',
        short_name: 'PrepCIT',
        description:
          'Offline-capable 2026 TOPCIT examination simulator, interactive UML/ERD diagram studio, coding & SQL lab, and adaptive study planner.',
        theme_color: '#c81e1e',
        background_color: '#ffffff',
        display: 'standalone',
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,wasm,svg,png,woff2}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@xyflow')) return 'vendor-xyflow';
            if (id.includes('pdfjs-dist')) return 'vendor-pdfjs';
            if (id.includes('sql.js')) return 'vendor-sqljs';
            if (id.includes('dexie')) return 'vendor-dexie';
            if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts';
          }
          return undefined;
        },
      },
    },
  },
  server: {
    port: 5173,
    strictPort: false,
  },
});
