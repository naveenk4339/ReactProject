import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Forward API calls to the Node backend during development.
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
});
