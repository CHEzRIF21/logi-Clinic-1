import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

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
  },
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom',
      '@mui/material', 
      '@emotion/react', 
      '@emotion/styled',
      'recharts', // On garde le fix précédent qui est important
    ],
  },
  build: {
    outDir: 'build',
    sourcemap: process.env.NODE_ENV === 'development',
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // 1. RECHARTS (Le fix précédent pour l'erreur 'S')
          if (id.includes('node_modules/recharts')) {
            return 'vendor-recharts';
          }

          // 2. LE CŒUR DE L'APPLICATION (Fix pour l'erreur 'ForwardRef')
          // On regroupe React, Router, MUI et Emotion ensemble pour garantir qu'ils se voient
          if (
            id.includes('node_modules/react') || 
            id.includes('node_modules/@mui') || 
            id.includes('node_modules/@emotion') ||
            id.includes('node_modules/react-router')
          ) {
            return 'vendor-core';
          }

          // 3. Les autres librairies lourdes séparées
          if (id.includes('node_modules/@supabase')) {
            return 'vendor-supabase';
          }
          if (id.includes('node_modules/jspdf')) {
            return 'vendor-pdf';
          }
          if (id.includes('node_modules/gsap')) {
            return 'vendor-gsap';
          }
          if (id.includes('node_modules/date-fns')) {
            return 'vendor-utils';
          }
        },
      },
    },
  },
});