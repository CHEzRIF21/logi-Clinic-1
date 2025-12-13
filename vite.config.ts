import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3001,
    open: true,
    host: true,
    strictPort: false, // Permet d'utiliser un autre port si 3001 est occupé
  },
  build: {
    outDir: 'build',
    sourcemap: true,
    chunkSizeWarningLimit: 1000, // Augmente la limite d'avertissement à 1MB
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            // React et React DOM
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            // Material-UI
            if (id.includes('@mui')) {
              return 'vendor-mui';
            }
            // Supabase
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            // Autres dépendances importantes
            if (id.includes('html2canvas')) {
              return 'vendor-html2canvas';
            }
            // Toutes les autres dépendances node_modules
            return 'vendor-other';
          }
          // Chunks pour les services
          if (id.includes('/src/services/')) {
            return 'services';
          }
          // Chunks pour les pages
          if (id.includes('/src/pages/')) {
            return 'pages';
          }
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
});

