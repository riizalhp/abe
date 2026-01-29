import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 9000,
      host: '0.0.0.0',
      mimeTypes: {
        'tsx': 'application/javascript',
      }
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    build: {
      // Performance optimizations
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunk for external libraries
            vendor: ['react', 'react-dom', 'react-router-dom'],
            // UI chunk for UI libraries
            ui: ['lucide-react', 'recharts'],
            // Supabase chunk
            supabase: ['@supabase/supabase-js'],
            // Utils chunk
            utils: ['qrcode-generator', 'jsqr']
          }
        }
      },
      // Security headers
      cssCodeSplit: true,
      sourcemap: false, // Disable source maps in production for security
      minify: 'esbuild' // Use esbuild instead of terser for now
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    // Security enhancements
    preview: {
      headers: {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'microphone=(self), camera=(self)'
      }
    }
  };
});
