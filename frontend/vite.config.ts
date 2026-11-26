import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5174,
    strictPort: true,
    proxy: {
      '/api/v1': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
});
