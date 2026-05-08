import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // Remove the /api from here
        changeOrigin: true,
        // Optional: keep this if your backend expects /api
        // rewrite: (path) => path.replace(/^\/api/, '/api') 
      },
      '/ws': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        ws: true,
      }
    }
  }
})