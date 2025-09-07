import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: '../public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true
  },
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/health': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
});
