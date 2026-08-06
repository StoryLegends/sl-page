import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendTarget = env.VITE_BACKEND_URL || 'http://localhost:8080'

  return {
    base: env.VITE_BASE_URL || '/',
    define: {
      global: 'window',
    },
    server: {
      host: true,
      proxy: {
        '/api/ws': {
          target: backendTarget,
          ws: true,
          changeOrigin: true,
        },
        '/api': {
          target: backendTarget,
          changeOrigin: true,
        },
      },
    },
    preview: {
      host: true,
      port: 5174,
      proxy: {
        '/api/ws': {
          target: backendTarget,
          ws: true,
          changeOrigin: true,
        },
        '/api': {
          target: backendTarget,
          changeOrigin: true,
        },
      },
    },
    plugins: [
      react(),
      tailwindcss(),
    ],
  }
})
