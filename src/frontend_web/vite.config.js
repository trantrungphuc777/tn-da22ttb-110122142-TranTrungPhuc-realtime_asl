import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  resolve: {
    alias: {
      '@ASL': path.resolve(__dirname, '../../ASL_SIGN'),
      '@AtoZ': path.resolve(__dirname, '../../AtoZ_3.1')
    }
  },
  optimizeDeps: {
    include: ['recharts', 'react-is']
  },
  server: {
    fs: {
      allow: [
        path.resolve(__dirname, '../../'),
        path.resolve(__dirname, '../../ASL_SIGN'),
        path.resolve(__dirname, '../../AtoZ_3.1')
      ]
    }
  }
})
