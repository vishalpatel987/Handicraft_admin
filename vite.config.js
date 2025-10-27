import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuration for API proxy - can be easily changed here
const API_BASE_URL = 'http://localhost:5175';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: API_BASE_URL,
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
