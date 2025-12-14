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
    sourcemap: process.env.NODE_ENV === 'development', // Sourcemaps seulement en dev
    chunkSizeWarningLimit: 2000, // Augmente la limite d'avertissement à 2MB
    minify: 'esbuild', // Utilise esbuild pour un minification plus rapide
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
            // PDF et impression
            if (id.includes('jspdf') || id.includes('html2canvas')) {
              return 'vendor-pdf';
            }
            // Graphiques
            if (id.includes('recharts') || id.includes('d3')) {
              return 'vendor-charts';
            }
            // Formulaires et validation
            if (id.includes('react-hook-form') || id.includes('yup') || id.includes('zod')) {
              return 'vendor-forms';
            }
            // Dates
            if (id.includes('date-fns') || id.includes('moment') || id.includes('dayjs')) {
              return 'vendor-dates';
            }
            // Radix UI
            if (id.includes('@radix-ui')) {
              return 'vendor-radix';
            }
            // Autres dépendances importantes mais plus petites
            if (id.includes('axios') || id.includes('jwt-decode')) {
              return 'vendor-utils';
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
        // Éviter les problèmes de dépendances circulaires
        hoistTransitiveImports: false,
      },
      // Éviter les problèmes de minification avec les dépendances circulaires
      treeshake: {
        moduleSideEffects: false,
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
});

