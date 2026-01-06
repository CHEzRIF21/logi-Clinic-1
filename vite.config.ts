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
    // Logs détaillés pour le débogage
    hmr: {
      overlay: true, // Afficher les erreurs dans le navigateur
    },
  },
  // Logs détaillés en mode développement
  logLevel: process.env.NODE_ENV === 'development' ? 'info' : 'warn',
  clearScreen: false, // Garder les logs visibles
  build: {
    outDir: 'build',
    sourcemap: process.env.NODE_ENV === 'development', // Sourcemaps seulement en dev
    chunkSizeWarningLimit: 2000, // Augmente la limite d'avertissement à 2MB
    minify: 'esbuild', // Utilise esbuild pour un minification plus rapide
    // Améliorer la gestion des assets statiques
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        // Stratégie de chunking simplifiée pour éviter les problèmes de dépendances circulaires
        manualChunks: (id) => {
          // React core - doit être chargé en premier
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router')) {
            return 'vendor-react';
          }
          // Material-UI
          if (id.includes('node_modules/@mui')) {
            return 'vendor-mui';
          }
          // Supabase
          if (id.includes('node_modules/@supabase')) {
            return 'vendor-supabase';
          }
          // GSAP (animations)
          if (id.includes('node_modules/gsap')) {
            return 'vendor-gsap';
          }
          // PDF
          if (id.includes('node_modules/jspdf')) {
            return 'vendor-pdf';
          }
          // Charts - Isoler recharts pour éviter les dépendances circulaires
          if (id.includes('node_modules/recharts')) {
            // Séparer recharts en chunks plus petits pour éviter les problèmes d'initialisation
            if (id.includes('recharts/lib')) {
              return 'vendor-charts-core';
            }
            return 'vendor-charts';
          }
          // Dates
          if (id.includes('node_modules/date-fns')) {
            return 'vendor-dates';
          }
          // Utils
          if (id.includes('node_modules/axios') || id.includes('node_modules/jwt-decode') || 
              id.includes('node_modules/clsx') || id.includes('node_modules/class-variance-authority') ||
              id.includes('node_modules/tailwind-merge')) {
            return 'vendor-utils';
          }
          // Pages (code splitting par route)
          if (id.includes('/pages/')) {
            const pageName = id.split('/pages/')[1]?.split('/')[0];
            if (pageName) {
              return `page-${pageName.toLowerCase()}`;
            }
          }
          // Composants lourds
          if (id.includes('/components/consultation/') || id.includes('/components/maternite/')) {
            return 'components-heavy';
          }
        },
      },
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@mui/material',
      '@mui/icons-material',
      '@mui/x-data-grid',
      '@mui/x-date-pickers',
      '@emotion/react',
      '@emotion/styled',
      '@supabase/supabase-js',
      'gsap',
      'recharts',
    ],
    exclude: [],
    // Forcer la résolution des dépendances pour éviter les problèmes circulaires
    esbuildOptions: {
      target: 'es2020',
    },
  },
});

