import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';


dotenv.config();


export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    host: true,
    port: 5173,
    
    hmr: {
      
      timeout: 5000, 
    },
    watch: {
      
      usePolling: true, 
      interval: 1000, 
    }
  },
  preview: {
    host: true,
    port: 4173
  },

  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production', 
        drop_debugger: true
      }
    },

    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase': ['@supabase/supabase-js'],
          'ui': ['lucide-react'],
          'utils': ['uuid']
        }
      }
    },

    assetsInlineLimit: 4096, // 4KB

    target: 'es2020',

    reportCompressedSize: true,
    chunkSizeWarningLimit: 1000, // 1MB
    
    // PWA optimizations
    sourcemap: false,
    cssCodeSplit: true,
    outDir: 'dist',
    
    // Generate manifest and service worker
    manifest: true
  },

  define: {

    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || ''),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || '')
  }
});