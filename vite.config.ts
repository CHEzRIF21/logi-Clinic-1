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
        // Stratégie de chunking simplifiée pour éviter les problèmes de dépendances circulaires
        manualChunks: {
          // React core - doit être chargé en premier
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Material-UI
          'vendor-mui': ['@mui/material', '@mui/icons-material', '@mui/x-data-grid', '@mui/x-date-pickers', '@emotion/react', '@emotion/styled'],
          // Supabase
          'vendor-supabase': ['@supabase/supabase-js'],
          // PDF
          'vendor-pdf': ['jspdf', 'jspdf-autotable'],
          // Charts
          'vendor-charts': ['recharts'],
          // Dates
          'vendor-dates': ['date-fns'],
          // Utils
          'vendor-utils': ['axios', 'jwt-decode', 'clsx', 'class-variance-authority', 'tailwind-merge'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
});

