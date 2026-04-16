import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => ({
  plugins: [
    tailwindcss(),
    react()
  ],
  // En producción elimina console.log/debug/info; conserva console.error y console.warn
  esbuild: {
    pure: mode === 'production' ? ['console.log', 'console.debug', 'console.info'] : [],
    drop: mode === 'production' ? ['debugger'] : [],
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: [
      'localhost',
      '.ngrok-free.app',
      '.ngrok.io'
    ],
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  },
  define: {
    'global': 'globalThis',
  },
  resolve: {
    alias: {
      'buffer': 'buffer/'
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  }
}))