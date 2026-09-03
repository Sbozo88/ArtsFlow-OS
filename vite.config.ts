import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react-router/') ||
            id.includes('node_modules/react-router-dom/')
          ) {
            return 'vendor-react';
          }
          if (
            id.includes('node_modules/@firebase/firestore') ||
            id.includes('node_modules/firebase/firestore')
          ) {
            return 'vendor-firestore';
          }
          if (
            id.includes('node_modules/@firebase/auth') ||
            id.includes('node_modules/firebase/auth')
          ) {
            return 'vendor-auth';
          }
          if (id.includes('node_modules/lucide-react/')) {
            return 'vendor-icons';
          }
          if (id.includes('node_modules/date-fns/')) {
            return 'vendor-dates';
          }
        }
      }
    }
  }
})
