import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/health': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/features': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/companies': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/categories': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/process-company': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
})
